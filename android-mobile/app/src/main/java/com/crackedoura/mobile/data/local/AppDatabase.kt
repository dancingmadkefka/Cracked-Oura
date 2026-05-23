package com.crackedoura.mobile.data.local

import android.content.Context
import androidx.room.Room
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        DailySummaryEntity::class,
        WorkoutEntity::class,
        InsightsEntity::class,
        SyncStateEntity::class,
    ],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun ouraDao(): OuraDao

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN target_calories INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN target_meters INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN meters_to_target INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN inactivity_alerts INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN resting_time INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN sedentary_time INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN low_activity_time INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN medium_activity_time INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN high_activity_time INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN stress_high INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN recovery_high INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN readiness_day_summary TEXT")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN total_sleep_duration_all_sessions INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN nap_sleep_duration INTEGER")
                database.execSQL("ALTER TABLE daily_summaries ADD COLUMN sleep_session_count INTEGER")
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    "CREATE TABLE IF NOT EXISTS day_insights (" +
                        "day TEXT NOT NULL PRIMARY KEY, " +
                        "payloadJson TEXT NOT NULL, " +
                        "fetchedAt TEXT NOT NULL)"
                )
                database.execSQL(
                    "CREATE TABLE IF NOT EXISTS sync_state (" +
                        "id INTEGER NOT NULL PRIMARY KEY, " +
                        "freshnessJson TEXT, " +
                        "latestInsightsDay TEXT)"
                )
            }
        }

        fun build(context: Context): AppDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "cracked_oura_mobile.db",
            ).addMigrations(MIGRATION_1_2, MIGRATION_2_3).build()
        }
    }
}
