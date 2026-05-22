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

@Composable
fun SettingsScreen(
    padding: PaddingValues,
    uiState: MainUiState,
    onSaveSettings: (String, String, String, String, Int) -> Unit,
    onSaveAndSync: (String, String, String, String, Int) -> Unit,
    onDarkModeToggle: (Boolean?) -> Unit,
    onSaveUserName: (String) -> Unit,
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
                title = if (!hasEitherUrl || token.isBlank()) "Set up connection" else "Ready to sync",
                subtitle = when {
                    !hasEitherUrl -> "Add at least one server address to get started."
                    token.isBlank() -> "Add your sync token from the desktop app."
                    else -> "Ready to sync."
                },
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
            SectionCard(title = "Server addresses") {
                OutlinedTextField(
                    value = localServerUrl,
                    onValueChange = { localServerUrl = it },
                    label = { Text("LAN address") },
                    placeholder = { Text("192.168.178.91") },
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
            SectionCard(title = "Sync token") {
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
            SectionCard(title = "Sync window") {
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
                    text = uiState.settings.lastSyncAt?.let { "Last sync: ${formatDateTimeLabel(it)}" }
                        ?: "No completed sync yet.",
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
                    Text(if (uiState.isSyncing) "Syncing..." else "Save and sync")
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
