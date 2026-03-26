import atexit
import logging
import os
import subprocess
import sys
import threading
from dataclasses import dataclass
from typing import List, Optional

from .config import config_manager

logger = logging.getLogger("MobileServerManager")


@dataclass
class MobileServerState:
    running: bool
    status: str
    pid: Optional[int] = None


class MobileServerManager:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._process: Optional[subprocess.Popen] = None
        self._host: Optional[str] = None
        self._port: Optional[int] = None
        self._last_status = "Stopped"
        atexit.register(self.stop)

    def state(self) -> MobileServerState:
        with self._lock:
            if self._process and self._process.poll() is None:
                return MobileServerState(
                    running=True,
                    status=f"Running on {self._host}:{self._port}",
                    pid=self._process.pid,
                )

            if self._process and self._process.poll() is not None:
                exit_code = self._process.returncode
                self._process = None
                self._last_status = f"Stopped unexpectedly with exit code {exit_code}"
                return MobileServerState(
                    running=False,
                    status=self._last_status,
                )

            return MobileServerState(running=False, status=self._last_status)

    def reconcile(self) -> MobileServerState:
        settings = config_manager.get_config()
        enabled = bool(settings.get("mobile_sync_enabled", False))
        token = (settings.get("mobile_sync_token", "") or "").strip()
        host = (settings.get("mobile_sync_bind_host", "0.0.0.0") or "0.0.0.0").strip()
        port = int(settings.get("mobile_sync_port", 8037))

        with self._lock:
            self._clear_exited_process()

            if not enabled:
                self._stop_locked()
                self._last_status = "Disabled in settings"
                return MobileServerState(False, self._last_status)

            if not token:
                self._stop_locked()
                self._last_status = "Waiting for a sync token"
                return MobileServerState(False, self._last_status)

            if self._process and self._process.poll() is None:
                if self._host == host and self._port == port:
                    return MobileServerState(
                        running=True,
                        status=f"Running on {host}:{port}",
                        pid=self._process.pid,
                    )
                self._stop_locked()

            self._start_locked(host, port)
            if self._process and self._process.poll() is None:
                self._last_status = f"Running on {host}:{port}"
                return MobileServerState(
                    running=True,
                    status=self._last_status,
                    pid=self._process.pid,
                )

            return MobileServerState(False, self._last_status)

    def stop(self) -> None:
        with self._lock:
            self._stop_locked()

    def _clear_exited_process(self) -> None:
        if self._process and self._process.poll() is not None:
            logger.warning(
                "Mobile sync server exited pid=%s code=%s",
                self._process.pid,
                self._process.returncode,
            )
            self._last_status = (
                f"Stopped unexpectedly with exit code {self._process.returncode}"
            )
            self._process = None

    def _start_locked(self, host: str, port: int) -> None:
        command = self._build_command(host, port)
        env = os.environ.copy()
        env["CRACKED_OURA_DISABLE_MOBILE_AUTOSTART"] = "1"

        if getattr(sys, "frozen", False):
            env["CRACKED_OURA_RUN_MODE"] = "mobile_server"

        creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0
        cwd = self._working_directory()

        logger.info("Starting mobile sync server host=%s port=%s command=%s", host, port, command)
        try:
            self._process = subprocess.Popen(
                command,
                cwd=cwd,
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creationflags,
            )
            self._host = host
            self._port = port
            self._last_status = f"Running on {host}:{port}"
        except OSError as exc:
            self._process = None
            self._host = None
            self._port = None
            self._last_status = f"Failed to start mobile sync server: {exc.strerror or str(exc)}"
            logger.exception("Could not start mobile sync server")

    def _stop_locked(self) -> None:
        process = self._process
        self._process = None
        self._host = None
        self._port = None
        self._last_status = "Stopped"

        if not process:
            return

        if process.poll() is None:
            logger.info("Stopping mobile sync server pid=%s", process.pid)
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                logger.warning("Mobile sync server did not stop cleanly; killing pid=%s", process.pid)
                process.kill()
                process.wait(timeout=5)

    def _build_command(self, host: str, port: int) -> List[str]:
        if getattr(sys, "frozen", False):
            return [sys.executable]
        return [
            sys.executable,
            "-m",
            "backend.src.mobile_server",
            "--host",
            host,
            "--port",
            str(port),
        ]

    def _working_directory(self) -> str:
        if getattr(sys, "frozen", False):
            return os.path.dirname(sys.executable)
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


mobile_server_manager = MobileServerManager()
