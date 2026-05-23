package com.crackedoura.mobile

import android.app.Application
import com.crackedoura.mobile.data.local.AppDatabase
import com.crackedoura.mobile.data.remote.MobileApiServiceFactory
import com.crackedoura.mobile.data.repository.OuraRepository
import com.crackedoura.mobile.data.repository.SyncPreferencesRepository
import com.crackedoura.mobile.data.sync.BackgroundSyncScheduler
import com.crackedoura.mobile.util.AppLogger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class CrackedOuraMobileApplication : Application() {
    lateinit var repository: OuraRepository
        private set

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        AppLogger.i("App", "Application created")

        val database = AppDatabase.build(this)
        val preferencesRepository = SyncPreferencesRepository(this)

        repository = OuraRepository(
            database = database,
            dao = database.ouraDao(),
            apiService = MobileApiServiceFactory.create(),
            preferencesRepository = preferencesRepository,
        )

        scope.launch {
            runCatching { repository.loadPersistedState() }
                .onFailure { AppLogger.w("App", "Failed to load persisted insight state", it) }
        }

        // Re-apply persisted background sync schedule on cold start so reboots/upgrades
        // don't silently disable it.
        scope.launch {
            val settings = preferencesRepository.currentSettings()
            val hours = settings.backgroundSyncIntervalHours
            if (BackgroundSyncScheduler.isAllowed(hours)) {
                val nextRun = BackgroundSyncScheduler.apply(this@CrackedOuraMobileApplication, hours)
                repository.recordNextBackgroundRun(nextRun)
            }
        }
    }
}
