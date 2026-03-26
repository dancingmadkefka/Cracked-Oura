package com.crackedoura.mobile.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Ocean,
    secondary = Emerald,
    tertiary = Coral,
    background = Sand,
    surface = CardLight,
    surfaceVariant = Mist,
    primaryContainer = Color(0xFFD7E8FF),
    secondaryContainer = Color(0xFFD4F7EE),
    tertiaryContainer = Color(0xFFFFE2D5),
    onPrimary = Color.White,
    onBackground = Ink,
    onSurface = Ink,
    onSurfaceVariant = Cloud,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF7CB3FF),
    secondary = Color(0xFF59D4C2),
    tertiary = Color(0xFFFFA77A),
    background = Night,
    surface = CardDark,
    surfaceVariant = Slate,
    primaryContainer = Color(0xFF103A6D),
    secondaryContainer = Color(0xFF0E5148),
    tertiaryContainer = Color(0xFF5D2A10),
    onPrimary = Ink,
    onBackground = Color(0xFFF5F8FC),
    onSurface = Color(0xFFF5F8FC),
    onSurfaceVariant = Color(0xFF9CB1C8),
)

@Composable
fun CrackedOuraMobileTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = Typography,
        content = content,
    )
}
