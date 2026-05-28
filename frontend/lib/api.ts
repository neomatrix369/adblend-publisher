export type ChatRequest = {
  message: string;
  source: "freeform" | "dropdown";
  intent?: IntentPayload;
  focus?: FocusPayload;
  persona_id?: string | null;
  persona_role?: string | null;
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
  bids_attempted?: number;
  fill_rate: number;
  query_ad_rate?: number;
  session_cogs_usd?: number;
  last_impression: LastImpression | null;
};

export type CostLine = {
  service: string;
  step: string;
  label: string;
  amount_usd: number;
  input_tokens?: number | null;
  output_tokens?: number | null;
  input_cost_usd?: number | null;
  output_cost_usd?: number | null;
  model?: string | null;
  from_cache?: boolean | null;
};

export type AnthropicTokenCost = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
  input_usd_per_mtok: number;
  output_usd_per_mtok: number;
};

export type QueryCostPayload = {
  lines: CostLine[];
  total_usd: number;
  session_cumulative_usd: number;
  anthropic_tokens?: AnthropicTokenCost | null;
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

export type AlignmentPayload = {
  question: {
    persona_id: string | null;
    persona_role: string | null;
    focus: FocusPayload;
  };
  answer: {
    focus: FocusPayload;
    persona_id: string | null;
    rationale: string;
  };
  scores: {
    focus_match: number;
    persona_match: number | null;
    overall: number;
  };
  labels: {
    focus: string;
    persona: string;
  };
};

export type ChatResponse = {
  response: string;
  sources: TavilySource[];
  intent: IntentPayload | null;
  ad: AdPayload | null;
  focus: FocusPayload | null;
  alignment: AlignmentPayload | null;
  tokens: TokenUsage | null;
  metrics: SessionMetrics | null;
  costs: QueryCostPayload | null;
  trace: TracePayload | null;
};

export type DatasetEntry = {
  user_input: string;
  persona_id?: string;
  persona_role?: string;
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
