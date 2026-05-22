package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private val AiAccentColor = Color(0xFF7B57F6)
private val AiSecondaryColor = Color(0xFF1479FF)

private data class AiBackend(
    val id: String,
    val label: String,
    val description: String,
    val color: Color,
)

private val aiBackends = listOf(
    AiBackend("desktop", "Desktop App", "Analyse via the Cracked Oura desktop app (default)", AiAccentColor),
    AiBackend("openai", "OpenAI API", "GPT-4o via OpenAI — requires API key in settings", Color(0xFF10A37F)),
    AiBackend("anthropic", "Anthropic", "Claude via Anthropic API — requires API key", Color(0xFFDA7756)),
    AiBackend("local", "Local LLM", "Ollama / LM Studio running on your machine", Color(0xFF1479FF)),
)

private val quickPrompts = listOf(
    "How is my sleep trending this week?",
    "What's my current recovery status?",
    "Summarise the last 7 days",
    "Why is my readiness low today?",
    "How does my HRV compare to my baseline?",
    "What's my average sleep score this month?",
)

@Composable
fun AIAnalystScreen(padding: PaddingValues) {
    var selectedBackendId by rememberSaveable { mutableStateOf("desktop") }

    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "AI",
                title = "AI Analyst",
                subtitle = "Ask your personal health assistant anything about your data.",
                accent = listOf(AiAccentColor, AiSecondaryColor),
            )
        }

        // Backend selection
        item {
            SectionCard(title = "Backend") {
                Text(
                    text = "Choose where your health data is analysed.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.45f),
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(aiBackends, key = { it.id }) { backend ->
                        FilterChip(
                            selected = selectedBackendId == backend.id,
                            onClick = { selectedBackendId = backend.id },
                            label = { Text(backend.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = backend.color.copy(alpha = 0.20f),
                                selectedLabelColor = backend.color,
                            ),
                        )
                    }
                }
                // Description of selected backend
                val current = aiBackends.firstOrNull { it.id == selectedBackendId }
                if (current != null) {
                    StatusPill(label = current.description, tone = current.color)
                }
            }
        }

        item {
            SectionCard(title = "Quick questions") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    quickPrompts.forEach { prompt ->
                        QuickPromptChip(prompt)
                    }
                }
            }
        }

        item {
            SectionCard(title = "How it works") {
                Text(
                    text = "The AI Analyst connects to your selected backend and sends your " +
                        "Oura health data for analysis. Choose a backend above — the desktop app " +
                        "requires no extra API keys; cloud backends require a key configured here.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.50f),
                )
                Spacer(modifier = Modifier.height(8.dp))
                StatusPill(
                    label = if (selectedBackendId == "desktop") "Requires desktop connection" else "API key required",
                    tone = AiAccentColor,
                )
            }
        }

        item {
            SectionCard(title = "Capabilities") {
                listOf(
                    "Sleep trend analysis",
                    "Readiness & HRV insights",
                    "Activity goal coaching",
                    "Temperature & recovery patterns",
                    "Personalised health summaries",
                ).forEach { capability ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .background(
                                    color = AiAccentColor.copy(alpha = 0.18f),
                                    shape = RoundedCornerShape(4.dp),
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                        ) {
                            Text(
                                text = "•",
                                style = MaterialTheme.typography.labelLarge,
                                color = AiAccentColor,
                            )
                        }
                        Text(
                            text = capability,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = Color.White.copy(alpha = 0.85f),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickPromptChip(text: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = AiAccentColor.copy(alpha = 0.09f),
                shape = RoundedCornerShape(16.dp),
            )
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White.copy(alpha = 0.85f),
        )
    }
}
