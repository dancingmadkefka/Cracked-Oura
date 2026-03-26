package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.crackedoura.mobile.ui.ActivityGoalBasis
import com.crackedoura.mobile.ui.DailyInsight
import com.crackedoura.mobile.ui.MainUiState
import com.crackedoura.mobile.ui.formatCompactNumber
import com.crackedoura.mobile.ui.formatDateTimeLabel
import com.crackedoura.mobile.ui.formatDayLabel
import com.crackedoura.mobile.ui.formatDayMonth
import com.crackedoura.mobile.ui.formatDurationHours
import com.crackedoura.mobile.ui.formatDurationSeconds
import com.crackedoura.mobile.ui.formatMeters
import com.crackedoura.mobile.ui.formatPercent
import com.crackedoura.mobile.ui.formatSignedDecimal
import com.crackedoura.mobile.ui.formatSignedDelta
import com.crackedoura.mobile.ui.formatTimeOnly

@Composable
fun OverviewScreen(
    padding: PaddingValues,
    uiState: MainUiState,
    insights: List<DailyInsight>,
    onSync: () -> Unit,
    onOpenDayDetail: (String) -> Unit,
) {
    val latest = insights.lastOrNull()
    val timeline = insights.takeLast(14).reversed()
    val hasToken = uiState.settings.token.isNotBlank()
    val hasServer = uiState.settings.serverUrl.isNotBlank()
    val latestWorkouts = latest?.workouts.orEmpty()

    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "Offline briefing",
                title = latest?.let { "Latest day ${formatDayLabel(it.day)}" } ?: "No mobile cache yet",
                subtitle = when {
                    uiState.settings.lastSyncAt != null && latest != null ->
                        "Last sync ${formatDateTimeLabel(uiState.settings.lastSyncAt)} • ${insights.size} cached days ready offline."
                    uiState.settings.lastSyncAt != null ->
                        "Last sync ${formatDateTimeLabel(uiState.settings.lastSyncAt)}."
                    else -> "Connect to the desktop app once and the phone will keep recent health trends available offline."
                },
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    StatusPill(
                        label = if (uiState.isSyncing) "Sync running" else "Manual sync",
                        tone = if (uiState.isSyncing) Color(0xFFFFD166) else Color.White,
                    )
                    if (insights.isNotEmpty()) {
                        StatusPill(
                            label = "${insights.size} days cached",
                            tone = Color.White,
                        )
                    }
                }
                Button(
                    onClick = onSync,
                    enabled = hasServer && hasToken && !uiState.isSyncing,
                ) {
                    Text(
                        when {
                            uiState.isSyncing -> "Syncing..."
                            !hasServer -> "Add desktop address first"
                            !hasToken -> "Add token in Settings"
                            else -> "Sync from desktop"
                        },
                    )
                }
            }
        }

        if (latest == null) {
            item {
                EmptyStateCard(
                    title = "Nothing synced yet",
                    body = "Open Settings, add the desktop address and token, then run your first sync. Trend charts and day detail unlock after that first snapshot.",
                )
            }
            return@LazyColumn
        }

        item {
            SectionCard(
                title = "At a glance",
                subtitle = "Derived summaries for ${formatDayLabel(latest.day)}. Labels stay explicit so you always know what each number means.",
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    BriefingTile(
                        title = "Sleep debt",
                        value = formatDurationHours(latest.sleepDebtSeconds),
                        caption = latest.sleepNeedEstimateSeconds?.let {
                            "Need estimate ${formatDurationHours(it)}"
                        } ?: "Needs 5 sleep days in the last 14 days",
                        accent = Color(0xFF6B5BFF),
                        modifier = Modifier.weight(1f),
                    )
                    BriefingTile(
                        title = "Activity goal",
                        value = latest.activityGoalProgress?.let { formatPercent(it) } ?: "No target",
                        caption = latest.activityGoalLabel(),
                        accent = Color(0xFFFF8B4A),
                        modifier = Modifier.weight(1f),
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    BriefingTile(
                        title = "HRV vs 14d baseline",
                        value = formatSignedDelta(latest.hrvDelta, "ms"),
                        caption = latest.hrvBaseline?.let { "Baseline ${it.toInt()} ms" } ?: "Baseline builds after enough recent nights",
                        accent = Color(0xFF19B394),
                        modifier = Modifier.weight(1f),
                    )
                    BriefingTile(
                        title = "Recovery share",
                        value = latest.recoveryShare?.let { formatPercent(it) } ?: "No stress split",
                        caption = latest.summary.recoveryHigh?.let { recovery ->
                            val stress = latest.summary.stressHigh ?: 0
                            "Recovery $recovery min vs stress $stress min"
                        } ?: "Readiness stress split unavailable",
                        accent = Color(0xFFD75A71),
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Recent timeline",
                subtitle = "Tap a day to open a dedicated detail view with sleep, activity, and recovery context.",
            ) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(timeline, key = { it.day }) { insight ->
                        TimelineDayCard(
                            insight = insight,
                            onClick = { onOpenDayDetail(insight.day) },
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "Latest day summary",
                subtitle = "Score cards stay separate from raw units so it is obvious what each metric means.",
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OverviewScoreCard(
                        label = "Sleep score",
                        value = latest.summary.sleepScore?.toString() ?: "--",
                        note = latest.totalSleepSeconds?.let { formatDurationSeconds(it) } ?: "No duration",
                        color = Color(0xFF2B6DFF),
                        modifier = Modifier.weight(1f),
                    )
                    OverviewScoreCard(
                        label = "Readiness score",
                        value = latest.summary.readinessScore?.toString() ?: "--",
                        note = latest.readinessDelta?.let { "${formatSignedDelta(it)} vs 14d baseline" } ?: "Baseline still building",
                        color = Color(0xFF19B394),
                        modifier = Modifier.weight(1f),
                    )
                    OverviewScoreCard(
                        label = "Activity score",
                        value = latest.summary.activityScore?.toString() ?: "--",
                        note = latest.summary.steps?.let { "${formatCompactNumber(it)} steps" } ?: "No steps",
                        color = Color(0xFFFF8B4A),
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Sleep detail",
                subtitle = "All-sessions total is used for sleep debt when available. Stage durations below refer to the primary synced session.",
            ) {
                StatRow("Total sleep", formatDurationSeconds(latest.totalSleepSeconds))
                StatRow("Estimated sleep need", formatDurationHours(latest.sleepNeedEstimateSeconds))
                StatRow("Sleep debt", formatDurationHours(latest.sleepDebtSeconds))
                StatRow("Nap sleep", formatDurationSeconds(latest.summary.napSleepDuration))
                StatRow("Sessions counted", latest.summary.sleepSessionCount?.toString() ?: "Unavailable")
                StatRow("Bedtime", "${formatTimeOnly(latest.summary.bedtimeStart)} - ${formatTimeOnly(latest.summary.bedtimeEnd)}")
                StatRow("Sleep efficiency", latest.summary.sleepEfficiency?.let { "$it%" } ?: "Unavailable")
                StatRow("Deep sleep", formatDurationSeconds(latest.summary.deepSleepDuration))
                StatRow("REM sleep", formatDurationSeconds(latest.summary.remSleepDuration))
                StatRow("Awake time", formatDurationSeconds(latest.summary.awakeTime))
                latest.summary.sleepRecommendation?.takeIf { it.isNotBlank() }?.let {
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
                subtitle = "Target context, HR markers, and readiness notes from the same day.",
            ) {
                StatRow("Steps", latest.summary.steps?.let { formatCompactNumber(it) } ?: "Unavailable")
                StatRow("Active calories", latest.summary.activeCalories?.let { "$it kcal" } ?: "Unavailable")
                StatRow("Total calories", latest.summary.totalCalories?.let { "$it kcal" } ?: "Unavailable")
                StatRow("Distance", formatMeters(latest.summary.equivalentWalkingDistance))
                StatRow("Target progress", latest.activityGoalProgress?.let { formatPercent(it) } ?: "Unavailable")
                StatRow("Avg HRV", latest.summary.averageHrv?.let { "$it ms" } ?: "Unavailable")
                StatRow("Avg HR", latest.summary.averageHeartRate?.let { "${it.toInt()} bpm" } ?: "Unavailable")
                StatRow("Lowest HR", latest.summary.lowestHeartRate?.let { "$it bpm" } ?: "Unavailable")
                StatRow("Temp deviation", formatSignedDecimal(latest.summary.temperatureDeviation, "°C"))
                StatRow("Resilience", latest.summary.resilienceLevel ?: "Unavailable")
                StatRow("Vascular age", latest.summary.vascularAge?.toString() ?: "Unavailable")
                latest.summary.readinessDaySummary?.takeIf { it.isNotBlank() }?.let {
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
                title = "Workouts for ${formatDayMonth(latest.day)}",
                subtitle = if (latestWorkouts.isEmpty()) {
                    "No workouts were synced for this day."
                } else {
                    "Recent workouts line up with the selected day so activity context is not hidden."
                },
            ) {
                if (latestWorkouts.isEmpty()) {
                    Text(
                        text = "Workout cards appear automatically when the synced day contains workout records.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    latestWorkouts.forEach { workout ->
                        WorkoutSummaryRow(
                            title = workout.label ?: workout.activity?.replaceFirstChar { it.uppercase() } ?: "Workout",
                            subtitle = "${formatTimeOnly(workout.startTime)} • ${workout.intensity ?: "Unknown intensity"}",
                            trailing = workout.calories?.toInt()?.let { "$it kcal" } ?: "Tracked",
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "About sleep debt",
                subtitle = "This app uses a clear approximation because exported Oura data does not expose the exact personal sleep-need model used by Oura.",
            ) {
                Text(
                    text = "Approximation: rolling 14-day median of total sleep, including naps or short sessions when synced. The estimate appears only after 5 sleep days exist inside the last 14 days.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun BriefingTile(
    title: String,
    value: String,
    caption: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(
                color = accent.copy(alpha = 0.08f),
                shape = RoundedCornerShape(22.dp),
            )
            .padding(16.dp),
    ) {
        androidx.compose.foundation.layout.Column(
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = accent,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = caption,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun OverviewScoreCard(
    label: String,
    value: String,
    note: String,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                shape = RoundedCornerShape(22.dp),
            )
            .padding(16.dp),
    ) {
        androidx.compose.foundation.layout.Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Box(
                modifier = Modifier
                    .background(color.copy(alpha = 0.16f), CircleShape)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge,
                    color = color,
                    textAlign = TextAlign.Center,
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = note,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun TimelineDayCard(
    insight: DailyInsight,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .width(124.dp)
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
                shape = RoundedCornerShape(22.dp),
            )
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        androidx.compose.foundation.layout.Column(
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = formatDayMonth(insight.day),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            TimelineMiniMetric("Sleep", insight.summary.sleepScore, Color(0xFF2B6DFF))
            TimelineMiniMetric("Ready", insight.summary.readinessScore, Color(0xFF19B394))
            TimelineMiniMetric("Steps", insight.summary.steps?.let { formatCompactNumber(it) }, Color(0xFFFF8B4A))
        }
    }
}

@Composable
private fun TimelineMiniMetric(
    label: String,
    value: Any?,
    color: Color,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(color, CircleShape),
        )
        Text(
            text = "$label ${value ?: "--"}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
private fun WorkoutSummaryRow(
    title: String,
    subtitle: String,
    trailing: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.foundation.layout.Column(
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Text(
            text = trailing,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

private fun DailyInsight.activityGoalLabel(): String {
    return when (activityGoalBasis) {
        ActivityGoalBasis.Calories -> {
            val remaining = activityGoalRemaining?.let { "$it kcal left" } ?: "Target context unavailable"
            val target = activityGoalTarget?.let { "Target $it kcal" } ?: remaining
            "$target • $remaining"
        }

        ActivityGoalBasis.Distance -> {
            val target = activityGoalTarget?.let { formatMeters(it) } ?: "distance target"
            val remaining = activityGoalRemaining?.let { "${formatMeters(it)} left" } ?: "Target context unavailable"
            "Target $target • $remaining"
        }

        null -> "No calorie or distance target in synced data"
    }
}
