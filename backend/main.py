import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_DIR.parent
_GOLDEN_DATASET_PATH = _REPO_ROOT / "data" / "golden_dataset.json"
# Repo-root `.env` (user convention) then `backend/.env` overrides.
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from alignment import compute_alignment
from answer_focus import classify_answer
from claude_client import generate_response
from intent import INTENT_GATE_THRESHOLD, score_intent
from metrics import metrics as session_metrics
from overmind_setup import init_overmind, is_overmind_configured
from thrad_client import request_ad
from tavily_client import clear_cache as clear_tavily_cache
from tavily_client import search as tavily_search
from trace_collector import TraceCollector, request_trace_root

logger = logging.getLogger(__name__)

init_overmind()

app = FastAPI(title="AdBlend Publisher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Focus(BaseModel):
    category: str = ""
    sub_category: str = ""


class IntentPayload(BaseModel):
    score: float
    tier: str
    ad_eligible: bool = False
    rationale: str | None = None


class TokenUsage(BaseModel):
    input: int = 0
    output: int = 0


class ChatRequest(BaseModel):
    message: str
    source: Literal["freeform", "dropdown"] = "freeform"
    intent: IntentPayload | None = None
    focus: Focus | None = None
    persona_id: str | None = None
    persona_role: str | None = None
    ads_enabled: bool = True


class TavilySource(BaseModel):
    title: str
    url: str
    content: str


class AdPayload(BaseModel):
    headline: str
    body: str
    cta_url: str
    cta_label: str
    advertiser: str | None = None
    mock: bool = True


class LastImpressionPayload(BaseModel):
    state: Literal["logged", "no_fill", "none"]
    tier: str
    score: float
    bid_won: bool


class SessionMetricsPayload(BaseModel):
    total_queries: int
    ads_served: int
    no_fill: int
    blocked: int
    bids_attempted: int = 0
    fill_rate: float
    query_ad_rate: float = 0.0
    last_impression: LastImpressionPayload | None = None


class TraceCallPayload(BaseModel):
    name: str
    latency_ms: float


class TracePayload(BaseModel):
    span_count: int
    total_latency_ms: float
    calls: list[TraceCallPayload] = Field(default_factory=list)


class AlignmentSidePayload(BaseModel):
    persona_id: str | None = None
    persona_role: str | None = None
    focus: Focus = Field(default_factory=Focus)


class AlignmentAnswerPayload(BaseModel):
    focus: Focus = Field(default_factory=Focus)
    persona_id: str | None = None
    rationale: str = ""


class AlignmentScoresPayload(BaseModel):
    focus_match: float
    persona_match: float | None = None
    overall: float


class AlignmentLabelsPayload(BaseModel):
    focus: str
    persona: str


class AlignmentPayload(BaseModel):
    question: AlignmentSidePayload
    answer: AlignmentAnswerPayload
    scores: AlignmentScoresPayload
    labels: AlignmentLabelsPayload


class ChatResponse(BaseModel):
    response: str
    sources: list[TavilySource] = Field(default_factory=list)
    intent: IntentPayload | None = None
    ad: AdPayload | None = None
    focus: Focus | None = None
    alignment: AlignmentPayload | None = None
    tokens: TokenUsage | None = None
    metrics: SessionMetricsPayload | None = None
    trace: TracePayload | None = None


def _format_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No web search results were returned for this query."
    return "\n\n".join(
        f"{s['title']} ({s['url']}): {s['content']}" for s in sources
    )


def _resolve_intent(
    req: ChatRequest,
) -> tuple[IntentPayload, Focus, TokenUsage]:
    if req.source == "dropdown" and req.intent is not None:
        intent = req.intent
        focus = req.focus or Focus()
        return intent, focus, TokenUsage()

    scored, intent_tokens = score_intent(req.message)
    intent = IntentPayload(
        score=float(scored["score"]),
        tier=str(scored["tier"]),
        ad_eligible=bool(scored["ad_eligible"]),
        rationale=str(scored.get("rationale") or "") or None,
    )
    focus = req.focus or Focus(
        category=str(scored.get("category") or ""),
        sub_category=str(scored.get("sub_category") or ""),
    )
    return intent, focus, TokenUsage(**intent_tokens)


def _merge_tokens(*parts: TokenUsage) -> TokenUsage:
    return TokenUsage(
        input=sum(p.input for p in parts),
        output=sum(p.output for p in parts),
    )


@app.get("/dataset")
async def get_dataset():
    if not _GOLDEN_DATASET_PATH.is_file():
        raise HTTPException(status_code=404, detail="Golden dataset not found")
    with _GOLDEN_DATASET_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@app.post("/metrics/reset")
async def reset_metrics():
    session_metrics.reset()
    return session_metrics.to_dict()


@app.post("/demo/reset")
async def reset_demo():
    """Clear session metrics and Tavily cache for a clean demo run."""
    session_metrics.reset()
    clear_tavily_cache()
    return session_metrics.to_dict()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "thrad_mode": "mock",
        "intent_gate_threshold": INTENT_GATE_THRESHOLD,
        "overmind_configured": is_overmind_configured(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    trace = TraceCollector()
    try:
        with request_trace_root():
            with trace.record("tavily.search"):
                sources = await asyncio.to_thread(tavily_search, req.message)
            context = _format_context(sources)

            use_live_intent = not (
                req.source == "dropdown" and req.intent is not None
            )
            if use_live_intent:
                with trace.record("claude.intent"):
                    intent, focus, intent_tokens = await asyncio.to_thread(
                        _resolve_intent, req
                    )
            else:
                intent, focus, intent_tokens = await asyncio.to_thread(
                    _resolve_intent, req
                )

            with trace.record("claude.respond"):
                response_text, chat_tokens = await asyncio.to_thread(
                    generate_response, req.message, context
                )

            with trace.record("claude.answer_align"):
                answer_data, align_tokens = await asyncio.to_thread(
                    classify_answer, req.message, response_text
                )

            alignment_raw = compute_alignment(
                question_persona_id=req.persona_id,
                question_persona_role=req.persona_role,
                question_focus=focus.model_dump(),
                answer_persona_id=answer_data.get("persona_id"),
                answer_focus=answer_data.get("focus"),
                answer_rationale=answer_data.get("rationale"),
            )
            alignment = AlignmentPayload(**alignment_raw)

            tokens = _merge_tokens(
                TokenUsage(**chat_tokens),
                intent_tokens,
                TokenUsage(**align_tokens),
            )
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Chat pipeline failed")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate a response. Check server logs.",
        ) from exc

    ad_data: dict[str, Any] | None = None
    if req.ads_enabled and intent.score >= INTENT_GATE_THRESHOLD:
        with trace.record("thrad.bid"):
            ad_data = await asyncio.to_thread(
                request_ad,
                req.message,
                focus.model_dump(),
                intent.score,
            )

    ad = AdPayload(**ad_data) if ad_data else None

    thrad_called = req.ads_enabled and intent.score >= INTENT_GATE_THRESHOLD
    ad_served = ad is not None
    session_metrics.record(
        intent_tier=intent.tier,
        intent_score=intent.score,
        ad_served=ad_served,
        thrad_called=thrad_called,
    )
    metrics_payload = SessionMetricsPayload(**session_metrics.to_dict())

    trace_payload = TracePayload(**trace.to_dict())

    return ChatResponse(
        response=response_text,
        sources=[TavilySource(**s) for s in sources],
        intent=intent,
        ad=ad,
        focus=focus,
        alignment=alignment,
        tokens=tokens,
        metrics=metrics_payload,
        trace=trace_payload,
    )
