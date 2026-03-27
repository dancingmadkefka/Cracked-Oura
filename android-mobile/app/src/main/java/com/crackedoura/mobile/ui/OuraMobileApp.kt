package com.crackedoura.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ShowChart
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.surfaceColorAtElevation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.crackedoura.mobile.ui.screens.DayDetailScreen
import com.crackedoura.mobile.ui.screens.OverviewScreen
import com.crackedoura.mobile.ui.screens.SettingsScreen
import com.crackedoura.mobile.ui.screens.TrendsScreen
import com.crackedoura.mobile.ui.theme.Coral
import com.crackedoura.mobile.ui.theme.Ocean
import com.crackedoura.mobile.ui.theme.Sun

private sealed class AppDestination(
    val route: String,
    val label: String,
    val title: String,
    val icon: @Composable () -> Unit,
) {
    data object Overview : AppDestination(
        route = "overview",
        label = "Overview",
        title = "Overview",
        icon = { Icon(Icons.Outlined.Home, contentDescription = "Overview") },
    )

    data object Trends : AppDestination(
        route = "trends",
        label = "Trends",
        title = "Trends",
        icon = { Icon(Icons.AutoMirrored.Outlined.ShowChart, contentDescription = "Trends") },
    )

    data object Settings : AppDestination(
        route = "settings",
        label = "Settings",
        title = "Settings",
        icon = { Icon(Icons.Outlined.Settings, contentDescription = "Settings") },
    )

    data object DayDetail : AppDestination(
        route = "day/{day}",
        label = "Day",
        title = "Day detail",
        icon = {},
    ) {
        fun createRoute(day: String): String = "day/$day"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OuraMobileApp(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val insights = remember(uiState.recentSummaries, uiState.recentWorkouts) {
        buildDailyInsights(uiState.recentSummaries, uiState.recentWorkouts)
    }
    val snackbarHostState = remember { SnackbarHostState() }
    val navController = rememberNavController()
    val primaryDestinations = listOf(
        AppDestination.Overview,
        AppDestination.Trends,
        AppDestination.Settings,
    )
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val detailDay = backStackEntry?.arguments?.getString("day")
    val currentPrimary = primaryDestinations.firstOrNull { it.route == currentRoute }
    val showBottomBar = currentPrimary != null

    LaunchedEffect(uiState.syncMessage) {
        val message = uiState.syncMessage ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Ocean.copy(alpha = 0.08f),
                        Sun.copy(alpha = 0.05f),
                        Coral.copy(alpha = 0.08f),
                    ),
                ),
            ),
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = when (currentRoute) {
                                AppDestination.DayDetail.route -> formatDayLabel(detailDay)
                                else -> currentPrimary?.title ?: "Cracked Oura"
                            },
                        )
                    },
                    navigationIcon = {
                        if (!showBottomBar) {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                                    contentDescription = "Back",
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(2.dp).copy(alpha = 0.76f),
                    ),
                )
            },
            bottomBar = {
                if (showBottomBar) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(3.dp).copy(alpha = 0.95f),
                    ) {
                        primaryDestinations.forEach { item ->
                            NavigationBarItem(
                                selected = currentPrimary?.route == item.route,
                                onClick = {
                                    navController.navigate(item.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                },
                                icon = item.icon,
                                label = { Text(item.label) },
                            )
                        }
                    }
                }
            },
            snackbarHost = {
                SnackbarHost(
                    hostState = snackbarHostState,
                    modifier = Modifier.padding(horizontal = 12.dp),
                )
            },
        ) { padding ->
            NavHost(
                navController = navController,
                startDestination = AppDestination.Overview.route,
            ) {
                composable(AppDestination.Overview.route) {
                    OverviewScreen(
                        padding = padding,
                        uiState = uiState,
                        insights = insights,
                        isRefreshing = uiState.isSyncing,
                        onRefresh = viewModel::syncNow,
                        onSync = viewModel::syncNow,
                        onOpenDayDetail = { day ->
                            navController.navigate(AppDestination.DayDetail.createRoute(day))
                        },
                        onNavigateToSettings = {
                            navController.navigate(AppDestination.Settings.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                    )
                }

                composable(AppDestination.Trends.route) {
                    TrendsScreen(
                        padding = padding,
                        insights = insights,
                        isRefreshing = uiState.isSyncing,
                        onRefresh = viewModel::syncNow,
                        onOpenDayDetail = { day ->
                            navController.navigate(AppDestination.DayDetail.createRoute(day))
                        },
                        onNavigateToSettings = {
                            navController.navigate(AppDestination.Settings.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                    )
                }

                composable(AppDestination.Settings.route) {
                    SettingsScreen(
                        padding = padding,
                        uiState = uiState,
                        onSaveSettings = viewModel::saveSettings,
                        onSaveAndSync = viewModel::saveSettingsAndSync,
                        onDarkModeToggle = viewModel::setDarkMode,
                    )
                }

                composable(
                    route = AppDestination.DayDetail.route,
                    arguments = listOf(navArgument("day") { type = NavType.StringType }),
                ) { entry ->
                    val day = entry.arguments?.getString("day")
                    DayDetailScreen(
                        padding = padding,
                        insight = insights.firstOrNull { it.day == day },
                        isSyncing = uiState.isSyncing,
                        onSync = viewModel::syncNow,
                    )
                }
            }
        }
    }
}
