package com.crackedoura.mobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface OuraDao {
    @Query("SELECT * FROM daily_summaries ORDER BY day DESC LIMIT 1")
    fun observeLatestSummary(): Flow<DailySummaryEntity?>

    @Query("SELECT * FROM daily_summaries ORDER BY day DESC LIMIT :limit")
    fun observeRecentSummaries(limit: Int): Flow<List<DailySummaryEntity>>

    @Query("SELECT * FROM workouts ORDER BY day DESC, start_time DESC LIMIT :limit")
    fun observeRecentWorkouts(limit: Int): Flow<List<WorkoutEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDailySummaries(items: List<DailySummaryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWorkouts(items: List<WorkoutEntity>)

    @Query("DELETE FROM daily_summaries WHERE day < :fromDay")
    suspend fun deleteSummariesBefore(fromDay: String)

    @Query("DELETE FROM workouts WHERE day < :fromDay")
    suspend fun deleteWorkoutsBefore(fromDay: String)
}
