package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.crackedoura.mobile.data.remote.SyncFreshnessDto
import com.crackedoura.mobile.data.remote.TodayInsightsDto
import com.crackedoura.mobile.ui.ActivityGoalBasis
import com.crackedoura.mobile.ui.DailyInsight
import com.crackedoura.mobile.ui.formatCompactNumber
import com.crackedoura.mobile.ui.formatDayLabel
import com.crackedoura.mobile.ui.formatDurationHours
import com.crackedoura.mobile.ui.formatDurationSeconds
import com.crackedoura.mobile.ui.formatMeters
import com.crackedoura.mobile.ui.formatPercent
import com.crackedoura.mobile.ui.formatSignedDecimal
import com.crackedoura.mobile.ui.formatSignedDelta
import com.crackedoura.mobile.ui.formatTimeOnly

@Composable
fun DayDetailScreen(
    padding: PaddingValues,
    insight: DailyInsight?,
    isSyncing: Boolean,
    onSync: () -> Unit,
    dayInsights: TodayInsightsDto? = null,
    syncFreshness: SyncFreshnessDto? = null,
) {
    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        if (insight == null) {
            item {
                EmptyStateCard(
                    title = "Day not on this phone",
                    body = "This date is not in your phone cache yet. Sync from desktop in Settings, " +
                        "or pick a day you have already copied.",
                )
            }
            return@LazyColumn
        }

        item {
            HeroCard(
                eyebrow = "Day detail",
                title = formatDayLabel(insight.day),
                accent = listOf(Color(0xFF2B6DFF), Color(0xFF19B394)),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatusPill(
                        label = insight.summary.sleepStatus ?: "Snapshot cached",
                        tone = Color.White,
                    )
                    insight.summary.resilienceLevel?.let {
                        StatusPill(label = it.replaceFirstChar { char -> char.uppercase() }, tone = Color.White)
                    }
                    SyncFreshnessPill(syncFreshness)
                }
                Button(
                    onClick = onSync,
                    enabled = !isSyncing,
                ) {
                    Text(if (isSyncing) "Syncing..." else "Sync from desktop")
                }
            }
        }

        if (dayInsights != null) {
            dayInsights.guidance?.let { item { GuidanceCard(it) } }
            item { ActionCardsList(dayInsights.actionCards) }
            item { ContributorList("Sleep contributors", dayInsights.contributorsSleep) }
            item { ContributorList("Readiness contributors", dayInsights.contributorsReadiness) }
            item { ContributorList("Activity contributors", dayInsights.contributorsActivity) }
        }

        item {
            SectionCard(
                title = "Scores",
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    DetailScoreTile(
                        label = "Sleep score",
                        value = insight.summary.sleepScore?.toString() ?: "--",
                        note = insight.totalSleepSeconds?.let { formatDurationSeconds(it) } ?: "No sleep total",
                        color = Color(0xFF2B6DFF),
                        modifier = Modifier.weight(1f),
                    )
                    DetailScoreTile(
                        label = "Readiness",
                        value = insight.summary.readinessScore?.toString() ?: "--",
                        note = insight.readinessDelta?.let { "${formatSignedDelta(it)} vs 14d baseline" } ?: "No readiness baseline yet",
                        color = Color(0xFF19B394),
                        modifier = Modifier.weight(1f),
                    )
                    DetailScoreTile(
                        label = "Activity",
                        value = insight.summary.activityScore?.toString() ?: "--",
                        note = insight.summary.steps?.let { "${formatCompactNumber(it)} steps" } ?: "No step count",
                        color = Color(0xFFFF8B4A),
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Derived insights",
            ) {
                StatRow("Estimated sleep need", formatDurationHours(insight.sleepNeedEstimateSeconds))
                StatRow("Sleep debt", formatDurationHours(insight.sleepDebtSeconds))
                StatRow("Activity goal progress", insight.activityGoalProgress?.let { formatPercent(it) } ?: "--")
                StatRow("Activity goal context", insight.activityGoalLabel())
                StatRow("HRV vs baseline", formatSignedDelta(insight.hrvDelta, "ms"))
                StatRow("Resting HR vs baseline", formatSignedDelta(insight.restingHeartRateDelta, "bpm"))
                StatRow("Recovery share", insight.recoveryShare?.let { formatPercent(it) } ?: "--")
            }
        }

        item {
            SectionCard(
                title = "Sleep breakdown",
            ) {
                StatRow("Total sleep", formatDurationSeconds(insight.totalSleepSeconds))
                StatRow("Nap sleep", formatDurationSeconds(insight.summary.napSleepDuration))
                StatRow("Sleep sessions counted", insight.summary.sleepSessionCount?.toString() ?: "--")
                StatRow("Bedtime", "${formatTimeOnly(insight.summary.bedtimeStart)} - ${formatTimeOnly(insight.summary.bedtimeEnd)}")
                StatRow("Time in bed", formatDurationSeconds(insight.summary.timeInBed))
                StatRow("Sleep efficiency", insight.summary.sleepEfficiency?.let { "$it%" } ?: "--")
                StatRow("Deep sleep", formatDurationSeconds(insight.summary.deepSleepDuration))
                StatRow("REM sleep", formatDurationSeconds(insight.summary.remSleepDuration))
                StatRow("Light sleep", formatDurationSeconds(insight.summary.lightSleepDuration))
                StatRow("Awake time", formatDurationSeconds(insight.summary.awakeTime))
                StatRow("Avg HR", insight.summary.averageHeartRate?.let { "${it.toInt()} bpm" } ?: "--")
                StatRow("Lowest HR", insight.summary.lowestHeartRate?.let { "$it bpm" } ?: "--")
                StatRow("Avg HRV", insight.summary.averageHrv?.let { "$it ms" } ?: "--")
                insight.summary.sleepRecommendation?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Activity and recovery",
            ) {
                StatRow("Steps", insight.summary.steps?.let { formatCompactNumber(it) } ?: "--")
                StatRow("Active calories", insight.summary.activeCalories?.let { "$it kcal" } ?: "--")
                StatRow("Total calories", insight.summary.totalCalories?.let { "$it kcal" } ?: "--")
                StatRow("Walking distance", formatMeters(insight.summary.equivalentWalkingDistance))
                StatRow("Target calories", insight.summary.targetCalories?.let { "$it kcal" } ?: "--")
                StatRow("Target distance", formatMeters(insight.summary.targetMeters))
                StatRow("Meters to target", formatMeters(insight.summary.metersToTarget))
                StatRow("Resting time", formatDurationSeconds(insight.summary.restingTime))
                StatRow("Sedentary time", formatDurationSeconds(insight.summary.sedentaryTime))
                StatRow("Stress minutes", insight.summary.stressHigh?.let { "$it min" } ?: "--")
                StatRow("Recovery minutes", insight.summary.recoveryHigh?.let { "$it min" } ?: "--")
                StatRow("Temp deviation", formatSignedDecimal(insight.summary.temperatureDeviation, "°C"))
                StatRow("Temp trend", formatSignedDecimal(insight.summary.temperatureTrendDeviation, "°C"))
                StatRow("Resilience", insight.summary.resilienceLevel ?: "--")
                StatRow("Vascular age", insight.summary.vascularAge?.toString() ?: "--")
                insight.summary.readinessDaySummary?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Workouts",
                subtitle = if (insight.workouts.isEmpty()) "No workout records were synced for this date." else null,
            ) {
                if (insight.workouts.isEmpty()) {
                } else {
                    insight.workouts.forEach { workout ->
                        WorkoutDetailTile(
                            title = workout.label ?: workout.activity?.replaceFirstChar { it.uppercase() } ?: "Workout",
                            start = formatTimeOnly(workout.startTime),
                            intensity = workout.intensity ?: "Unknown intensity",
                            calories = workout.calories?.toInt()?.let { "$it kcal" } ?: "Tracked",
                            distance = workout.distance?.let { "${(it / 1000f).let { km -> String.format("%.1f km", km) }}" } ?: "No distance",
                        )
                    }
                }
            }
        }

    }
}

@Composable
private fun DetailScoreTile(
    label: String,
    value: String,
    note: String,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.08f), shape = androidx.compose.foundation.shape.RoundedCornerShape(22.dp))
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = color,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = note,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun WorkoutDetailTile(
    title: String,
    start: String,
    intensity: String,
    calories: String,
    distance: String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
        )
        StatRow("Start", start)
        StatRow("Intensity", intensity)
        StatRow("Calories", calories)
        StatRow("Distance", distance)
    }
}

private fun DailyInsight.activityGoalLabel(): String {
    return when (activityGoalBasis) {
        ActivityGoalBasis.Calories -> {
            val target = activityGoalTarget?.let { "$it kcal target" } ?: "No calorie target"
            val remaining = activityGoalRemaining?.let { "$it kcal left" } ?: "No remainder"
            "$target • $remaining"
        }

        ActivityGoalBasis.Distance -> {
            val target = activityGoalTarget?.let { formatMeters(it) } ?: "No distance target"
            val remaining = activityGoalRemaining?.let { "${formatMeters(it)} left" } ?: "No remainder"
            "Target $target • $remaining"
        }

        null -> "No target set"
    }
}
