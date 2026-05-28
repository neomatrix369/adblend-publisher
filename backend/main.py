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

from claude_client import generate_response
from intent import INTENT_GATE_THRESHOLD, score_intent
from thrad_client import request_ad
from tavily_client import search as tavily_search

logger = logging.getLogger(__name__)

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


class ChatRequest(BaseModel):
    message: str
    source: Literal["freeform", "dropdown"] = "freeform"
    intent: IntentPayload | None = None
    focus: Focus | None = None


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


class ChatResponse(BaseModel):
    response: str
    sources: list[TavilySource] = Field(default_factory=list)
    intent: IntentPayload | None = None
    ad: AdPayload | None = None
    focus: Focus | None = None
    metrics: None = None


def _format_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No web search results were returned for this query."
    return "\n\n".join(
        f"{s['title']} ({s['url']}): {s['content']}" for s in sources
    )


def _resolve_intent(req: ChatRequest) -> tuple[IntentPayload, Focus]:
    if req.source == "dropdown" and req.intent is not None:
        intent = req.intent
        focus = req.focus or Focus()
        return intent, focus

    scored = score_intent(req.message)
    intent = IntentPayload(
        score=float(scored["score"]),
        tier=str(scored["tier"]),
        ad_eligible=bool(scored["ad_eligible"]),
    )
    focus = req.focus or Focus(
        category=str(scored.get("category") or ""),
        sub_category=str(scored.get("sub_category") or ""),
    )
    return intent, focus


@app.get("/dataset")
async def get_dataset():
    if not _GOLDEN_DATASET_PATH.is_file():
        raise HTTPException(status_code=404, detail="Golden dataset not found")
    with _GOLDEN_DATASET_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "thrad_mode": "mock",
        "intent_gate_threshold": INTENT_GATE_THRESHOLD,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        sources = await asyncio.to_thread(tavily_search, req.message)
        context = _format_context(sources)
        response_text = await asyncio.to_thread(
            generate_response, req.message, context
        )
        intent, focus = await asyncio.to_thread(_resolve_intent, req)
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
    if intent.score >= INTENT_GATE_THRESHOLD:
        ad_data = await asyncio.to_thread(
            request_ad,
            req.message,
            focus.model_dump(),
            intent.score,
        )

    ad = AdPayload(**ad_data) if ad_data else None

    return ChatResponse(
        response=response_text,
        sources=[TavilySource(**s) for s in sources],
        intent=intent,
        ad=ad,
        focus=focus,
    )
