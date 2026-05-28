export type ChatRequest = {
  message: string;
  source: "freeform" | "dropdown";
  intent?: IntentPayload;
  focus?: FocusPayload;
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

export type ChatResponse = {
  response: string;
  sources: TavilySource[];
  intent: IntentPayload | null;
  ad: AdPayload | null;
  focus: FocusPayload | null;
  tokens: TokenUsage | null;
  metrics: null;
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
