"""Demo step cache primitive tests."""

import demo_step_cache


def test_given_same_namespace_when_clear_all_then_only_that_store_empties() -> None:
    # given
    demo_step_cache.clear_all()
    demo_step_cache.set("intent", "a", {"score": 0.9})
    demo_step_cache.set("respond", "b", ("text", {}))

    # when
    demo_step_cache.clear_all()

    # then
    assert demo_step_cache.get("intent", "a") is None
    assert demo_step_cache.get("respond", "b") is None


def test_given_different_namespaces_when_set_then_isolated() -> None:
    # given
    demo_step_cache.clear_all()

    # when
    demo_step_cache.set("intent", "key", "intent-value")
    demo_step_cache.set("respond", "key", "respond-value")

    # then
    assert demo_step_cache.get("intent", "key") == "intent-value"
    assert demo_step_cache.get("respond", "key") == "respond-value"


def test_given_message_when_intent_key_then_normalized() -> None:
    # given, when
    actual = demo_step_cache.intent_key("  Vector DB  ")

    # then
    assert actual == "vector db"


def test_given_inputs_when_respond_and_align_keys_then_stable_hashes() -> None:
    # given, when
    respond_a = demo_step_cache.respond_key("q", "ctx")
    respond_b = demo_step_cache.respond_key("q", "ctx")
    align_a = demo_step_cache.align_key("q", "answer")
    align_b = demo_step_cache.align_key("q", "different")

    # then
    assert respond_a == respond_b
    assert align_a != align_b
