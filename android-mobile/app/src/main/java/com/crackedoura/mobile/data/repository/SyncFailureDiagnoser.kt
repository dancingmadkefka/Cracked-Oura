package com.crackedoura.mobile.data.repository

import retrofit2.HttpException
import java.io.IOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLException

sealed class SyncFailureReason {
    abstract val userMessage: String

    data class NoServerConfigured(val detail: String) : SyncFailureReason() {
        override val userMessage = detail
    }

    data class MissingToken(val detail: String) : SyncFailureReason() {
        override val userMessage = detail
    }

    data class InvalidUrl(val url: String, val detail: String) : SyncFailureReason() {
        override val userMessage =
            if (url.isBlank()) detail else "Invalid server URL '$url': $detail"
    }

    data class DnsFailure(val url: String, val host: String) : SyncFailureReason() {
        override val userMessage =
            "Could not resolve host '${host.ifBlank { "(unknown)" }}' for $url. The phone's DNS does not know this name. Use a raw IP address, or enable Tailscale MagicDNS."
    }

    data class ConnectionRefused(val url: String) : SyncFailureReason() {
        override val userMessage =
            "$url refused the connection. Nothing is listening on that host:port. Make sure the desktop app is running and Mobile Sync is enabled."
    }

    data class ConnectionTimeout(val url: String) : SyncFailureReason() {
        override val userMessage =
            "$url did not respond before the timeout. The address is unreachable from this network. Common causes: Tailscale is not running on this phone, or the Windows firewall on the desktop is blocking the port."
    }

    data class NoRouteToHost(val url: String) : SyncFailureReason() {
        override val userMessage =
            "No network route to $url. This phone has no path to that address. If you are off your home LAN you need Tailscale (or another VPN) enabled on both the phone and the desktop."
    }

    data class SslFailure(val url: String, val detail: String) : SyncFailureReason() {
        override val userMessage =
            "TLS error contacting $url${if (detail.isNotBlank()) ": $detail" else ""}. The desktop mobile server is HTTP only — remove https:// from the URL."
    }

    data class TokenRejected(val url: String) : SyncFailureReason() {
        override val userMessage =
            "$url rejected the sync token (HTTP 401). Generate a fresh token in the desktop app and paste it here."
    }

    data class Forbidden(val url: String) : SyncFailureReason() {
        override val userMessage = "$url returned HTTP 403. The desktop app blocked the request."
    }

    data class EndpointMissing(val url: String) : SyncFailureReason() {
        override val userMessage =
            "$url returned HTTP 404 for the mobile sync endpoint. The desktop app is probably outdated — rebuild it."
    }

    data class ServerNotEnabled(val url: String) : SyncFailureReason() {
        override val userMessage =
            "$url reports that mobile sync is not enabled (HTTP 503). Enable Mobile Sync in the desktop app's settings."
    }

    data class ServerError(val url: String, val code: Int, val detail: String?) : SyncFailureReason() {
        override val userMessage = buildString {
            append(url).append(" returned HTTP ").append(code)
            if (!detail.isNullOrBlank()) append(": ").append(detail)
            append(". Check the desktop logs.")
        }
    }

    data class NetworkError(val url: String, val detail: String) : SyncFailureReason() {
        override val userMessage = "Network error talking to $url: $detail"
    }

    data class AllCandidatesFailed(val perUrl: List<Pair<String, SyncFailureReason>>) : SyncFailureReason() {
        override val userMessage = buildString {
            append("Could not sync against any configured server:")
            perUrl.forEach { (_, reason) -> append("\n• ").append(reason.userMessage) }
        }
    }

    data class Unknown(val url: String?, val detail: String) : SyncFailureReason() {
        override val userMessage =
            if (!url.isNullOrBlank()) "Sync to $url failed: $detail" else "Sync failed: $detail"
    }
}

fun SyncFailureReason.isTerminal(): Boolean = when (this) {
    is SyncFailureReason.MissingToken,
    is SyncFailureReason.NoServerConfigured -> true
    else -> false
}

object SyncFailureDiagnoser {
    fun classify(throwable: Throwable, attemptedUrl: String?): SyncFailureReason {
        val url = attemptedUrl.orEmpty()
        return when (val t = throwable) {
            is IllegalArgumentException -> SyncFailureReason.InvalidUrl(url, t.message ?: "invalid configuration")
            is HttpException -> classifyHttp(t, url)
            is UnknownHostException -> SyncFailureReason.DnsFailure(url, extractHost(t.message))
            is ConnectException -> SyncFailureReason.ConnectionRefused(url)
            is SocketTimeoutException -> SyncFailureReason.ConnectionTimeout(url)
            is NoRouteToHostException -> SyncFailureReason.NoRouteToHost(url)
            is SSLException -> SyncFailureReason.SslFailure(url, t.message.orEmpty())
            is IOException -> classifyIoFallback(t, url)
            else -> SyncFailureReason.Unknown(url.ifBlank { null }, t.message ?: t::class.java.simpleName)
        }
    }

    private fun classifyHttp(http: HttpException, url: String): SyncFailureReason {
        val detail = try {
            http.response()?.errorBody()?.string()?.take(200)?.trim().takeUnless { it.isNullOrBlank() }
        } catch (_: Throwable) { null }
        return when (http.code()) {
            401 -> SyncFailureReason.TokenRejected(url)
            403 -> SyncFailureReason.Forbidden(url)
            404 -> SyncFailureReason.EndpointMissing(url)
            503 -> SyncFailureReason.ServerNotEnabled(url)
            else -> SyncFailureReason.ServerError(url, http.code(), detail)
        }
    }

    private fun classifyIoFallback(io: IOException, url: String): SyncFailureReason {
        val msg = io.message.orEmpty()
        return when {
            msg.contains("Unable to resolve host", ignoreCase = true) ->
                SyncFailureReason.DnsFailure(url, extractHost(msg))
            msg.contains("ECONNREFUSED", ignoreCase = true) ||
                msg.contains("Connection refused", ignoreCase = true) ->
                SyncFailureReason.ConnectionRefused(url)
            msg.contains("ETIMEDOUT", ignoreCase = true) ||
                msg.contains("timed out", ignoreCase = true) ||
                msg.contains("timeout", ignoreCase = true) ->
                SyncFailureReason.ConnectionTimeout(url)
            msg.contains("EHOSTUNREACH", ignoreCase = true) ||
                msg.contains("ENETUNREACH", ignoreCase = true) ||
                msg.contains("No route to host", ignoreCase = true) ->
                SyncFailureReason.NoRouteToHost(url)
            else -> SyncFailureReason.NetworkError(url, msg.ifBlank { io::class.java.simpleName })
        }
    }

    private fun extractHost(message: String?): String {
        if (message.isNullOrBlank()) return ""
        Regex("\"([^\"]+)\"").find(message)?.groupValues?.getOrNull(1)?.let { return it }
        return message.substringAfter(":").trim().substringBefore(" ")
    }
}
