package com.crackedoura.mobile.data.repository

import io.mockk.every
import io.mockk.mockk
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLHandshakeException

class SyncFailureDiagnoserTest {

    private val url = "http://192.168.178.25:8037"

    @Test
    fun `IllegalArgumentException maps to InvalidUrl with detail`() {
        val reason = SyncFailureDiagnoser.classify(IllegalArgumentException("bad port"), url)
        assertTrue(reason is SyncFailureReason.InvalidUrl)
        assertEquals(url, (reason as SyncFailureReason.InvalidUrl).url)
        assertTrue(reason.userMessage.contains("bad port"))
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `UnknownHostException maps to DnsFailure and extracts host from message`() {
        val ex = UnknownHostException("Unable to resolve host \"oura.local\": No address associated with hostname")
        val reason = SyncFailureDiagnoser.classify(ex, url)
        assertTrue(reason is SyncFailureReason.DnsFailure)
        reason as SyncFailureReason.DnsFailure
        assertEquals("oura.local", reason.host)
        assertTrue(reason.userMessage.contains("oura.local"))
    }

    @Test
    fun `ConnectException maps to ConnectionRefused`() {
        val reason = SyncFailureDiagnoser.classify(ConnectException("Connection refused"), url)
        assertTrue(reason is SyncFailureReason.ConnectionRefused)
        assertTrue(reason.userMessage.contains(url))
    }

    @Test
    fun `SocketTimeoutException maps to ConnectionTimeout`() {
        val reason = SyncFailureDiagnoser.classify(SocketTimeoutException("timeout"), url)
        assertTrue(reason is SyncFailureReason.ConnectionTimeout)
        assertTrue(reason.userMessage.contains(url))
    }

    @Test
    fun `NoRouteToHostException maps to NoRouteToHost`() {
        val reason = SyncFailureDiagnoser.classify(NoRouteToHostException("no route"), url)
        assertTrue(reason is SyncFailureReason.NoRouteToHost)
        assertTrue(reason.userMessage.contains(url))
    }

    @Test
    fun `SSLException maps to non-terminal SslFailure`() {
        val reason = SyncFailureDiagnoser.classify(SSLHandshakeException("cert"), url)
        assertTrue(reason is SyncFailureReason.SslFailure)
        assertTrue(!reason.isTerminal())
        assertTrue(reason.userMessage.contains("HTTP only"))
    }

    @Test
    fun `HttpException 401 is non-terminal TokenRejected`() {
        val reason = SyncFailureDiagnoser.classify(httpException(401, "unauth"), url)
        assertTrue(reason is SyncFailureReason.TokenRejected)
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `HttpException 403 is non-terminal Forbidden`() {
        val reason = SyncFailureDiagnoser.classify(httpException(403, "no"), url)
        assertTrue(reason is SyncFailureReason.Forbidden)
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `HttpException 404 is non-terminal EndpointMissing`() {
        val reason = SyncFailureDiagnoser.classify(httpException(404, "missing"), url)
        assertTrue(reason is SyncFailureReason.EndpointMissing)
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `HttpException 503 is non-terminal ServerNotEnabled`() {
        val reason = SyncFailureDiagnoser.classify(httpException(503, "off"), url)
        assertTrue(reason is SyncFailureReason.ServerNotEnabled)
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `HttpException 5xx maps to non-terminal ServerError carrying code`() {
        val reason = SyncFailureDiagnoser.classify(httpException(502, "bad gw"), url)
        assertTrue(reason is SyncFailureReason.ServerError)
        reason as SyncFailureReason.ServerError
        assertEquals(502, reason.code)
        assertTrue(!reason.isTerminal())
    }

    @Test
    fun `IOException with ECONNREFUSED falls back to ConnectionRefused`() {
        val reason = SyncFailureDiagnoser.classify(IOException("syscall ECONNREFUSED"), url)
        assertTrue(reason is SyncFailureReason.ConnectionRefused)
    }

    @Test
    fun `IOException with EHOSTUNREACH falls back to NoRouteToHost`() {
        val reason = SyncFailureDiagnoser.classify(IOException("EHOSTUNREACH (No route to host)"), url)
        assertTrue(reason is SyncFailureReason.NoRouteToHost)
    }

    @Test
    fun `IOException with timeout falls back to ConnectionTimeout`() {
        val reason = SyncFailureDiagnoser.classify(IOException("connect timed out"), url)
        assertTrue(reason is SyncFailureReason.ConnectionTimeout)
    }

    @Test
    fun `unrecognised IOException maps to NetworkError`() {
        val reason = SyncFailureDiagnoser.classify(IOException("something odd"), url)
        assertTrue(reason is SyncFailureReason.NetworkError)
        assertTrue(reason.userMessage.contains("something odd"))
    }

    @Test
    fun `unknown throwable maps to Unknown with url omitted when blank`() {
        val reason = SyncFailureDiagnoser.classify(RuntimeException("boom"), "")
        assertTrue(reason is SyncFailureReason.Unknown)
        assertTrue(reason.userMessage.contains("boom"))
    }

    private fun httpException(code: Int, body: String): HttpException {
        val response: Response<Any> = Response.error(
            code,
            body.toResponseBody("text/plain".toMediaType()),
        )
        return mockk<HttpException>().also {
            every { it.code() } returns code
            every { it.response() } returns response
            every { it.message } returns "HTTP $code"
        }
    }
}
