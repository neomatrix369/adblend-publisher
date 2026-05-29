"""Overmind helper tests — no live API key required."""

from unittest.mock import patch

import overmind_setup


def test_given_tracing_off_when_tag_if_active_then_does_not_call_set_tag() -> None:
    # given, when
    with patch.object(overmind_setup, "_tracing_active", False):
        with patch("overmind.set_tag") as mock_set_tag:
            overmind_setup.tag_if_active("chat.source", "freeform")

    # then
    mock_set_tag.assert_not_called()


def test_given_tracing_on_when_tag_if_active_then_calls_set_tag() -> None:
    # given, when
    with patch.object(overmind_setup, "_tracing_active", True):
        with patch("overmind.set_tag") as mock_set_tag:
            overmind_setup.tag_if_active("chat.source", "dropdown")

    # then
    mock_set_tag.assert_called_once_with("chat.source", "dropdown")


def test_given_tracing_off_when_capture_pipeline_error_then_no_capture() -> None:
    # given
    exc = ValueError("missing key")

    # when
    with patch.object(overmind_setup, "_tracing_active", False):
        with patch("overmind.capture_exception") as mock_capture:
            overmind_setup.capture_pipeline_error(exc)

    # then
    mock_capture.assert_not_called()


def test_given_tracing_on_when_capture_pipeline_error_then_calls_capture() -> None:
    # given
    exc = RuntimeError("pipeline failed")

    # when
    with patch.object(overmind_setup, "_tracing_active", True):
        with patch("overmind.capture_exception") as mock_capture:
            overmind_setup.capture_pipeline_error(exc)

    # then
    mock_capture.assert_called_once_with(exc)
