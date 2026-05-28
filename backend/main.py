import asyncio
import logging
import os
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_DIR.parent
# Repo-root `.env` (user convention) then `backend/.env` overrides.
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from claude_client import generate_response
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


class ChatRequest(BaseModel):
    message: str
    source: Literal["freeform", "dropdown"] = "freeform"


class TavilySource(BaseModel):
    title: str
    url: str
    content: str


class ChatResponse(BaseModel):
    response: str
    sources: list[TavilySource] = Field(default_factory=list)
    intent: None = None
    ad: None = None
    metrics: None = None


def _format_context(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "No web search results were returned for this query."
    return "\n\n".join(
        f"{s['title']} ({s['url']}): {s['content']}" for s in sources
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        sources = await asyncio.to_thread(tavily_search, req.message)
        context = _format_context(sources)
        response_text = await asyncio.to_thread(
            generate_response, req.message, context
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

    return ChatResponse(
        response=response_text,
        sources=[TavilySource(**s) for s in sources],
    )
