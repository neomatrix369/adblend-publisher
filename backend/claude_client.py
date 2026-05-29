import os
from dataclasses import dataclass
from typing import TypedDict

import anthropic

import demo_step_cache

SYSTEM_PROMPT = (
    "You are a helpful AI assistant for publishers evaluating AI tooling. "
    "Use the provided web search context when available. "
    "If context is missing or thin, answer from general knowledge and say when "
    "you could not verify with fresh sources."
)

DEFAULT_MODEL = "claude-sonnet-4-20250514"


class TokenUsage(TypedDict):
    input: int
    output: int


@dataclass(frozen=True)
class GenerateResponseResult:
    text: str
    tokens: TokenUsage
    from_cache: bool


def generate_response(user_message: str, context: str) -> GenerateResponseResult:
    cache_key = demo_step_cache.respond_key(user_message, context)
    cached = demo_step_cache.get("respond", cache_key)
    if cached is not None:
        text, _stored_tokens = cached
        return GenerateResponseResult(
            text=text,
            tokens={"input": 0, "output": 0},
            from_cache=True,
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set")

    client = anthropic.Anthropic(api_key=api_key)
    user_content = f"Context:\n{context}\n\nQuestion: {user_message}"

    message = client.messages.create(
        model=os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL),
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    tokens: TokenUsage = {
        "input": message.usage.input_tokens,
        "output": message.usage.output_tokens,
    }

    for block in message.content:
        if block.type == "text":
            demo_step_cache.set("respond", cache_key, (block.text, tokens))
            return GenerateResponseResult(
                text=block.text,
                tokens=tokens,
                from_cache=False,
            )
    demo_step_cache.set("respond", cache_key, ("", tokens))
    return GenerateResponseResult(text="", tokens=tokens, from_cache=False)
