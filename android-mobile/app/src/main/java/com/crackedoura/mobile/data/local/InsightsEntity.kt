package com.crackedoura.mobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "day_insights")
data class InsightsEntity(
    @PrimaryKey val day: String,
    val payloadJson: String,
    val fetchedAt: String,
)

@Entity(tableName = "sync_state")
data class SyncStateEntity(
    @PrimaryKey val id: Int = 1,
    val freshnessJson: String?,
    val latestInsightsDay: String?,
)
