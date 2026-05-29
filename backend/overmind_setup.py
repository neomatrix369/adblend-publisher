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


def tag_if_active(key: str, value: str) -> None:
    """Attach metadata to the current trace; no-op when Overmind is off."""
    if not _tracing_active:
        return
    try:
        from overmind import set_tag

        set_tag(key, value)
    except Exception:
        logger.debug("Overmind set_tag failed for %s", key, exc_info=True)


def capture_pipeline_error(exc: BaseException) -> None:
    """Record pipeline failures on the active span; no-op when Overmind is off."""
    if not _tracing_active:
        return
    try:
        from overmind import capture_exception

        capture_exception(exc)
    except Exception:
        logger.debug("Overmind capture_exception failed", exc_info=True)
