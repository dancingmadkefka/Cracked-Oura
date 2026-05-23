package com.crackedoura.mobile.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class MetricSpecDto(
    val path: String,
    val label: String,
    val unit: String,
    val domain: String,
    val preferred: String? = null,
    val description: String = "",
)

@Serializable
data class CorrelationResponseDto(
    @SerialName("x_metric") val xMetric: String,
    @SerialName("y_metric") val yMetric: String,
    @SerialName("lag_days") val lagDays: Int,
    val method: String,
    val coefficient: Float? = null,
    @SerialName("sample_count") val sampleCount: Int,
    @SerialName("paired_dates") val pairedDates: List<List<String>> = emptyList(),
    val warning: String? = null,
    val interpretation: String,
)

@Serializable
data class AnomalyResponseDto(
    @SerialName("metric_path") val metricPath: String,
    val label: String,
    val unit: String,
    val day: String,
    val value: Float,
    @SerialName("baseline_median") val baselineMedian: Float,
    @SerialName("baseline_mad") val baselineMad: Float,
    val score: Float,
    val direction: String,
    val severity: String,
    @SerialName("baseline_window") val baselineWindow: Int,
    val method: String,
    val note: String,
)

@Serializable
data class SavedInvestigationDto(
    val id: String,
    val name: String,
    val kind: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    val payload: JsonObject? = null,
)

@Serializable
data class InvestigationCreateDto(
    val name: String,
    val kind: String = "correlation",
    val payload: JsonObject? = null,
)
