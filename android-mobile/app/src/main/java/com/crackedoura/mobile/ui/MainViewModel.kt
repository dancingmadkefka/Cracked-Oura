package com.crackedoura.mobile.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.crackedoura.mobile.data.local.DailySummaryEntity
import com.crackedoura.mobile.data.local.WorkoutEntity
import com.crackedoura.mobile.data.remote.SyncFreshnessDto
import com.crackedoura.mobile.data.remote.TodayInsightsDto
import com.crackedoura.mobile.data.repository.OuraRepository
import com.crackedoura.mobile.data.repository.SyncSettings
import com.crackedoura.mobile.data.sync.BackgroundSyncScheduler
import com.crackedoura.mobile.util.AppLogger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SyncUiState(
    val isSyncing: Boolean = false,
    val syncMessage: String? = null,
)

data class MainUiState(
    val settings: SyncSettings = SyncSettings(),
    val latestSummary: DailySummaryEntity? = null,
    val recentSummaries: List<DailySummaryEntity> = emptyList(),
    val recentWorkouts: List<WorkoutEntity> = emptyList(),
    val isSyncing: Boolean = false,
    val syncMessage: String? = null,
    val darkMode: Boolean? = null,
    val todayInsights: TodayInsightsDto? = null,
    val syncFreshness: SyncFreshnessDto? = null,
)

class MainViewModel(private val repository: OuraRepository) : ViewModel() {
    private companion object {
        const val TAG = "MainViewModel"
        const val MAX_SUMMARY_DAYS = 365
        const val MAX_WORKOUT_ROWS = 1500
    }

    private val syncState = MutableStateFlow(SyncUiState())

    val uiState: StateFlow<MainUiState> = combine(
        combine(
            repository.observeSettings(),
            repository.observeLatestSummary(),
            repository.observeRecentSummaries(limit = MAX_SUMMARY_DAYS),
            repository.observeRecentWorkouts(limit = MAX_WORKOUT_ROWS),
            syncState,
        ) { settings, latest, recent, workouts, sync ->
            CoreState(settings, latest, recent, workouts, sync)
        },
        repository.observeTodayInsights(),
        repository.observeSyncFreshness(),
    ) { core, insights, freshness ->
        MainUiState(
            settings = core.settings,
            latestSummary = core.latest,
            recentSummaries = core.recent,
            recentWorkouts = core.workouts,
            isSyncing = core.sync.isSyncing,
            syncMessage = core.sync.syncMessage,
            darkMode = core.settings.darkMode,
            todayInsights = insights,
            syncFreshness = freshness,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = MainUiState(),
    )

    private data class CoreState(
        val settings: SyncSettings,
        val latest: DailySummaryEntity?,
        val recent: List<DailySummaryEntity>,
        val workouts: List<WorkoutEntity>,
        val sync: SyncUiState,
    )

    fun saveSettings(localServerUrl: String, tailscaleServerUrl: String, preferredNetwork: String, token: String, windowDays: Int) {
        viewModelScope.launch {
            runCatching {
                repository.saveSyncSettings(localServerUrl, tailscaleServerUrl, preferredNetwork, token, windowDays)
            }.onSuccess {
                AppLogger.i(TAG, "Settings saved")
                syncState.update { it.copy(syncMessage = "Configuration saved.") }
            }.onFailure { throwable ->
                AppLogger.w(TAG, "Saving settings failed", throwable)
                syncState.update {
                    it.copy(syncMessage = throwable.message ?: "Could not save configuration.")
                }
            }
        }
    }

    fun saveSettingsAndSync(localServerUrl: String, tailscaleServerUrl: String, preferredNetwork: String, token: String, windowDays: Int) {
        if (syncState.value.isSyncing) return

        viewModelScope.launch {
            val saveResult = runCatching {
                repository.saveSyncSettings(localServerUrl, tailscaleServerUrl, preferredNetwork, token, windowDays)
            }
            if (saveResult.isFailure) {
                syncState.update {
                    it.copy(
                        syncMessage = saveResult.exceptionOrNull()?.message
                            ?: "Could not save configuration.",
                    )
                }
                return@launch
            }
            syncNow()
        }
    }

    fun syncNow() {
        if (syncState.value.isSyncing) return

        viewModelScope.launch {
            syncState.value = SyncUiState(isSyncing = true, syncMessage = "Sync in progress...")
            val result = repository.syncNow()
            syncState.value = SyncUiState(
                isSyncing = false,
                syncMessage = if (result.isSuccess) {
                    "Sync complete."
                } else {
                    result.exceptionOrNull()?.message ?: "Sync failed."
                },
            )
        }
    }

    fun observeInsightsForDay(day: String): Flow<TodayInsightsDto?> =
        repository.observeInsightsForDay(day)

    fun requestInsightsForDay(day: String) {
        viewModelScope.launch {
            runCatching { repository.ensureInsightsFor(day) }
                .onFailure { AppLogger.w(TAG, "Insights request failed day=$day", it) }
        }
    }

    fun setDarkMode(enabled: Boolean?) {
        viewModelScope.launch {
            runCatching {
                repository.saveDarkMode(enabled)
            }
        }
    }

    fun saveUserName(name: String) {
        viewModelScope.launch {
            runCatching { repository.saveUserName(name) }
        }
    }

    fun saveBackgroundSyncInterval(context: Context, hours: Int) {
        if (!BackgroundSyncScheduler.isAllowed(hours)) {
            syncState.update { it.copy(syncMessage = "Unsupported background sync interval.") }
            return
        }
        viewModelScope.launch {
            runCatching {
                repository.saveBackgroundSyncInterval(hours)
                val nextRun = BackgroundSyncScheduler.apply(context.applicationContext, hours)
                repository.recordNextBackgroundRun(nextRun)
            }.onSuccess {
                val message = if (hours == 0) "Background sync turned off." else "Background sync every ${hours}h."
                syncState.update { it.copy(syncMessage = message) }
                AppLogger.i(TAG, "Background sync interval applied hours=$hours")
            }.onFailure { throwable ->
                AppLogger.w(TAG, "Failed to apply background sync interval", throwable)
                syncState.update {
                    it.copy(syncMessage = throwable.message ?: "Could not update background sync.")
                }
            }
        }
    }

    class Factory(private val repository: OuraRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
                return MainViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
