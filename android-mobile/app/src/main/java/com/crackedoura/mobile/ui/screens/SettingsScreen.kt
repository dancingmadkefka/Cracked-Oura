package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import com.crackedoura.mobile.data.repository.SyncConfigDraft
import com.crackedoura.mobile.data.repository.SyncConfigValidator
import com.crackedoura.mobile.ui.MainUiState
import com.crackedoura.mobile.ui.formatDateTimeLabel

private val presetWindowDays = listOf(30, 90, 180, 365)

@Composable
fun SettingsScreen(
    padding: PaddingValues,
    uiState: MainUiState,
    onSaveSettings: (String, String, Int) -> Unit,
    onSaveAndSync: (String, String, Int) -> Unit,
) {
    var serverUrl by rememberSaveable(uiState.settings.serverUrl) {
        mutableStateOf(uiState.settings.serverUrl)
    }
    var token by rememberSaveable(uiState.settings.token) {
        mutableStateOf(uiState.settings.token)
    }
    var windowDays by rememberSaveable(uiState.settings.windowDays) {
        mutableStateOf(uiState.settings.windowDays.toString())
    }

    val draft = SyncConfigDraft(
        serverUrl = serverUrl,
        token = token,
        windowDaysText = windowDays,
    )
    val saveValidation = SyncConfigValidator.validateForSave(draft)
    val syncValidation = SyncConfigValidator.validateForSync(draft)
    val hasUnsavedChanges = serverUrl != uiState.settings.serverUrl ||
        token != uiState.settings.token ||
        windowDays != uiState.settings.windowDays.toString()

    LazyColumn(
        modifier = Modifier.padding(padding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HeroCard(
                eyebrow = "Desktop link",
                title = if (syncValidation.errors.hasErrors) "Finish setup before syncing" else "Connection looks ready",
                subtitle = if (syncValidation.errors.hasErrors) {
                    "This screen blocks bad URLs, missing tokens, and impossible sync windows before anything hits the network."
                } else {
                    "The desktop URL and token are valid. Save and sync will use the normalized address below."
                },
            )
        }

        item {
            SectionCard(
                title = "Server configuration",
                subtitle = "Paste a LAN or Tailscale address. The app will normalize the scheme and port for you.",
            ) {
                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = { serverUrl = it },
                    label = { Text("Desktop server") },
                    placeholder = { Text("192.168.178.91 or http://100.x.y.z:8037") },
                    supportingText = {
                        Text(
                            saveValidation.errors.serverUrl
                                ?: "Normalized: ${saveValidation.normalizedServerUrl.ifBlank { "Not ready yet" }}",
                        )
                    },
                    isError = saveValidation.errors.serverUrl != null,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        capitalization = KeyboardCapitalization.None,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = token,
                    onValueChange = { token = it.trimStart() },
                    label = { Text("Sync token") },
                    placeholder = { Text("Generated in the desktop app") },
                    supportingText = {
                        Text(
                            syncValidation.errors.token
                                ?: if (saveValidation.normalizedToken.isNotBlank()) {
                                    "Token accepted."
                                } else {
                                    "Paste the sync token from the desktop app."
                                },
                        )
                    },
                    isError = syncValidation.errors.token != null,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
            }
        }

        item {
            SectionCard(
                title = "Sync window",
                subtitle = "Shorter windows sync faster. Long windows backfill more history.",
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
                        Text(syncValidation.errors.windowDays ?: "Allowed range: 7-730 days.")
                    },
                    isError = syncValidation.errors.windowDays != null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
            }
        }

        item {
            SectionCard(
                title = "Readiness",
                subtitle = "Save and sync now share the same validation rules so broken settings never persist.",
            ) {
                StatusPill(
                    label = if (saveValidation.errors.hasErrors) "Configuration has blocking issues" else "Configuration is valid",
                    tone = if (saveValidation.errors.hasErrors) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary,
                )
                StatusPill(
                    label = if (syncValidation.errors.hasErrors) "Sync still blocked" else "Ready to sync",
                    tone = if (syncValidation.errors.hasErrors) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary,
                )
                Text(
                    text = uiState.settings.lastSyncAt?.let { "Last successful sync: ${formatDateTimeLabel(it)}" }
                        ?: "No completed sync on this device yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = uiState.settings.lastError?.let { "Last error: $it" } ?: "No sync errors recorded.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (uiState.settings.lastError != null) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        item {
            SectionCard(
                title = "Actions",
                subtitle = "Both actions normalize the configuration first. Nothing invalid is stored locally.",
            ) {
                Button(
                    onClick = {
                        onSaveSettings(
                            saveValidation.normalizedServerUrl,
                            saveValidation.normalizedToken,
                            saveValidation.normalizedWindowDays,
                        )
                    },
                    enabled = !saveValidation.errors.hasErrors && hasUnsavedChanges,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text("Save normalized configuration")
                }
                Button(
                    onClick = {
                        onSaveAndSync(
                            syncValidation.normalizedServerUrl,
                            syncValidation.normalizedToken,
                            syncValidation.normalizedWindowDays,
                        )
                    },
                    enabled = !syncValidation.errors.hasErrors && !uiState.isSyncing,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary,
                    ),
                ) {
                    Text(if (uiState.isSyncing) "Syncing now..." else "Save and sync now")
                }
            }
        }

        if (saveValidation.errors.hasErrors || syncValidation.errors.hasErrors) {
            item {
                SectionCard(
                    title = "What to fix",
                    subtitle = "The app surfaces only the checks that are currently blocking the action.",
                ) {
                    val issues = listOfNotNull(
                        saveValidation.errors.serverUrl,
                        syncValidation.errors.token,
                        syncValidation.errors.windowDays,
                    ).distinct()
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
