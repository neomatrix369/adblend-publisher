export type ChatRequest = {
  message: string;
  source: "freeform" | "dropdown";
};

export type ChatResponse = {
  response: string;
  intent: null;
  ad: null;
  metrics: null;
};

// Default `/api` uses Next.js rewrite → backend (no CORS). Override for direct calls.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status}`);
  }

  return res.json();
}
