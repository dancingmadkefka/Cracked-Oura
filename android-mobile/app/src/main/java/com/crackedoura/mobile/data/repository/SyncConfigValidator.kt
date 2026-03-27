package com.crackedoura.mobile.data.repository

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

private const val DEFAULT_SYNC_PORT = 8037

data class ValidatedSyncConfig(
    val serverUrl: String,
    val token: String,
    val windowDays: Int,
)

data class SyncConfigDraft(
    val serverUrl: String,
    val token: String,
    val windowDaysText: String,
)

data class SyncConfigFieldErrors(
    val serverUrl: String? = null,
    val token: String? = null,
    val windowDays: String? = null,
) {
    val hasErrors: Boolean = serverUrl != null || token != null || windowDays != null
}

data class SyncConfigValidationResult(
    val normalizedServerUrl: String,
    val normalizedToken: String,
    val normalizedWindowDays: Int,
    val errors: SyncConfigFieldErrors,
)

object SyncConfigValidator {
    fun validateForSave(draft: SyncConfigDraft): SyncConfigValidationResult =
        validate(draft = draft, requireToken = true)

    fun validatedConfigForSave(
        serverUrl: String,
        token: String,
        windowDays: Int,
    ): ValidatedSyncConfig {
        val result = validateForSave(
            SyncConfigDraft(
                serverUrl = serverUrl,
                token = token,
                windowDaysText = windowDays.toString(),
            ),
        )
        if (result.errors.hasErrors) {
            throw IllegalArgumentException(
                result.errors.serverUrl ?: result.errors.token ?: result.errors.windowDays
                ?: "Invalid sync settings.",
            )
        }
        return ValidatedSyncConfig(
            serverUrl = result.normalizedServerUrl,
            token = result.normalizedToken,
            windowDays = result.normalizedWindowDays,
        )
    }

    private fun validate(
        draft: SyncConfigDraft,
        requireToken: Boolean,
    ): SyncConfigValidationResult {
        val serverUrl = normalizeServerUrl(draft.serverUrl)
        val token = normalizeToken(draft.token)
        val windowDays = draft.windowDaysText.trim().toIntOrNull()

        val serverError = when {
            serverUrl.isBlank() -> "Enter the desktop server address."
            serverUrl == "http://0.0.0.0:$DEFAULT_SYNC_PORT" -> "0.0.0.0 only works on the desktop host. Use the PC's LAN or Tailscale IP."
            serverUrl.toHttpUrlOrNull() == null -> "Enter a valid http:// address."
            else -> {
                val parsed = serverUrl.toHttpUrlOrNull()
                when {
                    parsed == null -> "Enter a valid server URL."
                    parsed.host == "localhost" || parsed.host == "127.0.0.1" -> "Use the desktop's LAN or Tailscale IP. localhost only points back to this phone."
                    parsed.scheme != "http" -> "Use http://. The desktop mobile server does not support HTTPS yet."
                    parsed.pathSegments != listOf("") -> "Only the host and port are allowed here. Remove any path after the address."
                    parsed.query != null || parsed.fragment != null -> "Remove query strings or fragments from the server URL."
                    else -> null
                }
            }
        }

        val tokenError = when {
            requireToken && token.isBlank() -> "Paste the sync token from the desktop app."
            token.isNotBlank() && token.length < 16 -> "That token is too short. Use the full token from the desktop app."
            token.isNotBlank() && !token.matches(Regex("[A-Za-z0-9\\-_]+")) -> "Tokens only contain letters, numbers, - and _."
            else -> null
        }

        val windowError = when {
            windowDays == null -> "Choose a sync window between 7 and 730 days."
            windowDays !in 7..730 -> "Sync window must stay between 7 and 730 days."
            else -> null
        }

        return SyncConfigValidationResult(
            normalizedServerUrl = serverUrl,
            normalizedToken = token,
            normalizedWindowDays = windowDays ?: 180,
            errors = SyncConfigFieldErrors(
                serverUrl = serverError,
                token = tokenError,
                windowDays = windowError,
            ),
        )
    }

    private fun normalizeServerUrl(input: String): String {
        val trimmed = input.trim()
        if (trimmed.isBlank()) return ""

        val withScheme = if ("://" in trimmed) trimmed else "http://$trimmed"
        val parsed = withScheme.toHttpUrlOrNull() ?: return withScheme
        val defaultPort = 80

        return parsed.newBuilder()
            .port(if (parsed.port == defaultPort) DEFAULT_SYNC_PORT else parsed.port)
            .encodedPath("/")
            .query(null)
            .fragment(null)
            .build()
            .toString()
            .removeSuffix("/")
    }

    private fun normalizeToken(input: String): String {
        return input
            .trim()
            .removePrefix("\"")
            .removeSuffix("\"")
            .removePrefix("'")
            .removeSuffix("'")
            .trim()
    }
}
