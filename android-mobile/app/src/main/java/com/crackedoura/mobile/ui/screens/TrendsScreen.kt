package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.crackedoura.mobile.ui.DailyInsight
import com.crackedoura.mobile.ui.MetricFamily
import com.crackedoura.mobile.ui.MetricWindow
import com.crackedoura.mobile.ui.TrendMetricDefinition
import com.crackedoura.mobile.ui.defaultMetricForFamily
import com.crackedoura.mobile.ui.findMetric
import com.crackedoura.mobile.ui.formatDateRange
import com.crackedoura.mobile.ui.formatDayLabel
import com.crackedoura.mobile.ui.formatDayMonth
import com.crackedoura.mobile.ui.formatDurationHours
import com.crackedoura.mobile.ui.formatDurationSeconds
import com.crackedoura.mobile.ui.formatMeters
import com.crackedoura.mobile.ui.formatPercent
import com.crackedoura.mobile.ui.formatSignedDelta
import com.crackedoura.mobile.ui.insightsForWindow
import com.crackedoura.mobile.ui.metricsForFamily
import kotlin.math.roundToInt

private data class ChartPoint(
    val insight: DailyInsight,
    val value: Float,
)

@Composable
fun TrendsScreen(
    padding: PaddingValues,
    insights: List<DailyInsight>,
    onOpenDayDetail: (String) -> Unit,
) {
    var selectedFamilyName by rememberSaveable { mutableStateOf(MetricFamily.Scores.name) }
    var selectedMetricId by rememberSaveable { mutableStateOf(defaultMetricForFamily(MetricFamily.Scores).id) }
    var selectedWindowName by rememberSaveable { mutableStateOf(MetricWindow.Month.name) }
    var selectedDay by rememberSaveable { mutableStateOf<String?>(null) }

    val selectedFamily = MetricFamily.valueOf(selectedFamilyName)
    val selectedWindow = MetricWindow.valueOf(selectedWindowName)
    val familyMetrics = metricsForFamily(selectedFamily)

    LaunchedEffect(selectedFamilyName) {
        if (familyMetrics.none { it.id == selectedMetricId }) {
            selectedMetricId = familyMetrics.first().id
        }
    }

    val metric = remember(selectedMetricId) { findMetric(selectedMetricId) }
    val windowInsights = remember(insights, selectedWindow) {
        insightsForWindow(insights, selectedWindow)
    }
    val points = remember(windowInsights, metric.id) {
        windowInsights.mapNotNull { insight ->
            metric.selector(insight)?.let { ChartPoint(insight, it) }
        }
    }

    LaunchedEffect(metric.id, selectedWindowName, points.lastOrNull()?.insight?.day) {
        if (points.none { it.insight.day == selectedDay }) {
            selectedDay = points.lastOrNull()?.insight?.day
        }
    }

    val selectedPoint = points.firstOrNull { it.insight.day == selectedDay } ?: points.lastOrNull()
    val selectedInsight = selectedPoint?.insight
    val averageValue = points.takeIf { it.isNotEmpty() }?.map { it.value }?.average()?.toFloat()
    val minPoint = points.minByOrNull { it.value }
    val maxPoint = points.maxByOrNull { it.value }

    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "Trend explorer",
                title = if (points.isEmpty()) "No trend data yet" else metric.title,
                subtitle = if (windowInsights.isEmpty()) {
                    "Sync from the desktop app to unlock local trend exploration."
                } else {
                    "${metric.description} Window: ${formatDateRange(windowInsights.firstOrNull()?.day, windowInsights.lastOrNull()?.day)}."
                },
                accent = listOf(metric.color, metric.color.copy(alpha = 0.65f)),
            )
        }

        if (insights.isEmpty()) {
            item {
                EmptyStateCard(
                    title = "Trend cache empty",
                    body = "The phone does not have enough local data yet to draw charts. Sync once from the desktop app first.",
                )
            }
            return@LazyColumn
        }

        item {
            SectionCard(
                title = "Metric family",
                subtitle = "Choose the type of metric first so charts stay clearly grouped by scores, sleep, activity, or recovery.",
            ) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(MetricFamily.entries, key = { it.name }) { family ->
                        FilterChip(
                            selected = selectedFamily == family,
                            onClick = { selectedFamilyName = family.name },
                            label = { Text(family.label) },
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "Metric",
                subtitle = "Labels include units so you can see at a glance whether this is a score, duration, steps, calories, or a recovery marker.",
            ) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(familyMetrics, key = { it.id }) { definition ->
                        FilterChip(
                            selected = selectedMetricId == definition.id,
                            onClick = { selectedMetricId = definition.id },
                            label = { Text(definition.shortLabel) },
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "Time window",
                subtitle = "${windowInsights.size} synced days available in this view.",
            ) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(MetricWindow.entries, key = { it.name }) { window ->
                        FilterChip(
                            selected = selectedWindow == window,
                            onClick = { selectedWindowName = window.name },
                            label = { Text(window.label) },
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "Chart",
                subtitle = if (points.isEmpty()) {
                    "This metric has no values inside the selected window."
                } else {
                    "Tap the chart to inspect a day, then open the dedicated detail view."
                },
            ) {
                if (points.isEmpty()) {
                    Text(
                        text = "No values are available for ${metric.title.lowercase()} in the selected window.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TrendSummaryTile(
                            title = "Average",
                            value = averageValue?.let(metric.formatter) ?: "Unavailable",
                            caption = metric.unitLabel,
                            color = metric.color,
                            modifier = Modifier.weight(1f),
                        )
                        TrendSummaryTile(
                            title = "Range",
                            value = buildString {
                                append(minPoint?.value?.let(metric.formatter) ?: "--")
                                append(" to ")
                                append(maxPoint?.value?.let(metric.formatter) ?: "--")
                            },
                            caption = "Min to max",
                            color = metric.color,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    TrendChart(
                        points = points,
                        metric = metric,
                        selectedDay = selectedPoint?.insight?.day,
                        onSelectDay = { selectedDay = it },
                    )
                    selectedInsight?.let { insight ->
                        SelectedDayCallout(
                            insight = insight,
                            metric = metric,
                            metricValue = selectedPoint?.value,
                            onOpenDayDetail = { onOpenDayDetail(insight.day) },
                        )
                    }
                }
            }
        }

        item {
            SectionCard(
                title = "Recent values",
                subtitle = "A clear day-by-day ledger for the current metric and time window.",
            ) {
                if (points.isEmpty()) {
                    Text(
                        text = "No values to list for this metric yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    points.takeLast(8).reversed().forEach { point ->
                        RecentValueRow(
                            insight = point.insight,
                            metric = metric,
                            value = point.value,
                            onOpenDayDetail = { onOpenDayDetail(point.insight.day) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TrendSummaryTile(
    title: String,
    value: String,
    caption: String,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(22.dp))
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = color,
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
private fun TrendChart(
    points: List<ChartPoint>,
    metric: TrendMetricDefinition,
    selectedDay: String?,
    onSelectDay: (String) -> Unit,
) {
    val maxValue = points.maxOf { it.value }
    val minValue = points.minOf { it.value }
    val average = points.map { it.value }.average().toFloat()
    val yLabels = listOf(maxValue, (maxValue + minValue) / 2f, minValue)
    val selectedIndex = points.indexOfFirst { it.insight.day == selectedDay }.coerceAtLeast(0)
    var chartWidth by remember { mutableIntStateOf(0) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(
                modifier = Modifier.height(220.dp),
                verticalArrangement = Arrangement.SpaceBetween,
                horizontalAlignment = Alignment.End,
            ) {
                yLabels.forEach { label ->
                    Text(
                        text = metric.formatter(label),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(220.dp)
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.36f),
                        shape = RoundedCornerShape(22.dp),
                    )
                    .onSizeChanged { chartWidth = it.width }
                    .pointerInput(points, chartWidth) {
                        detectTapGestures { offset ->
                            if (points.size == 1 || chartWidth == 0) {
                                onSelectDay(points.first().insight.day)
                            } else {
                                val rawIndex = ((offset.x / chartWidth) * (points.lastIndex)).roundToInt()
                                val index = rawIndex.coerceIn(0, points.lastIndex)
                                onSelectDay(points[index].insight.day)
                            }
                        }
                    }
                    .padding(14.dp),
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val topPadding = 10f
                    val bottomPadding = 12f
                    val plotHeight = size.height - topPadding - bottomPadding
                    val range = (maxValue - minValue).takeIf { it > 0f } ?: 1f

                    yLabels.forEach { label ->
                        val normalized = 1f - ((label - minValue) / range)
                        val y = topPadding + normalized * plotHeight
                        drawLine(
                            color = Color.White.copy(alpha = 0.18f),
                            start = Offset(0f, y),
                            end = Offset(size.width, y),
                            strokeWidth = 2f,
                        )
                    }

                    val averageY = topPadding + (1f - ((average - minValue) / range)) * plotHeight
                    drawLine(
                        color = metric.color.copy(alpha = 0.25f),
                        start = Offset(0f, averageY),
                        end = Offset(size.width, averageY),
                        strokeWidth = 2f,
                    )

                    val coordinates = points.mapIndexed { index, point ->
                        val x = if (points.size == 1) size.width / 2f else size.width * index / (points.size - 1)
                        val normalized = 1f - ((point.value - minValue) / range)
                        val y = topPadding + normalized * plotHeight
                        Offset(x, y)
                    }

                    val fillPath = Path()
                    val linePath = Path()

                    coordinates.forEachIndexed { index, offset ->
                        if (index == 0) {
                            fillPath.moveTo(offset.x, size.height)
                            fillPath.lineTo(offset.x, offset.y)
                            linePath.moveTo(offset.x, offset.y)
                        } else {
                            fillPath.lineTo(offset.x, offset.y)
                            linePath.lineTo(offset.x, offset.y)
                        }
                    }

                    if (coordinates.isNotEmpty()) {
                        fillPath.lineTo(coordinates.last().x, size.height)
                        fillPath.close()
                    }

                    drawPath(
                        path = fillPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(metric.color.copy(alpha = 0.28f), Color.Transparent),
                        ),
                    )
                    drawPath(
                        path = linePath,
                        color = metric.color,
                        style = Stroke(width = 5f),
                    )

                    coordinates.forEachIndexed { index, offset ->
                        val isSelected = index == selectedIndex
                        drawCircle(
                            color = if (isSelected) Color.White else metric.color.copy(alpha = 0.3f),
                            radius = if (isSelected) 10f else 6f,
                            center = offset,
                        )
                        drawCircle(
                            color = metric.color,
                            radius = if (isSelected) 5f else 3f,
                            center = offset,
                        )
                    }
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = formatDayMonth(points.firstOrNull()?.insight?.day),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = points.getOrNull(points.lastIndex / 2)?.insight?.day?.let(::formatDayMonth) ?: "--",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = formatDayMonth(points.lastOrNull()?.insight?.day),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SelectedDayCallout(
    insight: DailyInsight,
    metric: TrendMetricDefinition,
    metricValue: Float?,
    onOpenDayDetail: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = metric.color.copy(alpha = 0.08f),
                shape = RoundedCornerShape(22.dp),
            )
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = formatDayLabel(insight.day),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = metricValue?.let(metric.formatter) ?: "Unavailable",
                        style = MaterialTheme.typography.headlineSmall,
                        color = metric.color,
                    )
                }
                Button(onClick = onOpenDayDetail) {
                    Text("Open day detail")
                }
            }
            Text(
                text = selectedDayContext(metric, insight),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun RecentValueRow(
    insight: DailyInsight,
    metric: TrendMetricDefinition,
    value: Float,
    onOpenDayDetail: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = formatDayLabel(insight.day),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = selectedDayContext(metric, insight),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = metric.formatter(value),
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "View",
                modifier = Modifier
                    .background(
                        color = metric.color.copy(alpha = 0.12f),
                        shape = CircleShape,
                    )
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .pointerInput(Unit) {
                        detectTapGestures(onTap = { onOpenDayDetail() })
                    },
                color = metric.color,
                style = MaterialTheme.typography.labelLarge,
            )
        }
    }
}

private fun selectedDayContext(
    metric: TrendMetricDefinition,
    insight: DailyInsight,
): String {
    return when (metric.id) {
        "sleep_score" -> {
            val duration = formatDurationSeconds(insight.totalSleepSeconds)
            val debt = formatDurationHours(insight.sleepDebtSeconds)
            "Total sleep $duration • Sleep debt $debt"
        }

        "readiness_score" -> {
            val delta = formatSignedDelta(insight.readinessDelta)
            val baseline = insight.readinessBaseline?.let { "14d baseline ${it.roundToInt()}" } ?: "No readiness baseline yet"
            "$delta vs baseline • $baseline"
        }

        "activity_score" -> {
            val steps = insight.summary.steps?.toString() ?: "No steps"
            val calories = insight.summary.activeCalories?.let { "$it kcal active" } ?: "No active calories"
            "$steps steps • $calories"
        }

        "total_sleep" -> {
            val need = formatDurationHours(insight.sleepNeedEstimateSeconds)
            val naps = formatDurationSeconds(insight.summary.napSleepDuration)
            "Need estimate $need • Nap sleep $naps"
        }

        "sleep_debt" -> {
            "Need estimate ${formatDurationHours(insight.sleepNeedEstimateSeconds)} • ${insight.summary.sleepSessionCount ?: 0} sessions counted"
        }

        "deep_sleep" -> {
            "REM ${formatDurationSeconds(insight.summary.remSleepDuration)} • Awake ${formatDurationSeconds(insight.summary.awakeTime)}"
        }

        "steps" -> {
            val goal = insight.activityGoalProgress?.let { formatPercent(it) } ?: "No target"
            "Activity goal $goal • ${insight.summary.activeCalories ?: 0} active kcal"
        }

        "active_calories" -> {
            "Target progress ${insight.activityGoalProgress?.let { formatPercent(it) } ?: "Unavailable"}"
        }

        "goal_progress" -> {
            val remaining = insight.activityGoalRemaining?.let {
                when (insight.activityGoalBasis?.unit) {
                    "m" -> "${formatMeters(it)} left"
                    else -> "$it ${insight.activityGoalBasis?.unit ?: ""} left".trim()
                }
            } ?: "Target details unavailable"
            remaining
        }

        "average_hrv" -> {
            val baseline = insight.hrvBaseline?.let { "${it.roundToInt()} ms baseline" } ?: "No HRV baseline yet"
            "${formatSignedDelta(insight.hrvDelta, "ms")} vs baseline • $baseline"
        }

        "average_hr" -> {
            val lowest = insight.summary.lowestHeartRate?.let { "$it bpm lowest" } ?: "Lowest HR unavailable"
            "$lowest • ${formatSignedDelta(insight.restingHeartRateDelta, "bpm")} vs baseline"
        }

        "temperature_deviation" -> {
            insight.summary.readinessDaySummary ?: "Temperature trend from the readiness summary."
        }

        else -> metric.description
    }
}
