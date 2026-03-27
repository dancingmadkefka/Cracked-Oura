package com.crackedoura.mobile.data.repository

import androidx.room.withTransaction
import com.crackedoura.mobile.data.local.AppDatabase
import com.crackedoura.mobile.data.local.DailySummaryEntity
import com.crackedoura.mobile.data.local.OuraDao
import com.crackedoura.mobile.data.local.WorkoutEntity
import com.crackedoura.mobile.data.remote.MobileApiService
import com.crackedoura.mobile.data.remote.toEntity
import com.crackedoura.mobile.util.AppLogger
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import java.io.IOException
import retrofit2.HttpException

class SyncFailureException(message: String) : IllegalStateException(message)

class OuraRepository(
    private val database: AppDatabase,
    private val dao: OuraDao,
    private val apiService: MobileApiService,
    private val preferencesRepository: SyncPreferencesRepository,
) {
    private companion object {
        const val TAG = "Repository"
    }

    fun observeSettings(): Flow<SyncSettings> = preferencesRepository.settings

    fun observeLatestSummary(): Flow<DailySummaryEntity?> = dao.observeLatestSummary()

    fun observeRecentSummaries(limit: Int): Flow<List<DailySummaryEntity>> =
        dao.observeRecentSummaries(limit)

    fun observeRecentWorkouts(limit: Int): Flow<List<WorkoutEntity>> =
        dao.observeRecentWorkouts(limit)

    suspend fun saveDarkMode(enabled: Boolean?) {
        preferencesRepository.saveDarkMode(enabled)
    }

    suspend fun saveSyncSettings(
        localServerUrl: String,
        tailscaleServerUrl: String,
        preferredNetwork: String,
        token: String,
        windowDays: Int,
    ) {
        preferencesRepository.saveSettings(localServerUrl, tailscaleServerUrl, preferredNetwork, token, windowDays)
        AppLogger.i(TAG, "Settings saved windowDays=$windowDays")
    }

    private suspend fun resolveServerUrl(): String {
        val settings = preferencesRepository.currentSettings()
        return when (settings.preferredNetwork) {
            "local" -> settings.localServerUrl
            "tailscale" -> settings.tailscaleServerUrl
            else -> autoDetect(settings)
        }
    }

    private suspend fun autoDetect(settings: SyncSettings): String {
        val candidates = listOfNotNull(
            settings.localServerUrl.takeIf { it.isNotBlank() },
            settings.tailscaleServerUrl.takeIf { it.isNotBlank() },
        )
        if (candidates.isEmpty()) return ""
        if (candidates.size == 1) return candidates.first()

        val token = settings.token
        if (token.isBlank()) return settings.lastUsedUrl ?: candidates.first()

        val results = ServerReachabilityDetector.probeAll(candidates, token)
        val fastest = results.firstOrNull { it.reachable }
        return if (fastest != null) fastest.url else (settings.lastUsedUrl ?: candidates.first())
    }

    suspend fun syncNow(): Result<Unit> {
        return try {
            val settings = preferencesRepository.currentSettings()
            val serverUrl = resolveServerUrl()
            if (serverUrl.isBlank()) {
                return Result.failure(SyncFailureException("No server URL configured."))
            }

            val validated = SyncConfigValidator.validatedConfigForSave(serverUrl, settings.token, settings.windowDays)

            AppLogger.i(TAG, "Starting sync url=${validated.serverUrl} windowDays=${validated.windowDays}")

            apiService.ping("${validated.serverUrl}/api/mobile/ping", validated.token)
            val response = apiService.sync(
                url = "${validated.serverUrl}/api/mobile/sync",
                token = validated.token,
                windowDays = validated.windowDays,
            )

            val summaries = response.days.map { it.toEntity() }
            val workouts = response.workouts.map { it.toEntity() }

            persistSyncResponse(
                summaries = summaries,
                workouts = workouts,
                availableStartDay = response.availableStartDay,
            )

            preferencesRepository.recordSyncSuccess(response.generatedAt)
            preferencesRepository.recordSuccessfulUrl(validated.serverUrl)
            AppLogger.i(TAG, "Sync finished summaries=${summaries.size} workouts=${workouts.size}")
            Result.success(Unit)
        } catch (throwable: CancellationException) {
            AppLogger.i(TAG, "Sync cancelled")
            throw throwable
        } catch (throwable: Exception) {
            val userMessage = throwable.toUserMessage()
            preferencesRepository.recordSyncFailure(userMessage)
            AppLogger.e(TAG, "Sync failed: $userMessage", throwable)
            Result.failure(SyncFailureException(userMessage))
        }
    }

    private suspend fun persistSyncResponse(
        summaries: List<DailySummaryEntity>,
        workouts: List<WorkoutEntity>,
        availableStartDay: String?,
    ) {
        database.withTransaction {
            if (summaries.isNotEmpty()) {
                dao.upsertDailySummaries(summaries)
            }
            if (workouts.isNotEmpty()) {
                dao.upsertWorkouts(workouts)
            }
            if (!availableStartDay.isNullOrBlank()) {
                dao.deleteSummariesBefore(availableStartDay)
                dao.deleteWorkoutsBefore(availableStartDay)
            }
        }
    }

    private fun Throwable.toUserMessage(): String {
        return when (this) {
            is IllegalArgumentException -> message ?: "Check the sync settings and try again."
            is HttpException -> when (code()) {
                401 -> "The sync token was rejected. Generate a fresh token in the desktop app."
                403 -> "The mobile API request was blocked by the desktop app."
                404 -> "The mobile sync endpoint was not found. Confirm the desktop app was rebuilt."
                503 -> "Mobile sync is not enabled on the desktop app yet."
                else -> "Desktop sync server returned HTTP ${code()}. Check the desktop logs."
            }
            is IOException -> message?.let { raw ->
                when {
                    "port 80" in raw -> "The server URL is missing port 8037. Use the full desktop address."
                    "failed to connect" in raw -> "Could not reach the desktop server. Check the IP address, port, and firewall."
                    "timeout" in raw.lowercase() -> "The desktop server did not respond in time."
                    else -> "Network error while contacting the desktop server."
                }
            } ?: "Network error while contacting the desktop server."
            else -> message ?: "Sync failed for an unknown reason."
        }
    }
}
