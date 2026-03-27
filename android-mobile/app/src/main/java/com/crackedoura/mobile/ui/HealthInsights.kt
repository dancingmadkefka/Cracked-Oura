package com.crackedoura.mobile.ui

import androidx.compose.ui.graphics.Color
import com.crackedoura.mobile.data.local.DailySummaryEntity
import com.crackedoura.mobile.data.local.WorkoutEntity
import kotlin.math.roundToInt

enum class MetricFamily(val label: String) {
    Scores("Scores"),
    Sleep("Sleep"),
    Activity("Activity"),
    Recovery("Recovery"),
}

enum class MetricWindow(val label: String, val days: Int) {
    Week("7d", 7),
    Month("30d", 30),
    Quarter("90d", 90),
    HalfYear("180d", 180),
}

enum class ActivityGoalBasis(val label: String, val unit: String) {
    Calories("Active calories", "kcal"),
    Distance("Walking distance", "m"),
}

data class DailyInsight(
    val summary: DailySummaryEntity,
    val workouts: List<WorkoutEntity>,
    val totalSleepSeconds: Int?,
    val sleepNeedEstimateSeconds: Int?,
    val sleepDebtSeconds: Int?,
    val readinessBaseline: Double?,
    val readinessDelta: Int?,
    val hrvBaseline: Double?,
    val hrvDelta: Int?,
    val restingHeartRateBaseline: Double?,
    val restingHeartRateDelta: Int?,
    val activityGoalProgress: Float?,
    val activityGoalBasis: ActivityGoalBasis?,
    val activityGoalTarget: Int?,
    val activityGoalRemaining: Int?,
    val recoveryShare: Float?,
) {
    val day: String = summary.day
}

data class TrendMetricDefinition(
    val id: String,
    val family: MetricFamily,
    val title: String,
    val shortLabel: String,
    val unitLabel: String,
    val description: String,
    val color: Color,
    val selector: (DailyInsight) -> Float?,
    val formatter: (Float) -> String,
)

val trendMetricDefinitions = listOf(
    TrendMetricDefinition(
        id = "sleep_score",
        family = MetricFamily.Scores,
        title = "Sleep score",
        shortLabel = "Sleep",
        unitLabel = "score",
        description = "Sleep score (0\u2013100)",
        color = Color(0xFF2B6DFF),
        selector = { it.summary.sleepScore?.toFloat() },
        formatter = { it.roundToInt().toString() },
    ),
    TrendMetricDefinition(
        id = "readiness_score",
        family = MetricFamily.Scores,
        title = "Readiness score",
        shortLabel = "Ready",
        unitLabel = "score",
        description = "Readiness score (0\u2013100)",
        color = Color(0xFF18A685),
        selector = { it.summary.readinessScore?.toFloat() },
        formatter = { it.roundToInt().toString() },
    ),
    TrendMetricDefinition(
        id = "activity_score",
        family = MetricFamily.Scores,
        title = "Activity score",
        shortLabel = "Activity",
        unitLabel = "score",
        description = "Activity score (0\u2013100)",
        color = Color(0xFFFF8B4A),
        selector = { it.summary.activityScore?.toFloat() },
        formatter = { it.roundToInt().toString() },
    ),
    TrendMetricDefinition(
        id = "total_sleep",
        family = MetricFamily.Sleep,
        title = "Total sleep",
        shortLabel = "Sleep time",
        unitLabel = "hours",
        description = "Total sleep duration",
        color = Color(0xFF3966FF),
        selector = { it.totalSleepSeconds?.div(3600f) },
        formatter = { formatDecimal(it, 1) + " h" },
    ),
    TrendMetricDefinition(
        id = "sleep_debt",
        family = MetricFamily.Sleep,
        title = "Sleep debt",
        shortLabel = "Debt",
        unitLabel = "hours behind",
        description = "Estimated sleep deficit",
        color = Color(0xFF7B57F6),
        selector = { it.sleepDebtSeconds?.div(3600f) },
        formatter = { formatDecimal(it, 1) + " h" },
    ),
    TrendMetricDefinition(
        id = "deep_sleep",
        family = MetricFamily.Sleep,
        title = "Deep sleep",
        shortLabel = "Deep",
        unitLabel = "hours",
        description = "Deep sleep duration",
        color = Color(0xFF2041B9),
        selector = { it.summary.deepSleepDuration?.div(3600f) },
        formatter = { formatDecimal(it, 1) + " h" },
    ),
    TrendMetricDefinition(
        id = "steps",
        family = MetricFamily.Activity,
        title = "Steps",
        shortLabel = "Steps",
        unitLabel = "steps",
        description = "Daily steps",
        color = Color(0xFFFF8B4A),
        selector = { it.summary.steps?.toFloat() },
        formatter = { formatCompactNumber(it.roundToInt()) },
    ),
    TrendMetricDefinition(
        id = "active_calories",
        family = MetricFamily.Activity,
        title = "Active calories",
        shortLabel = "Active kcal",
        unitLabel = "kcal",
        description = "Active calories burned",
        color = Color(0xFFF36B31),
        selector = { it.summary.activeCalories?.toFloat() },
        formatter = { "${it.roundToInt()} kcal" },
    ),
    TrendMetricDefinition(
        id = "goal_progress",
        family = MetricFamily.Activity,
        title = "Activity goal progress",
        shortLabel = "Goal",
        unitLabel = "% of target",
        description = "Activity goal progress",
        color = Color(0xFFE85D24),
        selector = { it.activityGoalProgress?.times(100f) },
        formatter = { "${it.roundToInt()}%" },
    ),
    TrendMetricDefinition(
        id = "average_hrv",
        family = MetricFamily.Recovery,
        title = "Average HRV",
        shortLabel = "HRV",
        unitLabel = "ms",
        description = "Average sleep HRV",
        color = Color(0xFF18A685),
        selector = { it.summary.averageHrv?.toFloat() },
        formatter = { "${it.roundToInt()} ms" },
    ),
    TrendMetricDefinition(
        id = "average_hr",
        family = MetricFamily.Recovery,
        title = "Average heart rate",
        shortLabel = "Avg HR",
        unitLabel = "bpm",
        description = "Average sleep heart rate",
        color = Color(0xFFD65A71),
        selector = { it.summary.averageHeartRate },
        formatter = { "${it.roundToInt()} bpm" },
    ),
    TrendMetricDefinition(
        id = "temperature_deviation",
        family = MetricFamily.Recovery,
        title = "Temperature deviation",
        shortLabel = "Temp",
        unitLabel = "°C",
        description = "Skin temperature deviation",
        color = Color(0xFFC9502F),
        selector = { it.summary.temperatureDeviation },
        formatter = { formatSignedDecimal(it, 1) + " °C" },
    ),
)

fun buildDailyInsights(
    summaries: List<DailySummaryEntity>,
    workouts: List<WorkoutEntity>,
): List<DailyInsight> {
    if (summaries.isEmpty()) return emptyList()

    val chronological = summaries.sortedBy { it.day }
    val workoutsByDay = workouts.groupBy { it.day }
    val sleepNeedByIndex = chronological.mapIndexed { index, _ ->
        estimateSleepNeedSeconds(chronological.windowEndingAt(index, span = 14))
    }

    return chronological.mapIndexed { index, summary ->
        val priorWindow = chronological.windowBefore(index, span = 14)
        val debtWindow = chronological.windowEndingAt(index, span = 14)
        val totalSleepSeconds = summary.totalSleepSeconds()
        val activityProgress = summary.activityGoalProgress()

        DailyInsight(
            summary = summary,
            workouts = workoutsByDay[summary.day].orEmpty().sortedByDescending { it.startTime },
            totalSleepSeconds = totalSleepSeconds,
            sleepNeedEstimateSeconds = sleepNeedByIndex[index],
            sleepDebtSeconds = estimateSleepDebtSeconds(
                items = debtWindow,
                sleepNeedByIndex = sleepNeedByIndex,
                startIndex = (index - debtWindow.size + 1).coerceAtLeast(0),
            ),
            readinessBaseline = priorWindow.mapNotNull { it.readinessScore?.toDouble() }.averageOrNull(),
            readinessDelta = priorWindow.averageDelta(summary.readinessScore) { it.readinessScore },
            hrvBaseline = priorWindow.mapNotNull { it.averageHrv?.toDouble() }.averageOrNull(),
            hrvDelta = priorWindow.averageDelta(summary.averageHrv) { it.averageHrv },
            restingHeartRateBaseline = priorWindow
                .mapNotNull { it.lowestHeartRate?.toDouble() ?: it.averageHeartRate?.toDouble() }
                .averageOrNull(),
            restingHeartRateDelta = priorWindow.averageDelta(
                currentValue = summary.lowestHeartRate ?: summary.averageHeartRate?.roundToInt(),
            ) { it.lowestHeartRate ?: it.averageHeartRate?.roundToInt() },
            activityGoalProgress = activityProgress?.coerceAtLeast(0f),
            activityGoalBasis = summary.activityGoalBasis(),
            activityGoalTarget = summary.activityGoalTarget(),
            activityGoalRemaining = summary.activityGoalRemaining(),
            recoveryShare = summary.recoveryShare(),
        )
    }
}

fun metricsForFamily(family: MetricFamily): List<TrendMetricDefinition> =
    trendMetricDefinitions.filter { it.family == family }

fun insightsForWindow(
    insights: List<DailyInsight>,
    window: MetricWindow,
): List<DailyInsight> = insights.takeLast(window.days)

fun findMetric(metricId: String): TrendMetricDefinition =
    trendMetricDefinitions.firstOrNull { it.id == metricId } ?: trendMetricDefinitions.first()

fun defaultMetricForFamily(family: MetricFamily): TrendMetricDefinition =
    metricsForFamily(family).first()

private fun DailySummaryEntity.totalSleepSeconds(): Int? =
    totalSleepDurationAllSessions ?: totalSleepDuration

private fun DailySummaryEntity.activityGoalBasis(): ActivityGoalBasis? {
    return when {
        (targetCalories ?: 0) > 0 && activeCalories != null -> ActivityGoalBasis.Calories
        (targetMeters ?: 0) > 0 && equivalentWalkingDistance != null -> ActivityGoalBasis.Distance
        (metersToTarget ?: 0) >= 0 && equivalentWalkingDistance != null -> ActivityGoalBasis.Distance
        else -> null
    }
}

private fun DailySummaryEntity.activityGoalTarget(): Int? {
    return when (activityGoalBasis()) {
        ActivityGoalBasis.Calories -> targetCalories
        ActivityGoalBasis.Distance -> targetMeters ?: run {
            val completed = equivalentWalkingDistance ?: return@run null
            val remaining = metersToTarget ?: return@run null
            completed + remaining
        }

        null -> null
    }
}

private fun DailySummaryEntity.activityGoalRemaining(): Int? {
    return when (activityGoalBasis()) {
        ActivityGoalBasis.Calories -> {
            val target = targetCalories ?: return null
            val completed = activeCalories ?: return null
            (target - completed).coerceAtLeast(0)
        }

        ActivityGoalBasis.Distance -> {
            val target = activityGoalTarget() ?: return null
            val completed = equivalentWalkingDistance ?: return null
            (target - completed).coerceAtLeast(0)
        }

        null -> null
    }
}

private fun DailySummaryEntity.activityGoalProgress(): Float? {
    val target = activityGoalTarget()?.takeIf { it > 0 } ?: return null
    val completed = when (activityGoalBasis()) {
        ActivityGoalBasis.Calories -> activeCalories
        ActivityGoalBasis.Distance -> equivalentWalkingDistance
        null -> null
    } ?: return null
    return completed.toFloat() / target.toFloat()
}

private fun DailySummaryEntity.recoveryShare(): Float? {
    val recovery = recoveryHigh ?: return null
    val stress = stressHigh ?: return null
    val total = recovery + stress
    if (total <= 0) return null
    return recovery.toFloat() / total.toFloat()
}

private fun estimateSleepNeedSeconds(items: List<DailySummaryEntity>): Int? {
    val durations = items.mapNotNull { it.totalSleepSeconds() }.filter { it > 0 }
    if (durations.size < 5) return null
    val median = durations.sorted().let { sorted ->
        if (sorted.size % 2 == 0) {
            (sorted[sorted.size / 2] + sorted[sorted.size / 2 - 1]) / 2
        } else {
            sorted[sorted.size / 2]
        }
    }
    return median.coerceIn(23_400, 34_200)
}

private fun estimateSleepDebtSeconds(
    items: List<DailySummaryEntity>,
    sleepNeedByIndex: List<Int?>,
    startIndex: Int,
): Int? {
    val signedDebt = items.mapIndexedNotNull { offset, summary ->
        val sleepNeed = sleepNeedByIndex[startIndex + offset] ?: return@mapIndexedNotNull null
        val actual = summary.totalSleepSeconds() ?: return@mapIndexedNotNull null
        sleepNeed - actual
    }

    if (signedDebt.size < 5) return null
    return signedDebt.sum().coerceAtLeast(0)
}

private fun List<DailySummaryEntity>.windowEndingAt(index: Int, span: Int): List<DailySummaryEntity> {
    val start = (index - span + 1).coerceAtLeast(0)
    return subList(start, index + 1)
}

private fun List<DailySummaryEntity>.windowBefore(index: Int, span: Int): List<DailySummaryEntity> {
    if (index <= 0) return emptyList()
    val start = (index - span).coerceAtLeast(0)
    return subList(start, index)
}

private fun List<Double>.averageOrNull(): Double? = if (isEmpty()) null else average()

private fun List<DailySummaryEntity>.averageDelta(
    currentValue: Int?,
    selector: (DailySummaryEntity) -> Int?,
): Int? {
    val current = currentValue ?: return null
    val baseline = mapNotNull { selector(it)?.toDouble() }.averageOrNull() ?: return null
    return current - baseline.roundToInt()
}

private fun formatDecimal(value: Float, decimals: Int): String = "%.${decimals}f".format(value)

private fun formatSignedDecimal(value: Float, decimals: Int): String {
    val formatted = "%.${decimals}f".format(kotlin.math.abs(value))
    return if (value >= 0f) "+$formatted" else "-$formatted"
}

private fun formatCompactNumber(value: Int): String {
    return when {
        value >= 10_000 -> formatDecimal(value / 1000f, 1) + "k"
        value >= 1_000 -> formatDecimal(value / 1000f, 1) + "k"
        else -> value.toString()
    }
}
