package com.crackedoura.mobile.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

object ServerReachabilityDetector {
    private const val PING_TIMEOUT_MS = 2_000L

    data class ReachabilityResult(
        val url: String,
        val reachable: Boolean,
        val latencyMs: Long,
    )

    private val pingClient = OkHttpClient.Builder()
        .connectTimeout(PING_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .readTimeout(PING_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .writeTimeout(PING_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .build()

    private val mutex = Mutex()

    suspend fun probeAll(urls: List<String>, token: String): List<ReachabilityResult> =
        mutex.withLock {
            coroutineScope {
                urls.map { url ->
                    async {
                        withContext(Dispatchers.IO) {
                            val start = System.nanoTime()
                            try {
                                val request = Request.Builder()
                                    .url("$url/api/mobile/ping")
                                    .header("X-Cracked-Oura-Token", token)
                                    .build()
                                val response = pingClient.newCall(request).execute()
                                val latencyMs = (System.nanoTime() - start) / 1_000_000
                                response.close()
                                if (response.isSuccessful) {
                                    ReachabilityResult(url, true, latencyMs)
                                } else {
                                    ReachabilityResult(url, false, Long.MAX_VALUE)
                                }
                            } catch (_: IOException) {
                                ReachabilityResult(url, false, Long.MAX_VALUE)
                            }
                        }
                    }
                }.map { it.await() }
                    .sortedBy { it.latencyMs }
            }
        }
}
