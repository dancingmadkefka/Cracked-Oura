package com.crackedoura.mobile.data.remote

import com.crackedoura.mobile.util.AppLogger
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Url
import java.util.concurrent.TimeUnit

interface MobileApiService {
    @GET
    suspend fun ping(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
    ): MobileServerStatusDto

    @GET
    suspend fun sync(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
        @Query("window_days") windowDays: Int,
    ): MobileSyncResponseDto

    @GET
    suspend fun insightsForDay(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
    ): TodayInsightsDto

    // ── Phase 2: Analysis endpoints ──────────────────────────────────────────

    @GET
    suspend fun getAnalysisCatalog(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
    ): List<MetricSpecDto>

    @GET
    suspend fun getCorrelation(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
        @Query("x_metric") xMetric: String,
        @Query("y_metric") yMetric: String,
        @Query("lag_days") lagDays: Int,
        @Query("method") method: String,
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String,
    ): CorrelationResponseDto

    @GET
    suspend fun getAnomalies(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
        @Query("window_days") windowDays: Int,
        @Query("baseline_window") baselineWindow: Int,
    ): List<AnomalyResponseDto>

    // ── Phase 2: Investigation CRUD ───────────────────────────────────────────

    @GET
    suspend fun listInvestigations(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
    ): List<SavedInvestigationDto>

    @POST
    suspend fun createInvestigation(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
        @Body body: InvestigationCreateDto,
    ): SavedInvestigationDto

    @HTTP(method = "DELETE", hasBody = false)
    suspend fun deleteInvestigation(
        @Url url: String,
        @Header("X-Cracked-Oura-Token") token: String,
    )
}

object MobileApiServiceFactory {
    private const val TAG = "Http"

    fun create(): MobileApiService {
        val json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
        }

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
            redactHeader("X-Cracked-Oura-Token")
        }

        val auditInterceptor = Interceptor { chain ->
            val request = chain.request()
            AppLogger.d(TAG, "HTTP ${request.method} ${request.url}")
            val response = try {
                chain.proceed(request)
            } catch (throwable: Throwable) {
                AppLogger.w(TAG, "HTTP failed ${request.method} ${request.url}", throwable)
                throw throwable
            }
            AppLogger.d(TAG, "HTTP ${response.code} ${request.method} ${request.url}")
            response
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(auditInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl("https://placeholder.invalid/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        return retrofit.create(MobileApiService::class.java)
    }
}
