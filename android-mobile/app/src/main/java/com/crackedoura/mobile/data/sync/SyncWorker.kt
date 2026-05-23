package com.crackedoura.mobile.data.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.crackedoura.mobile.CrackedOuraMobileApplication
import com.crackedoura.mobile.util.AppLogger

/**
 * Periodic background sync worker.
 *
 * Delegates to [com.crackedoura.mobile.data.repository.OuraRepository.syncNow]
 * and records the outcome via [com.crackedoura.mobile.data.repository.OuraRepository.recordBackgroundResult].
 */
class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? CrackedOuraMobileApplication ?: return Result.failure()
        AppLogger.i(TAG, "Background sync starting (attempt=$runAttemptCount)")
        val outcome = runCatching { app.repository.syncNow() }
        val syncResult = outcome.getOrNull()
        val errorMessage = when {
            outcome.isFailure -> outcome.exceptionOrNull()?.message ?: "Background sync failed."
            syncResult?.isFailure == true -> syncResult.exceptionOrNull()?.message ?: "Background sync failed."
            else -> null
        }
        app.repository.recordBackgroundResult(errorMessage)
        return if (errorMessage == null) {
            AppLogger.i(TAG, "Background sync succeeded")
            Result.success()
        } else {
            AppLogger.w(TAG, "Background sync failed: $errorMessage")
            // Periodic workers re-run on schedule; failure marks the attempt as done.
            Result.success()
        }
    }

    companion object {
        const val TAG = "SyncWorker"
        const val UNIQUE_WORK_NAME = "cracked_oura_periodic_sync"
    }
}
