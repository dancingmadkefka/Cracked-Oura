package com.crackedoura.mobile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.crackedoura.mobile.data.remote.AnomalyResponseDto
import com.crackedoura.mobile.data.remote.CorrelationResponseDto
import com.crackedoura.mobile.data.remote.MetricSpecDto
import com.crackedoura.mobile.data.remote.SavedInvestigationDto
import com.crackedoura.mobile.data.repository.OuraRepository
import com.crackedoura.mobile.util.AppLogger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.LocalDate

class AnalysisViewModel(private val repository: OuraRepository) : ViewModel() {

    companion object { private const val TAG = "AnalysisViewModel" }

    data class UiState(
        val catalog: List<MetricSpecDto> = emptyList(),
        val catalogLoading: Boolean = false,
        val xMetric: MetricSpecDto? = null,
        val yMetric: MetricSpecDto? = null,
        val lagDays: Int = 0,
        val rangeDays: Int = 90,
        val correlationResult: CorrelationResponseDto? = null,
        val correlationLoading: Boolean = false,
        val correlationError: String? = null,
        val anomalies: List<AnomalyResponseDto> = emptyList(),
        val anomaliesLoading: Boolean = false,
        val anomaliesDay: String = LocalDate.now().toString(),
        val investigations: List<SavedInvestigationDto> = emptyList(),
        val investigationsLoading: Boolean = false,
        val toast: String? = null,
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { loadCatalog() }

    fun loadCatalog() {
        viewModelScope.launch {
            _state.update { it.copy(catalogLoading = true) }
            repository.fetchCatalog().onSuccess { catalog ->
                _state.update { s ->
                    s.copy(
                        catalog = catalog,
                        catalogLoading = false,
                        xMetric = s.xMetric ?: catalog.firstOrNull(),
                        yMetric = s.yMetric ?: catalog.drop(1).firstOrNull(),
                    )
                }
            }.onFailure { e ->
                AppLogger.w(TAG, "Catalog fetch failed", e)
                _state.update { it.copy(catalogLoading = false, toast = "Catalog unavailable: ${e.message}") }
            }
        }
    }

    fun setXMetric(m: MetricSpecDto) { _state.update { it.copy(xMetric = m, correlationResult = null) } }
    fun setYMetric(m: MetricSpecDto) { _state.update { it.copy(yMetric = m, correlationResult = null) } }
    fun setLag(lag: Int) { _state.update { it.copy(lagDays = lag) } }
    fun setRange(days: Int) { _state.update { it.copy(rangeDays = days, correlationResult = null) } }

    fun runCorrelation() {
        val s = _state.value
        val x = s.xMetric?.path ?: return
        val y = s.yMetric?.path ?: return
        viewModelScope.launch {
            _state.update { it.copy(correlationLoading = true, correlationError = null) }
            val end = LocalDate.now()
            val start = end.minusDays(s.rangeDays.toLong() - 1)
            repository.runCorrelation(x, y, s.lagDays, "pearson", start.toString(), end.toString())
                .onSuccess { result ->
                    _state.update { it.copy(correlationLoading = false, correlationResult = result) }
                }.onFailure { e ->
                    AppLogger.w(TAG, "Correlation failed", e)
                    _state.update { it.copy(correlationLoading = false, correlationError = e.message ?: "Failed") }
                }
        }
    }

    fun loadAnomalies(day: String = LocalDate.now().toString()) {
        viewModelScope.launch {
            _state.update { it.copy(anomaliesLoading = true, anomaliesDay = day) }
            repository.fetchAnomalies(day)
                .onSuccess { list -> _state.update { it.copy(anomaliesLoading = false, anomalies = list) } }
                .onFailure { e ->
                    AppLogger.w(TAG, "Anomalies fetch failed", e)
                    _state.update { it.copy(anomaliesLoading = false, toast = "Anomalies unavailable: ${e.message}") }
                }
        }
    }

    fun loadInvestigations() {
        viewModelScope.launch {
            _state.update { it.copy(investigationsLoading = true) }
            repository.listInvestigations()
                .onSuccess { list -> _state.update { it.copy(investigationsLoading = false, investigations = list) } }
                .onFailure { e ->
                    AppLogger.w(TAG, "Investigations fetch failed", e)
                    _state.update { it.copy(investigationsLoading = false, toast = "Investigations unavailable: ${e.message}") }
                }
        }
    }

    fun saveCurrentCorrelation(name: String) {
        val result = _state.value.correlationResult ?: return
        val rangeDays = _state.value.rangeDays
        viewModelScope.launch {
            val payload = buildJsonObject {
                put("x_metric", result.xMetric)
                put("y_metric", result.yMetric)
                put("lag_days", result.lagDays)
                result.coefficient?.let { put("coefficient", it.toDouble()) }
                put("interpretation", result.interpretation)
                put("range_days", rangeDays)
            }
            repository.createInvestigation(name, "correlation", payload)
                .onSuccess { _state.update { it.copy(toast = "Saved \"$name\"") }; loadInvestigations() }
                .onFailure { e -> _state.update { it.copy(toast = "Save failed: ${e.message}") } }
        }
    }

    fun deleteInvestigation(id: String) {
        viewModelScope.launch {
            repository.deleteInvestigation(id)
                .onSuccess {
                    _state.update { it.copy(investigations = it.investigations.filter { inv -> inv.id != id }, toast = "Deleted") }
                }.onFailure { e -> _state.update { it.copy(toast = "Delete failed: ${e.message}") } }
        }
    }

    fun clearToast() { _state.update { it.copy(toast = null) } }

    class Factory(private val repository: OuraRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(AnalysisViewModel::class.java)) return AnalysisViewModel(repository) as T
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
