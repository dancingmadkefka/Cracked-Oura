package com.crackedoura.mobile.data.repository

import com.crackedoura.mobile.data.local.AppDatabase
import com.crackedoura.mobile.data.local.OuraDao
import com.crackedoura.mobile.data.remote.MobileApiService
import com.crackedoura.mobile.data.repository.ServerReachabilityDetector.ReachabilityResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.coVerifyOrder
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.net.ConnectException
import java.net.SocketTimeoutException

class OuraRepositorySyncNowTest {

    private val database: AppDatabase = mockk(relaxed = true)
    private val dao: OuraDao = mockk(relaxed = true)
    private val api: MobileApiService = mockk()
    private val prefs: SyncPreferencesRepository = mockk(relaxed = true)

    private val repo = OuraRepository(database, dao, api, prefs)

    private val validToken = "ABCDEF0123456789xyz"
    private val local = "http://192.168.178.25:8037"
    private val tail = "http://100.64.0.1:8037"

    @Before
    fun setUp() {
        mockkObject(ServerReachabilityDetector)
    }

    @After
    fun tearDown() {
        unmockkObject(ServerReachabilityDetector)
    }

    private fun settings(
        local: String = this.local,
        tail: String = this.tail,
        preferredNetwork: String = "auto",
        token: String = validToken,
    ) = SyncSettings(
        localServerUrl = local,
        tailscaleServerUrl = tail,
        preferredNetwork = preferredNetwork,
        token = token,
        windowDays = 180,
    )

    @Test
    fun `missing token returns MissingToken failure`() = runTest {
        coEvery { prefs.currentSettings() } returns settings(token = "")

        val result = repo.syncNow()

        assertTrue(result.isFailure)
        val ex = result.exceptionOrNull() as SyncFailureException
        assertTrue(ex.reason is SyncFailureReason.MissingToken)
        coVerify { prefs.recordSyncFailure(any()) }
    }

    @Test
    fun `no configured urls returns NoServerConfigured`() = runTest {
        coEvery { prefs.currentSettings() } returns settings(local = "", tail = "")

        val result = repo.syncNow()

        assertTrue(result.isFailure)
        val ex = result.exceptionOrNull() as SyncFailureException
        assertTrue(ex.reason is SyncFailureReason.NoServerConfigured)
    }

    @Test
    fun `preferredNetwork local only uses local url and ignores tailscale`() = runTest {
        coEvery { prefs.currentSettings() } returns settings(preferredNetwork = "local")
        coEvery { api.ping(any(), any()) } throws ConnectException("refused")

        val result = repo.syncNow()

        assertTrue(result.isFailure)
        val ex = result.exceptionOrNull() as SyncFailureException
        assertTrue(ex.reason is SyncFailureReason.ConnectionRefused)
        coVerify(exactly = 1) { api.ping(match { it.startsWith(local) }, any()) }
        coVerify(exactly = 0) { api.ping(match { it.startsWith(tail) }, any()) }
    }

    @Test
    fun `single terminal failure 401 returns TokenRejected and is recorded`() = runTest {
        coEvery { prefs.currentSettings() } returns settings(preferredNetwork = "local")
        coEvery { api.ping(any(), any()) } throws httpException(401)

        val result = repo.syncNow()

        val ex = result.exceptionOrNull() as SyncFailureException
        assertTrue(ex.reason is SyncFailureReason.TokenRejected)
        coVerify { prefs.recordSyncFailure(match { it.contains("401") }) }
    }

    @Test
    fun `auto mode probes both urls and tries reachable first then unreachable`() = runTest {
        coEvery { prefs.currentSettings() } returns settings()
        coEvery { ServerReachabilityDetector.probeAll(any(), any()) } returns listOf(
            ReachabilityResult(tail, true, 12L),
            ReachabilityResult(local, false, Long.MAX_VALUE),
        )
        coEvery { api.ping(match { it.startsWith(tail) }, any()) } throws SocketTimeoutException("t")
        coEvery { api.ping(match { it.startsWith(local) }, any()) } throws ConnectException("refused")

        val result = repo.syncNow()

        val ex = result.exceptionOrNull() as SyncFailureException
        val reason = ex.reason
        assertTrue(reason is SyncFailureReason.AllCandidatesFailed)
        reason as SyncFailureReason.AllCandidatesFailed
        assertEquals(2, reason.perUrl.size)
        assertEquals(tail, reason.perUrl[0].first)
        assertEquals(local, reason.perUrl[1].first)
        assertTrue(reason.perUrl[0].second is SyncFailureReason.ConnectionTimeout)
        assertTrue(reason.perUrl[1].second is SyncFailureReason.ConnectionRefused)
        assertTrue(ex.message!!.contains("Could not sync against any configured server"))
        coVerifyOrder {
            api.ping(match { it.startsWith(tail) }, any())
            api.ping(match { it.startsWith(local) }, any())
        }
    }

    @Test
    fun `401 TokenRejected on first candidate fails over to second candidate`() = runTest {
        coEvery { prefs.currentSettings() } returns settings()
        coEvery { ServerReachabilityDetector.probeAll(any(), any()) } returns listOf(
            ReachabilityResult(local, true, 5L),
            ReachabilityResult(tail, true, 6L),
        )
        coEvery { api.ping(match { it.startsWith(local) }, any()) } throws httpException(401)
        coEvery { api.ping(match { it.startsWith(tail) }, any()) } throws httpException(404)

        val result = repo.syncNow()

        val ex = result.exceptionOrNull() as SyncFailureException
        assertTrue(ex.reason is SyncFailureReason.AllCandidatesFailed)
        val reason = ex.reason as SyncFailureReason.AllCandidatesFailed
        assertTrue(reason.perUrl[0].second is SyncFailureReason.TokenRejected)
        assertTrue(reason.perUrl[1].second is SyncFailureReason.EndpointMissing)
        coVerify(exactly = 2) { api.ping(any(), any()) }
    }

    private fun httpException(code: Int): HttpException {
        val response: Response<Any> = Response.error(
            code,
            "err".toResponseBody("text/plain".toMediaType()),
        )
        return HttpException(response)
    }
}
