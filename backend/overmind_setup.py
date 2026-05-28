"""Initialize Overmind tracing when an API key is configured."""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

_initialized = False
_tracing_active = False


def init_overmind() -> bool:
    """Call once at startup. Returns True when Overmind tracing is active."""
    global _initialized, _tracing_active
    if _initialized:
        return _tracing_active

    api_key = os.getenv("OVERMIND_API_KEY")
    if not api_key:
        logger.info("OVERMIND_API_KEY not set — tracing disabled")
        _initialized = True
        return False

    try:
        from overmind import init

        init(
            overmind_api_key=api_key,
            service_name=os.getenv("OVERMIND_SERVICE_NAME", "adblend-publisher"),
            environment=os.getenv("OVERMIND_ENVIRONMENT", "development"),
            providers=["anthropic"],
        )
        _tracing_active = True
        logger.info("Overmind tracing initialized for adblend-publisher")
    except Exception:
        logger.exception("Failed to initialize Overmind")
    finally:
        _initialized = True

    return _tracing_active


def is_overmind_configured() -> bool:
    return _tracing_active
