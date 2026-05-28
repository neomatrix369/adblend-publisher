export type ChatRequest = {
  message: string;
  source: "freeform" | "dropdown";
};

export type TavilySource = {
  title: string;
  url: string;
  content: string;
};

export type ChatResponse = {
  response: string;
  sources: TavilySource[];
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
    let detail = `Chat request failed: ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  return res.json();
}
