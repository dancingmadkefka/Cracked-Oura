package com.crackedoura.mobile.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workouts")
data class WorkoutEntity(
    @PrimaryKey val id: String,
    val day: String,
    @ColumnInfo(name = "start_time") val startTime: String?,
    @ColumnInfo(name = "end_time") val endTime: String?,
    val activity: String?,
    val calories: Float?,
    val distance: Float?,
    val intensity: String?,
    val label: String?,
    val source: String?,
)
