package com.crackedoura.mobile.data.repository

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.syncPreferencesDataStore by preferencesDataStore(name = "sync_settings")

data class SyncSettings(
    val localServerUrl: String = "",
    val tailscaleServerUrl: String = "",
    val preferredNetwork: String = "auto",
    val token: String = "",
    val windowDays: Int = 180,
    val lastSyncAt: String? = null,
    val lastError: String? = null,
    val darkMode: Boolean? = null,
    val lastUsedUrl: String? = null,
    /** First name shown in personalised greeting. */
    val userName: String = "",
    /** Background sync interval in hours. 0 means off/manual. Valid: 0, 6, 12, 24. */
    val backgroundSyncIntervalHours: Int = 0,
    val lastBackgroundRunAt: String? = null,
    val nextBackgroundRunAt: String? = null,
    val lastBackgroundError: String? = null,
    /** Kept for legacy migration. Read-only. */
    val _legacyServerUrl: String = "",
)

class SyncPreferencesRepository(private val context: Context) {
    private object Keys {
        val serverUrl = stringPreferencesKey("server_url")
        val localServerUrl = stringPreferencesKey("local_server_url")
        val tailscaleServerUrl = stringPreferencesKey("tailscale_server_url")
        val preferredNetwork = stringPreferencesKey("preferred_network")
        val token = stringPreferencesKey("token")
        val windowDays = intPreferencesKey("window_days")
        val lastSyncAt = stringPreferencesKey("last_sync_at")
        val lastError = stringPreferencesKey("last_error")
        val darkMode = stringPreferencesKey("dark_mode")
        val lastUsedUrl = stringPreferencesKey("last_used_url")
        val userName = stringPreferencesKey("user_name")
        val backgroundSyncIntervalHours = intPreferencesKey("background_sync_interval_hours")
        val lastBackgroundRunAt = stringPreferencesKey("last_background_run_at")
        val nextBackgroundRunAt = stringPreferencesKey("next_background_run_at")
        val lastBackgroundError = stringPreferencesKey("last_background_error")
    }

    val settings: Flow<SyncSettings> = context.syncPreferencesDataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            val legacyUrl = preferences[Keys.serverUrl].orEmpty()
            val hasLocal = preferences.contains(Keys.localServerUrl)
            SyncSettings(
                localServerUrl = if (hasLocal) preferences[Keys.localServerUrl].orEmpty() else legacyUrl.takeIf { it.isNotBlank() && !it.contains("100.") }.orEmpty(),
                tailscaleServerUrl = if (hasLocal) preferences[Keys.tailscaleServerUrl].orEmpty() else legacyUrl.takeIf { it.contains("100.") }.orEmpty(),
                preferredNetwork = preferences[Keys.preferredNetwork] ?: "auto",
                token = preferences[Keys.token].orEmpty(),
                windowDays = preferences[Keys.windowDays] ?: 180,
                lastSyncAt = preferences[Keys.lastSyncAt],
                lastError = preferences[Keys.lastError],
                darkMode = when (preferences[Keys.darkMode]) {
                    "true" -> true
                    "false" -> false
                    else -> null
                },
                lastUsedUrl = preferences[Keys.lastUsedUrl],
                userName = preferences[Keys.userName].orEmpty(),
                backgroundSyncIntervalHours = preferences[Keys.backgroundSyncIntervalHours] ?: 0,
                lastBackgroundRunAt = preferences[Keys.lastBackgroundRunAt],
                nextBackgroundRunAt = preferences[Keys.nextBackgroundRunAt],
                lastBackgroundError = preferences[Keys.lastBackgroundError],
                _legacyServerUrl = legacyUrl,
            )
        }

    suspend fun currentSettings(): SyncSettings = settings.first()

    suspend fun saveSettings(
        localServerUrl: String,
        tailscaleServerUrl: String,
        preferredNetwork: String,
        token: String,
        windowDays: Int,
    ) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.localServerUrl] = localServerUrl.trim()
            preferences[Keys.tailscaleServerUrl] = tailscaleServerUrl.trim()
            preferences[Keys.preferredNetwork] = preferredNetwork
            preferences[Keys.token] = token.trim()
            preferences[Keys.windowDays] = windowDays
            preferences.remove(Keys.lastSyncAt)
            preferences.remove(Keys.lastError)
            preferences.remove(Keys.serverUrl)
        }
    }

    suspend fun recordSyncSuccess(timestamp: String) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.lastSyncAt] = timestamp
            preferences.remove(Keys.lastError)
        }
    }

    suspend fun recordSyncFailure(message: String) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.lastError] = message
        }
    }

    suspend fun saveDarkMode(enabled: Boolean?) {
        context.syncPreferencesDataStore.edit { preferences ->
            if (enabled == null) {
                preferences.remove(Keys.darkMode)
            } else {
                preferences[Keys.darkMode] = enabled.toString()
            }
        }
    }

    suspend fun saveUserName(name: String) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.userName] = name.trim()
        }
    }

    suspend fun recordSuccessfulUrl(url: String) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.lastUsedUrl] = url
        }
    }

    suspend fun saveBackgroundSyncInterval(hours: Int) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.backgroundSyncIntervalHours] = hours
            if (hours <= 0) {
                preferences.remove(Keys.nextBackgroundRunAt)
            }
        }
    }

    suspend fun recordBackgroundRun(
        timestamp: String,
        error: String?,
        nextRunAt: String?,
    ) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.lastBackgroundRunAt] = timestamp
            if (error == null) {
                preferences.remove(Keys.lastBackgroundError)
            } else {
                preferences[Keys.lastBackgroundError] = error
            }
            if (nextRunAt != null) {
                preferences[Keys.nextBackgroundRunAt] = nextRunAt
            } else {
                preferences.remove(Keys.nextBackgroundRunAt)
            }
        }
    }

    suspend fun recordNextBackgroundRun(nextRunAt: String?) {
        context.syncPreferencesDataStore.edit { preferences ->
            if (nextRunAt != null) {
                preferences[Keys.nextBackgroundRunAt] = nextRunAt
            } else {
                preferences.remove(Keys.nextBackgroundRunAt)
            }
        }
    }
}
