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
from demo_step_cache import clear_all as clear_demo_step_cache
from intent import INTENT_GATE_THRESHOLD, score_intent
from metrics import metrics as session_metrics
from overmind_setup import (
    capture_pipeline_error,
    init_overmind,
    is_overmind_configured,
    tag_if_active,
)
from service_pricing import build_query_costs
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
    session_cogs_usd: float = 0.0
    last_impression: LastImpressionPayload | None = None


class CostLinePayload(BaseModel):
    service: str
    step: str
    label: str
    amount_usd: float
    input_tokens: int | None = None
    output_tokens: int | None = None
    input_cost_usd: float | None = None
    output_cost_usd: float | None = None
    model: str | None = None
    from_cache: bool | None = None


class AnthropicTokenCostPayload(BaseModel):
    model: str
    input_tokens: int
    output_tokens: int
    input_cost_usd: float
    output_cost_usd: float
    total_cost_usd: float
    input_usd_per_mtok: float
    output_usd_per_mtok: float


class QueryCostPayload(BaseModel):
    lines: list[CostLinePayload] = Field(default_factory=list)
    total_usd: float = 0.0
    session_cumulative_usd: float = 0.0
    anthropic_tokens: AnthropicTokenCostPayload | None = None


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
    costs: QueryCostPayload | None = None
    trace: TracePayload | None = None


def _format_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No web search results were returned for this query."
    return "\n\n".join(
        f"{s['title']} ({s['url']}): {s['content']}" for s in sources
    )


def _resolve_intent(
    req: ChatRequest,
) -> tuple[IntentPayload, Focus, TokenUsage, bool]:
    if req.source == "dropdown" and req.intent is not None:
        intent = req.intent
        focus = req.focus or Focus()
        return intent, focus, TokenUsage(), False

    result = score_intent(req.message)
    intent = IntentPayload(
        score=float(result.scored["score"]),
        tier=str(result.scored["tier"]),
        ad_eligible=bool(result.scored["ad_eligible"]),
        rationale=str(result.scored.get("rationale") or "") or None,
    )
    focus = req.focus or Focus(
        category=str(result.scored.get("category") or ""),
        sub_category=str(result.scored.get("sub_category") or ""),
    )
    return intent, focus, TokenUsage(**result.tokens), result.from_cache


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
    """Clear session metrics and pipeline caches for a clean demo run."""
    session_metrics.reset()
    clear_tavily_cache()
    clear_demo_step_cache()
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
    tavily_from_cache = False
    intent_from_cache = False
    respond_from_cache = False
    align_from_cache = False
    use_live_intent = not (req.source == "dropdown" and req.intent is not None)
    with request_trace_root():
        tag_if_active("chat.source", req.source)
        tag_if_active("chat.ads_enabled", str(req.ads_enabled).lower())
        tag_if_active("intent.scored_live", str(use_live_intent).lower())
        try:
            tavily_attrs: dict[str, Any] = {}
            with trace.record("tavily.search", tavily_attrs):
                tavily_result = await asyncio.to_thread(tavily_search, req.message)
                sources = tavily_result.sources
                tavily_from_cache = tavily_result.from_cache
                tavily_attrs["tavily.from_cache"] = tavily_from_cache
                tavily_attrs["tavily.source_count"] = len(sources)
            context = _format_context(sources)
            if use_live_intent:
                intent_attrs: dict[str, Any] = {}
                with trace.record("claude.intent", intent_attrs):
                    intent, focus, intent_tokens, intent_from_cache = (
                        await asyncio.to_thread(_resolve_intent, req)
                    )
                    intent_attrs["claude.intent.from_cache"] = intent_from_cache
            else:
                intent, focus, intent_tokens, intent_from_cache = (
                    await asyncio.to_thread(_resolve_intent, req)
                )

            tag_if_active("intent.tier", intent.tier)

            respond_attrs: dict[str, Any] = {}
            with trace.record("claude.respond", respond_attrs):
                respond_result = await asyncio.to_thread(
                    generate_response, req.message, context
                )
                response_text = respond_result.text
                chat_tokens = respond_result.tokens
                respond_from_cache = respond_result.from_cache
                respond_attrs["claude.respond.from_cache"] = respond_from_cache

            align_attrs: dict[str, Any] = {}
            with trace.record("claude.answer_align", align_attrs):
                align_result = await asyncio.to_thread(
                    classify_answer, req.message, response_text
                )
                answer_data = align_result.data
                align_tokens = align_result.tokens
                align_from_cache = align_result.from_cache
                align_attrs["claude.answer_align.from_cache"] = align_from_cache

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
            capture_pipeline_error(exc)
            raise HTTPException(
                status_code=503,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            capture_pipeline_error(exc)
            logger.exception("Chat pipeline failed")
            raise HTTPException(
                status_code=502,
                detail="Failed to generate a response. Check server logs.",
            ) from exc

        ad_data: dict[str, Any] | None = None
        if req.ads_enabled and intent.score >= INTENT_GATE_THRESHOLD:
            thrad_attrs: dict[str, Any] = {"intent.score": intent.score}
            with trace.record("thrad.bid", thrad_attrs):
                ad_data = await asyncio.to_thread(
                    request_ad,
                    req.message,
                    focus.model_dump(),
                    intent.score,
                )
                thrad_attrs["thrad.ad_served"] = ad_data is not None

    ad = AdPayload(**ad_data) if ad_data else None

    thrad_called = req.ads_enabled and intent.score >= INTENT_GATE_THRESHOLD
    ad_served = ad is not None

    cost_lines, query_total_usd, anthropic_summary = build_query_costs(
        tavily_from_cache=tavily_from_cache,
        intent_tokens=intent_tokens.model_dump(),
        respond_tokens=chat_tokens,
        align_tokens=align_tokens,
        thrad_bid_attempted=thrad_called,
        intent_scored_live=use_live_intent,
        intent_from_cache=intent_from_cache,
        respond_from_cache=respond_from_cache,
        align_from_cache=align_from_cache,
    )

    session_metrics.record(
        intent_tier=intent.tier,
        intent_score=intent.score,
        ad_served=ad_served,
        thrad_called=thrad_called,
        query_cogs_usd=query_total_usd,
    )
    metrics_payload = SessionMetricsPayload(**session_metrics.to_dict())

    trace_payload = TracePayload(**trace.to_dict())
    costs_payload = QueryCostPayload(
        lines=[CostLinePayload(**line.to_dict()) for line in cost_lines],
        total_usd=query_total_usd,
        session_cumulative_usd=metrics_payload.session_cogs_usd,
        anthropic_tokens=AnthropicTokenCostPayload(**anthropic_summary.to_dict()),
    )

    return ChatResponse(
        response=response_text,
        sources=[TavilySource(**s) for s in sources],
        intent=intent,
        ad=ad,
        focus=focus,
        alignment=alignment,
        tokens=tokens,
        metrics=metrics_payload,
        costs=costs_payload,
        trace=trace_payload,
    )
