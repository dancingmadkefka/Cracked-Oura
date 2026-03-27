package com.crackedoura.mobile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.crackedoura.mobile.data.local.DailySummaryEntity
import com.crackedoura.mobile.data.local.WorkoutEntity
import com.crackedoura.mobile.data.repository.OuraRepository
import com.crackedoura.mobile.data.repository.SyncSettings
import com.crackedoura.mobile.util.AppLogger
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
)

class MainViewModel(private val repository: OuraRepository) : ViewModel() {
    private companion object {
        const val TAG = "MainViewModel"
        const val MAX_SUMMARY_DAYS = 365
        const val MAX_WORKOUT_ROWS = 1500
    }

    private val syncState = MutableStateFlow(SyncUiState())

    val uiState: StateFlow<MainUiState> = combine(
        repository.observeSettings(),
        repository.observeLatestSummary(),
        repository.observeRecentSummaries(limit = MAX_SUMMARY_DAYS),
        repository.observeRecentWorkouts(limit = MAX_WORKOUT_ROWS),
        syncState,
    ) { settings, latest, recent, workouts, sync ->
        MainUiState(
            settings = settings,
            latestSummary = latest,
            recentSummaries = recent,
            recentWorkouts = workouts,
            isSyncing = sync.isSyncing,
            syncMessage = sync.syncMessage,
            darkMode = settings.darkMode,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = MainUiState(),
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

    fun setDarkMode(enabled: Boolean?) {
        viewModelScope.launch {
            runCatching {
                repository.saveDarkMode(enabled)
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
