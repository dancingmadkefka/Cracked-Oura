import argparse

import uvicorn

from backend.src.api.main import app
from backend.src.config import config_manager


def main():
    config = config_manager.get_config()

    parser = argparse.ArgumentParser(
        description="Run the Cracked Oura mobile sync server."
    )
    parser.add_argument(
        "--host",
        default=config.get("mobile_sync_bind_host", "0.0.0.0"),
        help="Interface to bind to. Use 0.0.0.0 for LAN/Tailscale access.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(config.get("mobile_sync_port", 8037)),
        help="Port for the sync server.",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development use.",
    )

    if args := parser.parse_args():
        if args.reload:
            uvicorn.run(
                "backend.src.api.main:app",
                host=args.host,
                port=args.port,
                reload=True,
                reload_dirs=["backend"],
            )
            return

        uvicorn.run(app, host=args.host, port=args.port, reload=False)


if __name__ == "__main__":
    main()
