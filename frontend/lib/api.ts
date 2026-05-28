export type ChatRequest = {
  message: string;
  source: "freeform" | "dropdown";
  intent?: IntentPayload;
  focus?: FocusPayload;
  ads_enabled?: boolean;
};

export type TavilySource = {
  title: string;
  url: string;
  content: string;
};

export type IntentPayload = {
  score: number;
  tier: string;
  ad_eligible: boolean;
  rationale?: string | null;
};

export type TokenUsage = {
  input: number;
  output: number;
};

export type FocusPayload = {
  category: string;
  sub_category: string;
};

export type AdPayload = {
  headline: string;
  body: string;
  cta_url: string;
  cta_label: string;
  advertiser?: string;
  mock?: boolean;
};

export type LastImpression = {
  state: "logged" | "no_fill" | "none";
  tier: string;
  score: number;
  bid_won: boolean;
};

export type SessionMetrics = {
  total_queries: number;
  ads_served: number;
  no_fill: number;
  blocked: number;
  fill_rate: number;
  last_impression: LastImpression | null;
};

export type TraceCall = {
  name: string;
  latency_ms: number;
};

export type TracePayload = {
  span_count: number;
  total_latency_ms: number;
  calls: TraceCall[];
};

export type ChatResponse = {
  response: string;
  sources: TavilySource[];
  intent: IntentPayload | null;
  ad: AdPayload | null;
  focus: FocusPayload | null;
  tokens: TokenUsage | null;
  metrics: SessionMetrics | null;
  trace: TracePayload | null;
};

export type DatasetEntry = {
  user_input: string;
  references: unknown[];
  synthesizer_name: string;
  focus: FocusPayload;
  intent: IntentPayload & { rationale?: string };
};

export type DatasetResponse = {
  entries: DatasetEntry[];
};

// Default `/api` uses Next.js rewrite → backend (no CORS). Override for direct calls.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export async function getDataset(): Promise<DatasetResponse> {
  const res = await fetch(`${API_BASE}/dataset`);
  if (!res.ok) {
    throw new Error(`Dataset request failed: ${res.status}`);
  }
  return res.json();
}

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

export async function postMetricsReset(): Promise<SessionMetrics> {
  const res = await fetch(`${API_BASE}/metrics/reset`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Metrics reset failed: ${res.status}`);
  }
  return res.json();
}

export async function postDemoReset(): Promise<SessionMetrics> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Demo reset failed: ${res.status}`);
  }
  return res.json();
}
