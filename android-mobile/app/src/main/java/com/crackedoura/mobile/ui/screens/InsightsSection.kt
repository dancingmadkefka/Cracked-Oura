package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.crackedoura.mobile.data.remote.ActionCardDto
import com.crackedoura.mobile.data.remote.ContributorSummaryDto
import com.crackedoura.mobile.data.remote.DailyGuidanceDto
import com.crackedoura.mobile.data.remote.SyncFreshnessDto
import com.crackedoura.mobile.data.remote.TodayInsightsDto

private fun severityTone(severity: String): Color = when (severity) {
    "critical" -> Color(0xFFE85D5D)
    "warning" -> Color(0xFFFFB347)
    else -> Color(0xFF3FA9F5)
}

private fun statusTone(status: String): Color = when (status) {
    "optimal" -> Color(0xFF18A685)
    "good" -> Color(0xFF3FA9F5)
    "fair" -> Color(0xFFFFB347)
    "pay_attention" -> Color(0xFFE85D5D)
    else -> Color.White.copy(alpha = 0.35f)
}

private fun statusLabel(status: String): String = when (status) {
    "optimal" -> "Optimal"
    "good" -> "Good"
    "fair" -> "Fair"
    "pay_attention" -> "Pay attention"
    else -> "Not exported"
}

private fun freshnessTone(status: String): Color = when (status) {
    "fresh" -> Color(0xFF18A685)
    "stale" -> Color(0xFFFFB347)
    "very_stale" -> Color(0xFFE85D5D)
    "syncing" -> Color(0xFF3FA9F5)
    "blocked" -> Color(0xFFE85D5D)
    else -> Color.White.copy(alpha = 0.4f)
}

private fun freshnessLabel(status: String): String = when (status) {
    "fresh" -> "Fresh"
    "stale" -> "Stale"
    "very_stale" -> "Very stale"
    "empty" -> "No data"
    "syncing" -> "Syncing"
    "blocked" -> "Blocked"
    else -> status
}

@Composable
fun GuidanceCard(guidance: DailyGuidanceDto) {
    SectionCard(title = "Today's guidance") {
        Text(
            text = guidance.headline,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )
        guidance.body.forEach { line ->
            Text(
                text = line,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.65f),
            )
        }
    }
}

@Composable
fun ActionCardsList(cards: List<ActionCardDto>) {
    if (cards.isEmpty()) return
    SectionCard(title = "Today's actions") {
        cards.forEach { card ->
            val tone = severityTone(card.severity)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = tone.copy(alpha = 0.10f)),
                border = BorderStroke(1.dp, tone.copy(alpha = 0.30f)),
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        text = card.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                    Text(
                        text = card.reason,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.7f),
                    )
                    Text(
                        text = card.recommendation,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.55f),
                    )
                }
            }
        }
    }
}

@Composable
fun ContributorList(title: String, items: List<ContributorSummaryDto>) {
    if (items.isEmpty()) return
    SectionCard(title = title) {
        items.forEach { contributor ->
            val tone = statusTone(contributor.status)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.padding(end = 8.dp)) {
                    Text(
                        text = contributor.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White,
                    )
                    Text(
                        text = statusLabel(contributor.status),
                        style = MaterialTheme.typography.labelSmall,
                        color = tone,
                    )
                }
                Text(
                    text = contributor.value?.toString() ?: "—",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.White.copy(alpha = 0.75f),
                )
            }
        }
    }
}

@Composable
fun SyncFreshnessPill(freshness: SyncFreshnessDto?) {
    if (freshness == null) return
    StatusPill(label = freshnessLabel(freshness.status), tone = freshnessTone(freshness.status))
}

@Composable
fun TodayInsightsSection(insights: TodayInsightsDto?) {
    insights ?: return
    insights.guidance?.let { GuidanceCard(it) }
    ActionCardsList(insights.actionCards)
    ContributorList("Sleep contributors", insights.contributorsSleep)
    ContributorList("Readiness contributors", insights.contributorsReadiness)
    ContributorList("Activity contributors", insights.contributorsActivity)
}
