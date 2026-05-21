package com.crackedoura.mobile.data.repository

import androidx.room.withTransaction
import com.crackedoura.mobile.data.local.AppDatabase
import com.crackedoura.mobile.data.local.DailySummaryEntity
import com.crackedoura.mobile.data.local.OuraDao
import com.crackedoura.mobile.data.local.WorkoutEntity
import com.crackedoura.mobile.data.remote.MobileApiService
import com.crackedoura.mobile.data.remote.MobileSyncResponseDto
import com.crackedoura.mobile.data.remote.toEntity
import com.crackedoura.mobile.util.AppLogger
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow

class SyncFailureException(
    message: String,
    val reason: SyncFailureReason? = null,
) : IllegalStateException(message)

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

    private suspend fun candidatesInOrder(settings: SyncSettings): List<String> {
        val raw = when (settings.preferredNetwork) {
            "local" -> listOfNotNull(settings.localServerUrl.takeIf { it.isNotBlank() })
            "tailscale" -> listOfNotNull(settings.tailscaleServerUrl.takeIf { it.isNotBlank() })
            else -> listOfNotNull(
                settings.localServerUrl.takeIf { it.isNotBlank() },
                settings.tailscaleServerUrl.takeIf { it.isNotBlank() },
            )
        }
        if (raw.size <= 1 || settings.token.isBlank()) return raw

        val probes = ServerReachabilityDetector.probeAll(raw, settings.token)
        val reachable = probes.filter { it.reachable }.map { it.url }
        val unreachable = raw.filter { url -> reachable.none { it == url } }
        return reachable + unreachable
    }

    suspend fun syncNow(): Result<Unit> {
        val settings = try {
            preferencesRepository.currentSettings()
        } catch (t: CancellationException) {
            throw t
        } catch (t: Throwable) {
            val reason = SyncFailureReason.Unknown(null, "Could not read sync settings: ${t.message ?: t::class.java.simpleName}")
            return fail(reason)
        }

        if (settings.token.isBlank()) {
            return fail(SyncFailureReason.MissingToken("Paste the sync token from the desktop app in Settings."))
        }

        val candidates = try {
            candidatesInOrder(settings)
        } catch (t: CancellationException) {
            throw t
        } catch (t: Throwable) {
            AppLogger.w(TAG, "Reachability probe threw, falling back to raw candidate order", t)
            when (settings.preferredNetwork) {
                "local" -> listOfNotNull(settings.localServerUrl.takeIf { it.isNotBlank() })
                "tailscale" -> listOfNotNull(settings.tailscaleServerUrl.takeIf { it.isNotBlank() })
                else -> listOfNotNull(
                    settings.localServerUrl.takeIf { it.isNotBlank() },
                    settings.tailscaleServerUrl.takeIf { it.isNotBlank() },
                )
            }
        }
        if (candidates.isEmpty()) {
            return fail(SyncFailureReason.NoServerConfigured(noServerMessage(settings.preferredNetwork)))
        }

        AppLogger.i(TAG, "Sync starting candidates=${candidates.joinToString()} windowDays=${settings.windowDays}")

        val perUrlFailures = mutableListOf<Pair<String, SyncFailureReason>>()
        for ((index, candidate) in candidates.withIndex()) {
            AppLogger.i(TAG, "Sync attempt ${index + 1}/${candidates.size} url=$candidate")
            try {
                val response = attemptSync(candidate, settings)
                preferencesRepository.recordSyncSuccess(response.generatedAt)
                preferencesRepository.recordSuccessfulUrl(candidate)
                AppLogger.i(TAG, "Sync succeeded url=$candidate")
                return Result.success(Unit)
            } catch (t: CancellationException) {
                AppLogger.i(TAG, "Sync cancelled url=$candidate")
                throw t
            } catch (t: Throwable) {
                val reason = SyncFailureDiagnoser.classify(t, candidate)
                AppLogger.w(TAG, "Sync attempt failed url=$candidate reason=${reason::class.java.simpleName}: ${reason.userMessage}", t)
                perUrlFailures += candidate to reason
                if (reason.isTerminal()) break
            }
        }

        val combined = if (perUrlFailures.size == 1) perUrlFailures.first().second
        else SyncFailureReason.AllCandidatesFailed(perUrlFailures.toList())
        return fail(combined)
    }

    private suspend fun attemptSync(url: String, settings: SyncSettings): MobileSyncResponseDto {
        val validated = SyncConfigValidator.validatedConfigForSave(url, settings.token, settings.windowDays)
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
        AppLogger.i(TAG, "Sync persisted url=${validated.serverUrl} summaries=${summaries.size} workouts=${workouts.size}")
        return response
    }

    private suspend fun fail(reason: SyncFailureReason): Result<Unit> {
        val message = reason.userMessage
        preferencesRepository.recordSyncFailure(message)
        AppLogger.e(TAG, "Sync failed: $message")
        return Result.failure(SyncFailureException(message, reason))
    }

    private fun noServerMessage(preferredNetwork: String): String = when (preferredNetwork) {
        "local" -> "No local LAN server URL configured. Add one in Settings."
        "tailscale" -> "No Tailscale server URL configured. Add one in Settings."
        else -> "No server URLs configured. Add at least one address in Settings."
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
}
