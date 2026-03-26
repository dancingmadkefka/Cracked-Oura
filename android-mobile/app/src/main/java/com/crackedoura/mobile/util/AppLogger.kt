package com.crackedoura.mobile.util

import android.util.Log

object AppLogger {
    private const val APP_TAG = "CrackedOuraMobile"

    fun d(tag: String, message: String) {
        Log.d("$APP_TAG/$tag", message)
    }

    fun i(tag: String, message: String) {
        Log.i("$APP_TAG/$tag", message)
    }

    fun w(tag: String, message: String, throwable: Throwable? = null) {
        Log.w("$APP_TAG/$tag", message, throwable)
    }

    fun e(tag: String, message: String, throwable: Throwable? = null) {
        Log.e("$APP_TAG/$tag", message, throwable)
    }

    fun redactToken(token: String): String {
        val trimmed = token.trim()
        if (trimmed.length <= 8) return "********"
        return "${trimmed.take(4)}...${trimmed.takeLast(4)}"
    }
}
