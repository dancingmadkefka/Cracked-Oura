package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun AIAnalystScreen(padding: PaddingValues) {
    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "Advisor",
                title = "Desktop only for now",
                subtitle = "AI chat runs in the Cracked Oura desktop app. This phone app is for viewing synced data.",
            )
        }
        item {
            DesktopRoleBanner()
        }
        item {
            SectionCard(title = "On the desktop app") {
                Text(
                    text = "Open the Advisor / chat panel on your PC to ask questions about your Oura data. " +
                        "The desktop app has access to your full local database and configured LLM.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.72f),
                )
            }
        }
        item {
            SectionCard(title = "On this phone") {
                Text(
                    text = "Use Today, Sleep, Trends, and Explorer to browse data copied from your PC. " +
                        "Pull to refresh or use Settings → Sync from desktop to update the cache.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.72f),
                )
            }
        }
    }
}
