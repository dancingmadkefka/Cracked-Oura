package com.crackedoura.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.crackedoura.mobile.data.remote.AnomalyResponseDto
import com.crackedoura.mobile.data.remote.MetricSpecDto
import com.crackedoura.mobile.data.remote.SavedInvestigationDto
import com.crackedoura.mobile.ui.AnalysisViewModel

private val CardBg = Color(0xFF1A2035)
private val SeverityCritical = Color(0xFFE53935)
private val SeverityWarning = Color(0xFFFF8F00)
private val SeverityLow = Color(0xFF43A047)

@Composable
fun AnalysisScreen(padding: PaddingValues, viewModel: AnalysisViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = listOf("Correlate", "Anomalies", "Saved")

    LaunchedEffect(Unit) {
        viewModel.loadAnomalies()
        viewModel.loadInvestigations()
    }

    Column(modifier = Modifier.padding(padding).fillMaxSize()) {
        Text(
            text = "Explorer runs queries on your desktop database via the Mobile Sync server — not on Oura directly.",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.5f),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        )
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { i, label ->
                Tab(selected = selectedTab == i, onClick = { selectedTab = i }, text = { Text(label) })
            }
        }
        when (selectedTab) {
            0 -> CorrelateTab(state, viewModel)
            1 -> AnomaliesTab(state)
            2 -> SavedTab(state, viewModel)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MetricDropdown(
    label: String,
    selected: MetricSpecDto?,
    options: List<MetricSpecDto>,
    onSelect: (MetricSpecDto) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = selected?.label ?: "Pick metric",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable).fillMaxWidth(),
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { metric ->
                DropdownMenuItem(
                    text = { Text("${metric.label} (${metric.unit})") },
                    onClick = { onSelect(metric); expanded = false },
                )
            }
        }
    }
}

@Composable
private fun CorrelateTab(state: AnalysisViewModel.UiState, viewModel: AnalysisViewModel) {
    val rangeDays = listOf(30, 90, 180)
    val lagRange = -7f..7f
    var showSaveDialog by rememberSaveable { mutableStateOf(false) }
    var saveName by rememberSaveable { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        contentPadding = PaddingValues(vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (state.catalogLoading) {
            item { Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
        }
        item {
            MetricDropdown("X metric", state.xMetric, state.catalog, viewModel::setXMetric)
        }
        item {
            MetricDropdown("Y metric", state.yMetric, state.catalog, viewModel::setYMetric)
        }
        item {
            Text("Lag: ${state.lagDays}d", style = MaterialTheme.typography.labelMedium)
            Slider(
                value = state.lagDays.toFloat(),
                onValueChange = { viewModel.setLag(it.toInt()) },
                valueRange = lagRange,
                steps = 13,
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Range:", modifier = Modifier.align(Alignment.CenterVertically))
                rangeDays.forEach { days ->
                    FilterChip(
                        selected = state.rangeDays == days,
                        onClick = { viewModel.setRange(days) },
                        label = { Text("${days}d") },
                    )
                }
            }
        }
        item {
            Button(
                onClick = { viewModel.runCorrelation() },
                enabled = !state.correlationLoading && state.xMetric != null && state.yMetric != null,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.correlationLoading) CircularProgressIndicator(modifier = Modifier.height(16.dp).width(16.dp))
                else Text("Run Correlation")
            }
        }
        state.correlationError?.let { err ->
            item {
                Text(err, color = SeverityCritical, style = MaterialTheme.typography.bodySmall)
            }
        }
        state.correlationResult?.let { result ->
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBg, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                ) {
                    val coef = result.coefficient
                    if (coef != null) {
                        Text("r = ${"%.3f".format(coef)}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    } else {
                        Text("— insufficient data —", color = Color.Gray)
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(result.interpretation, style = MaterialTheme.typography.bodyMedium)
                    result.warning?.let {
                        Spacer(Modifier.height(4.dp))
                        Text("⚠ $it", color = SeverityWarning, style = MaterialTheme.typography.bodySmall)
                    }
                    Text("n=${result.sampleCount} · lag=${result.lagDays}d", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    if (coef != null) {
                        Spacer(Modifier.height(8.dp))
                        if (showSaveDialog) {
                            OutlinedTextField(
                                value = saveName,
                                onValueChange = { saveName = it },
                                label = { Text("Investigation name") },
                                modifier = Modifier.fillMaxWidth(),
                            )
                            Spacer(Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = { viewModel.saveCurrentCorrelation(saveName.ifBlank { "${state.xMetric?.label} × ${state.yMetric?.label}" }); showSaveDialog = false }) {
                                    Text("Save")
                                }
                                Button(onClick = { showSaveDialog = false }) { Text("Cancel") }
                            }
                        } else {
                            Button(onClick = { showSaveDialog = true; saveName = "" }) { Text("Save investigation") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AnomaliesTab(state: AnalysisViewModel.UiState) {
    if (state.anomaliesLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    if (state.anomalies.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No anomalies detected for ${state.anomaliesDay}", color = Color.Gray)
        }
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        contentPadding = PaddingValues(vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(state.anomalies) { anomaly -> AnomalyCard(anomaly) }
    }
}

@Composable
private fun AnomalyCard(a: AnomalyResponseDto) {
    val severityColor = when (a.severity.lowercase()) {
        "critical" -> SeverityCritical
        "warning" -> SeverityWarning
        else -> SeverityLow
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(CardBg, RoundedCornerShape(12.dp))
            .padding(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.background(severityColor.copy(alpha = 0.2f), RoundedCornerShape(6.dp)).padding(horizontal = 8.dp, vertical = 2.dp)
            ) { Text(a.severity, color = severityColor, style = MaterialTheme.typography.labelSmall) }
            Spacer(Modifier.width(8.dp))
            Text(a.label, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(4.dp))
        Text("${a.value} ${a.unit}  (baseline ≈ ${"%.1f".format(a.baselineMedian)})", style = MaterialTheme.typography.bodySmall)
        Text("z = ${"%.2f".format(a.score)} · ${a.direction} · ${a.day}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
    }
}

@Composable
private fun SavedTab(state: AnalysisViewModel.UiState, viewModel: AnalysisViewModel) {
    if (state.investigationsLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    if (state.investigations.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No saved investigations yet.", color = Color.Gray)
        }
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        contentPadding = PaddingValues(vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(state.investigations) { inv -> InvestigationCard(inv, onDelete = { viewModel.deleteInvestigation(inv.id) }) }
    }
}

@Composable
private fun InvestigationCard(inv: SavedInvestigationDto, onDelete: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CardBg, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(inv.name, fontWeight = FontWeight.SemiBold)
            Text("${inv.kind} · ${inv.createdAt.take(10)}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
        }
        IconButton(onClick = onDelete) {
            Icon(Icons.Outlined.Delete, contentDescription = "Delete", tint = SeverityCritical.copy(alpha = 0.7f))
        }
    }
}

