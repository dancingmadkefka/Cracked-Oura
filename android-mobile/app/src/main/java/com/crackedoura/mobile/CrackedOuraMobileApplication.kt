package com.crackedoura.mobile

import android.app.Application
import com.crackedoura.mobile.data.local.AppDatabase
import com.crackedoura.mobile.data.remote.MobileApiServiceFactory
import com.crackedoura.mobile.data.repository.OuraRepository
import com.crackedoura.mobile.data.repository.SyncPreferencesRepository
import com.crackedoura.mobile.util.AppLogger

class CrackedOuraMobileApplication : Application() {
    lateinit var repository: OuraRepository
        private set

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
    }
}
