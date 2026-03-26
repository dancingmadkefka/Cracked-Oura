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
    val serverUrl: String = "",
    val token: String = "",
    val windowDays: Int = 180,
    val lastSyncAt: String? = null,
    val lastError: String? = null,
)

class SyncPreferencesRepository(private val context: Context) {
    private object Keys {
        val serverUrl = stringPreferencesKey("server_url")
        val token = stringPreferencesKey("token")
        val windowDays = intPreferencesKey("window_days")
        val lastSyncAt = stringPreferencesKey("last_sync_at")
        val lastError = stringPreferencesKey("last_error")
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
            SyncSettings(
                serverUrl = preferences[Keys.serverUrl].orEmpty(),
                token = preferences[Keys.token].orEmpty(),
                windowDays = preferences[Keys.windowDays] ?: 180,
                lastSyncAt = preferences[Keys.lastSyncAt],
                lastError = preferences[Keys.lastError],
            )
        }

    suspend fun currentSettings(): SyncSettings = settings.first()

    suspend fun saveSettings(serverUrl: String, token: String, windowDays: Int) {
        context.syncPreferencesDataStore.edit { preferences ->
            preferences[Keys.serverUrl] = serverUrl.trim()
            preferences[Keys.token] = token.trim()
            preferences[Keys.windowDays] = windowDays
            preferences.remove(Keys.lastSyncAt)
            preferences.remove(Keys.lastError)
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
}
