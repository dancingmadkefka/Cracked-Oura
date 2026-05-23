package com.crackedoura.mobile.data.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.crackedoura.mobile.util.AppLogger
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit

/**
 * Thin wrapper around [WorkManager] that schedules or cancels the periodic
 * [SyncWorker] based on the user-selected interval.
 *
 * Valid intervals: 0 (off/manual), 6, 12, 24 hours.
 */
object BackgroundSyncScheduler {

    private const val TAG = "BgSyncScheduler"

    private val ALLOWED_HOURS = setOf(0, 6, 12, 24)

    fun isAllowed(hours: Int): Boolean = hours in ALLOWED_HOURS

    /**
     * Apply [intervalHours] to WorkManager. Returns the estimated next-run timestamp
     * in ISO-8601 form, or `null` if scheduling was cancelled.
     */
    fun apply(context: Context, intervalHours: Int): String? {
        val workManager = WorkManager.getInstance(context)
        if (intervalHours <= 0) {
            AppLogger.i(TAG, "Cancelling background sync")
            workManager.cancelUniqueWork(SyncWorker.UNIQUE_WORK_NAME)
            return null
        }
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val request = PeriodicWorkRequestBuilder<SyncWorker>(
            intervalHours.toLong(), TimeUnit.HOURS,
        )
            .setConstraints(constraints)
            .build()
        workManager.enqueueUniquePeriodicWork(
            SyncWorker.UNIQUE_WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
        val nextRun = Instant.now().plus(intervalHours.toLong(), ChronoUnit.HOURS).toString()
        AppLogger.i(TAG, "Scheduled background sync every ${intervalHours}h (next≈$nextRun)")
        return nextRun
    }
}
