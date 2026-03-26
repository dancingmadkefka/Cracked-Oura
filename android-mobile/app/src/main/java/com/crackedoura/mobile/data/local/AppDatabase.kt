package com.crackedoura.mobile.data.local

import android.content.Context
import androidx.room.Room
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [DailySummaryEntity::class, WorkoutEntity::class],
    version = 2,
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

        fun build(context: Context): AppDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "cracked_oura_mobile.db",
            ).addMigrations(MIGRATION_1_2).build()
        }
    }
}
