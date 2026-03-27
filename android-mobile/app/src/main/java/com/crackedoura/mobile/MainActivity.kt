package com.crackedoura.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.crackedoura.mobile.ui.MainViewModel
import com.crackedoura.mobile.ui.OuraMobileApp
import com.crackedoura.mobile.ui.theme.CrackedOuraMobileTheme

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels {
        MainViewModel.Factory((application as CrackedOuraMobileApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            val useDarkTheme = uiState.darkMode ?: isSystemInDarkTheme()
            CrackedOuraMobileTheme(darkTheme = useDarkTheme) {
                OuraMobileApp(viewModel = viewModel)
            }
        }
    }
}
