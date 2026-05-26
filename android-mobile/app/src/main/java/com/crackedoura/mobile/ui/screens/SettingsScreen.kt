package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.crackedoura.mobile.data.repository.SyncConfigValidator
import com.crackedoura.mobile.ui.MainUiState
import com.crackedoura.mobile.ui.formatDateTimeLabel

private val presetWindowDays = listOf(30, 90, 180, 365)
private val backgroundSyncOptions = listOf(0 to "Off", 6 to "Every 6h", 12 to "Every 12h", 24 to "Daily")

@Composable
fun SettingsScreen(
    padding: PaddingValues,
    uiState: MainUiState,
    onSaveSettings: (String, String, String, String, Int) -> Unit,
    onSaveAndSync: (String, String, String, String, Int) -> Unit,
    onDarkModeToggle: (Boolean?) -> Unit,
    onSaveUserName: (String) -> Unit,
    onSaveBackgroundSyncInterval: (Int) -> Unit = {},
) {
    var userName by rememberSaveable(uiState.settings.userName) {
        mutableStateOf(uiState.settings.userName)
    }
    var localServerUrl by rememberSaveable(uiState.settings.localServerUrl) {
        mutableStateOf(uiState.settings.localServerUrl)
    }
    var tailscaleServerUrl by rememberSaveable(uiState.settings.tailscaleServerUrl) {
        mutableStateOf(uiState.settings.tailscaleServerUrl)
    }
    var preferredNetwork by rememberSaveable(uiState.settings.preferredNetwork) {
        mutableStateOf(uiState.settings.preferredNetwork)
    }
    var token by rememberSaveable(uiState.settings.token) {
        mutableStateOf(uiState.settings.token)
    }
    var windowDays by rememberSaveable(uiState.settings.windowDays) {
        mutableStateOf(uiState.settings.windowDays.toString())
    }

    val hasEitherUrl = localServerUrl.isNotBlank() || tailscaleServerUrl.isNotBlank()
    val localValidation = SyncConfigValidator.validateForSave(
        com.crackedoura.mobile.data.repository.SyncConfigDraft(
            serverUrl = localServerUrl,
            token = token,
            windowDaysText = windowDays,
        ),
    )
    val tsValidation = SyncConfigValidator.validateForSave(
        com.crackedoura.mobile.data.repository.SyncConfigDraft(
            serverUrl = tailscaleServerUrl,
            token = token,
            windowDaysText = windowDays,
        ),
    )
    val windowDaysInt = windowDays.toIntOrNull() ?: 0
    val hasWindowError = windowDaysInt !in 7..730
    val hasUnsavedChanges = localServerUrl != uiState.settings.localServerUrl ||
        tailscaleServerUrl != uiState.settings.tailscaleServerUrl ||
        token != uiState.settings.token ||
        windowDays != uiState.settings.windowDays.toString()

    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "Settings",
                title = if (!hasEitherUrl || token.isBlank()) "Connect to desktop" else "Ready to sync",
                subtitle = when {
                    !hasEitherUrl -> "Enter your PC address (port 8037) on the same Wi‑Fi or Tailscale."
                    token.isBlank() -> "Copy the Mobile Sync token from Cracked Oura → Settings on your PC."
                    else -> "Pull the latest cache from your desktop app."
                },
            )
        }

        item {
            DesktopRoleBanner()
        }

        item {
            SyncFreshnessCard(
                freshness = uiState.syncFreshness,
                isPhoneSyncing = uiState.isSyncing,
            )
        }

        item {
            SectionCard(title = "Your profile") {
                OutlinedTextField(
                    value = userName,
                    onValueChange = { userName = it },
                    label = { Text("Display name") },
                    placeholder = { Text("e.g. Alex") },
                    supportingText = { Text("Used in your personalised greeting on the Today screen.") },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        capitalization = KeyboardCapitalization.Words,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Button(
                    onClick = { onSaveUserName(userName) },
                    enabled = userName != uiState.settings.userName,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Save name")
                }
            }
        }

        item {
            SectionCard(
                title = "Desktop server",
                subtitle = "Points at the read-only Mobile Sync API on your PC (default port 8037).",
            ) {
                OutlinedTextField(
                    value = localServerUrl,
                    onValueChange = { localServerUrl = it },
                    label = { Text("LAN address") },
                    placeholder = { Text("http://192.168.178.25:8037") },
                    supportingText = {
                        Text(
                            localValidation.errors.serverUrl
                                ?: "Normalized: ${localValidation.normalizedServerUrl.ifBlank { "Not set" }}",
                        )
                    },
                    isError = localValidation.errors.serverUrl != null,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        capitalization = KeyboardCapitalization.None,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = tailscaleServerUrl,
                    onValueChange = { tailscaleServerUrl = it },
                    label = { Text("Tailscale address") },
                    placeholder = { Text("100.x.y.z") },
                    supportingText = {
                        Text(
                            tsValidation.errors.serverUrl
                                ?: "Normalized: ${tsValidation.normalizedServerUrl.ifBlank { "Not set" }}",
                        )
                    },
                    isError = tsValidation.errors.serverUrl != null,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        capitalization = KeyboardCapitalization.None,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = preferredNetwork == "auto",
                        onClick = { preferredNetwork = "auto" },
                        label = { Text("Auto-detect") },
                    )
                    FilterChip(
                        selected = preferredNetwork == "local",
                        onClick = { preferredNetwork = "local" },
                        label = { Text("LAN only") },
                    )
                    FilterChip(
                        selected = preferredNetwork == "tailscale",
                        onClick = { preferredNetwork = "tailscale" },
                        label = { Text("Tailscale only") },
                    )
                }
            }
        }

        item {
            SectionCard(
                title = "Sync token",
                subtitle = "Generated in Cracked Oura on your PC — not your Oura password.",
            ) {
                OutlinedTextField(
                    value = token,
                    onValueChange = { token = it.trimStart() },
                    label = { Text("Token") },
                    placeholder = { Text("Generated in the desktop app") },
                    supportingText = {
                        Text(
                            localValidation.errors.token
                                ?: if (localValidation.normalizedToken.isNotBlank()) {
                                    "Token accepted."
                                } else {
                                    "Paste the sync token from the desktop app."
                                },
                        )
                    },
                    isError = localValidation.errors.token != null,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
            }
        }

        item {
            SectionCard(
                title = "History window",
                subtitle = "How many days of desktop data to copy to this phone.",
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    presetWindowDays.forEach { preset ->
                        AssistChip(
                            onClick = { windowDays = preset.toString() },
                            label = { Text("${preset}d") },
                        )
                    }
                }
                OutlinedTextField(
                    value = windowDays,
                    onValueChange = { value -> windowDays = value.filter { it.isDigit() } },
                    label = { Text("Days to cache") },
                    supportingText = {
                        Text(if (hasWindowError) "Must be between 7 and 730 days." else "Allowed range: 7-730 days.")
                    },
                    isError = hasWindowError,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
            }
        }

        item {
            SectionCard(
                title = "Background sync",
                subtitle = "Re-copy from the desktop server on a schedule (does not contact Oura).",
            ) {
                Text(
                    text = "Runs while the phone has network access and your PC server is reachable.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.55f),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    backgroundSyncOptions.forEach { (hours, label) ->
                        FilterChip(
                            selected = uiState.settings.backgroundSyncIntervalHours == hours,
                            onClick = { onSaveBackgroundSyncInterval(hours) },
                            label = { Text(label) },
                        )
                    }
                }
                Text(
                    text = uiState.settings.lastBackgroundRunAt
                        ?.let { "Last run: ${formatDateTimeLabel(it)}" }
                        ?: "No background run yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.45f),
                )
                Text(
                    text = uiState.settings.nextBackgroundRunAt
                        ?.let { "Next run: ${formatDateTimeLabel(it)}" }
                        ?: if (uiState.settings.backgroundSyncIntervalHours <= 0) {
                            "Schedule disabled."
                        } else {
                            "Next run will be scheduled after first sync."
                        },
                    style = MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.45f),
                )
                val lastBgError = uiState.settings.lastBackgroundError
                if (lastBgError != null) {
                    SyncDiagnosticsBlock(lastBgError)
                }
            }
        }

        item {
            SectionCard(title = "Appearance") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = uiState.darkMode == null,
                        onClick = { onDarkModeToggle(null) },
                        label = { Text("System") },
                    )
                    FilterChip(
                        selected = uiState.darkMode == false,
                        onClick = { onDarkModeToggle(false) },
                        label = { Text("Light") },
                    )
                    FilterChip(
                        selected = uiState.darkMode == true,
                        onClick = { onDarkModeToggle(true) },
                        label = { Text("Dark") },
                    )
                }
            }
        }

        item {
            SectionCard(title = "Status") {
                StatusPill(
                    label = if (!hasEitherUrl || token.isBlank() || hasWindowError) "Not ready" else "Ready to sync",
                    tone = if (!hasEitherUrl || token.isBlank() || hasWindowError) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary,
                )
                Text(
                    text = uiState.settings.lastSyncAt?.let { "Last phone sync: ${formatDateTimeLabel(it)}" }
                        ?: "No completed phone sync yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.45f),
                )
                val lastError = uiState.settings.lastError
                if (lastError == null) {
                    Text(
                        text = "No sync errors.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.45f),
                    )
                } else {
                    SyncDiagnosticsBlock(lastError)
                }
            }
        }

        item {
            SectionCard(title = "Actions") {
                Button(
                    onClick = {
                        onSaveSettings(
                            localValidation.normalizedServerUrl,
                            tsValidation.normalizedServerUrl,
                            preferredNetwork,
                            localValidation.normalizedToken,
                            localValidation.normalizedWindowDays,
                        )
                    },
                    enabled = hasEitherUrl && token.isNotBlank() && !hasWindowError && hasUnsavedChanges,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Save")
                }
                Button(
                    onClick = {
                        onSaveAndSync(
                            localValidation.normalizedServerUrl,
                            tsValidation.normalizedServerUrl,
                            preferredNetwork,
                            localValidation.normalizedToken,
                            localValidation.normalizedWindowDays,
                        )
                    },
                    enabled = hasEitherUrl && token.isNotBlank() && !hasWindowError && !uiState.isSyncing,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary,
                    ),
                ) {
                    if (uiState.isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                        )
                    }
                    Text(if (uiState.isSyncing) "Syncing..." else "Sync from desktop")
                }
            }
        }

        val issues = listOfNotNull(
            localValidation.errors.serverUrl,
            tsValidation.errors.serverUrl,
            localValidation.errors.token,
            if (hasWindowError) "Sync window must be between 7 and 730 days." else null,
        ).distinct()
        if (issues.isNotEmpty()) {
            item {
                SectionCard(title = "Issues to fix") {
                    issues.forEach { issue ->
                        Text(
                            text = "- $issue",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SyncDiagnosticsBlock(lastError: String) {
    val trimmed = lastError.trim()
    val headerEnd = trimmed.indexOf('\n')
    val header: String
    val bullets: List<String>
    if (headerEnd < 0) {
        header = trimmed
        bullets = emptyList()
    } else {
        header = trimmed.substring(0, headerEnd).trim()
        bullets = trimmed.substring(headerEnd + 1)
            .lines()
            .map { it.trim().removePrefix("•").trim() }
            .filter { it.isNotBlank() }
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = "Last error: $header",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.tertiary,
            fontWeight = FontWeight.SemiBold,
        )
        bullets.forEach { line ->
            Text(
                text = "• $line",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}
