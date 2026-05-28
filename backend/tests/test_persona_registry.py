"""Persona registry tests."""

from persona_registry import persona_descriptions, persona_profile_text


def test_given_ad_publisher_id_when_profile_text_then_includes_role_and_description() -> None:
    # given, when
    actual = persona_profile_text("ad-publisher", "Ad Publisher")

    # then
    assert "Ad Publisher" in actual
    assert "ad publisher" in actual.casefold()
    descriptions = persona_descriptions()
    if descriptions.get("ad-publisher"):
        assert "programmatic" in actual.casefold()
