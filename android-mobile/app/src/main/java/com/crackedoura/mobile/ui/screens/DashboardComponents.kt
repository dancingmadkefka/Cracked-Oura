package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun HeroCard(
    eyebrow: String,
    title: String,
    subtitle: String = "",
    modifier: Modifier = Modifier,
    accent: List<Color> = listOf(
        MaterialTheme.colorScheme.primary,
        MaterialTheme.colorScheme.secondary,
    ),
    content: @Composable (() -> Unit)? = null,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
    ) {
        Box(
            modifier = Modifier
                .background(
                    brush = Brush.linearGradient(accent),
                    shape = RoundedCornerShape(28.dp),
                )
                .padding(20.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = eyebrow.uppercase(),
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.72f),
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                )
                if (subtitle.isNotBlank()) {
                    Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.84f),
                    )
                }
                if (content != null) {
                    content()
                }
            }
        }
    }
}

@Composable
fun SectionCard(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge)
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            content()
        }
    }
}

@Composable
fun StatusPill(
    label: String,
    tone: Color,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .background(
                color = tone.copy(alpha = 0.12f),
                shape = RoundedCornerShape(999.dp),
            )
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .background(tone, CircleShape)
                .size(8.dp),
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = tone,
        )
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    accentColor: Color,
    progress: Float? = null,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    title,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Box(
                    modifier = Modifier
                        .background(accentColor.copy(alpha = 0.18f), CircleShape)
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                ) {
                    Text(
                        text = "Live",
                        style = MaterialTheme.typography.labelLarge,
                        color = accentColor,
                    )
                }
            }
            Text(
                value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (progress != null) {
                LinearProgressIndicator(
                    progress = { progress.coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth(),
                    color = accentColor,
                    trackColor = accentColor.copy(alpha = 0.12f),
                )
            }
        }
    }
}

@Composable
fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
fun TrendSparkline(values: List<Int?>, color: Color, modifier: Modifier = Modifier) {
    if (values.isEmpty()) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(88.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(18.dp)),
        )
        return
    }

    val normalized = values.mapNotNull { it?.toFloat() }
    val min = normalized.minOrNull() ?: 0f
    val max = normalized.maxOrNull() ?: 100f
    val range = (max - min).takeIf { it > 0f } ?: 1f

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(88.dp),
    ) {
        val points = values.mapIndexedNotNull { index, value ->
            value?.let {
                val x = if (values.size == 1) 0f else size.width * index / (values.size - 1)
                val normalizedY = 1f - ((it - min) / range)
                Offset(x, normalizedY * size.height)
            }
        }

        val fillPath = Path()
        val strokePath = Path()

        points.forEachIndexed { index, offset ->
            if (index == 0) {
                strokePath.moveTo(offset.x, offset.y)
                fillPath.moveTo(offset.x, size.height)
                fillPath.lineTo(offset.x, offset.y)
            } else {
                strokePath.lineTo(offset.x, offset.y)
                fillPath.lineTo(offset.x, offset.y)
            }
        }

        if (points.isNotEmpty()) {
            fillPath.lineTo(points.last().x, size.height)
            fillPath.close()
        }

        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.25f), Color.Transparent),
            ),
        )
        drawPath(
            path = strokePath,
            color = color,
            style = Stroke(width = 5f),
        )
    }
}

@Composable
fun EmptyStateCard(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
) {
    SectionCard(
        title = title,
        modifier = modifier,
        subtitle = body,
    ) {}
}
