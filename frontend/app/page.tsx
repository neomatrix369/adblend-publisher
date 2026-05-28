"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio } from "lucide-react";

import ChatPanel, { type Message } from "@/components/ChatPanel";
import Dropdown from "@/components/Dropdown";
import ResizableSplitPane from "@/components/ResizableSplitPane";
import SidePanel from "@/components/SidePanel";
import {
  postChat,
  postDemoReset,
  postMetricsReset,
  type AdPayload,
  type AlignmentPayload,
  type DatasetEntry,
  type FocusPayload,
  type IntentPayload,
  type QueryCostPayload,
  type SessionMetrics,
  type TokenUsage,
  type TracePayload,
} from "@/lib/api";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DatasetEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [intent, setIntent] = useState<IntentPayload | null>(null);
  const [focus, setFocus] = useState<FocusPayload | null>(null);
  const [alignment, setAlignment] = useState<AlignmentPayload | null>(null);
  const [ad, setAd] = useState<AdPayload | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [costs, setCosts] = useState<QueryCostPayload | null>(null);
  const [trace, setTrace] = useState<TracePayload | null>(null);
  const [overmindConfigured, setOvermindConfigured] = useState(false);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [isResettingMetrics, setIsResettingMetrics] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(true);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (selectedEntry && value !== selectedEntry.user_input) {
        setDropdownValue("");
        setSelectedEntry(null);
      }
    },
    [selectedEntry],
  );

  const handleDropdownChange = useCallback((value: string) => {
    setDropdownValue(value);
  }, []);

  const handleSelectEntry = useCallback((entry: DatasetEntry | null) => {
    setSelectedEntry(entry);
    if (entry) {
      setInput(entry.user_input);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const fromDropdown =
      selectedEntry != null && text === selectedEntry.user_input;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postChat({
        message: text,
        source: fromDropdown ? "dropdown" : "freeform",
        ads_enabled: adsEnabled,
        ...(fromDropdown && selectedEntry
          ? {
              intent: {
                score: selectedEntry.intent.score,
                tier: selectedEntry.intent.tier,
                ad_eligible: selectedEntry.intent.ad_eligible,
                rationale: selectedEntry.intent.rationale ?? null,
              },
              focus: selectedEntry.focus,
              persona_id: selectedEntry.persona_id ?? null,
              persona_role: selectedEntry.persona_role ?? null,
            }
          : {}),
      });
      setIntent(data.intent);
      setFocus(data.focus);
      setAlignment(data.alignment);
      setAd(data.ad);
      setTokens(data.tokens);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
      setCosts(data.costs ?? null);
      if (data.trace) {
        setTrace(data.trace);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          sources: data.sources?.length ? data.sources : undefined,
          tokens: data.tokens ?? undefined,
          anthropicTokenCost: data.costs?.anthropic_tokens ?? undefined,
        },
      ]);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Could not reach the API (${detail}). Start the backend on port 8001, set keys in the repo-root .env, and restart npm run dev if you changed env.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedEntry, adsEnabled]);

  const handleResetDemo = useCallback(async () => {
    if (isResettingDemo) return;
    setIsResettingDemo(true);
    try {
      await postDemoReset();
    } catch {
      /* metrics reset is best-effort; UI state always clears */
    } finally {
      setMessages([]);
      setInput("");
      setDropdownValue("");
      setSelectedEntry(null);
      setIntent(null);
      setFocus(null);
      setAlignment(null);
      setAd(null);
      setTokens(null);
      setCosts(null);
      setTrace(null);
      setMetrics({
        total_queries: 0,
        ads_served: 0,
        no_fill: 0,
        blocked: 0,
        bids_attempted: 0,
        fill_rate: 0,
        query_ad_rate: 0,
        session_cogs_usd: 0,
        last_impression: null,
      });
      setIsResettingDemo(false);
    }
  }, [isResettingDemo]);

  const handleResetMetrics = useCallback(async () => {
    if (isResettingMetrics) return;
    setIsResettingMetrics(true);
    try {
      const cleared = await postMetricsReset();
      setMetrics(cleared);
    } catch {
      setMetrics({
        total_queries: 0,
        ads_served: 0,
        no_fill: 0,
        blocked: 0,
        bids_attempted: 0,
        fill_rate: 0,
        query_ad_rate: 0,
        session_cogs_usd: 0,
        last_impression: null,
      });
      setCosts(null);
    } finally {
      setIsResettingMetrics(false);
    }
  }, [isResettingMetrics]);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
    void fetch(`${base}/health`)
      .then((res) => res.json())
      .then((body: { overmind_configured?: boolean }) => {
        setApiReachable(true);
        setOvermindConfigured(Boolean(body.overmind_configured));
      })
      .catch(() => {
        setApiReachable(false);
        setOvermindConfigured(false);
      });
  }, []);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-panel-border bg-background-muted/60 backdrop-blur-md">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-[0_0_20px_rgb(249_115_22/0.35)]"
              aria-hidden
            >
              AB
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                <span className="text-accent">AdBlend</span>{" "}
                <span className="text-foreground-muted font-normal">
                  Publisher
                </span>
              </h1>
              <p className="hidden text-xs text-foreground-muted sm:block">
                Intent-gated ad demo · Cursor × Thrad
              </p>
            </div>
            <span
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:ml-0 ${
                apiReachable === null
                  ? "bg-background-elevated text-foreground-muted"
                  : apiReachable
                    ? "bg-success/15 text-success ring-1 ring-success/25"
                    : "bg-danger/15 text-red-300 ring-1 ring-danger/25"
              }`}
              title={
                apiReachable === null
                  ? "Checking API…"
                  : apiReachable
                    ? "Backend reachable"
                    : "Backend offline"
              }
            >
              <Radio
                className={`h-3 w-3 ${apiReachable === null ? "animate-pulse-subtle" : ""}`}
                aria-hidden
              />
              {apiReachable === null
                ? "API…"
                : apiReachable
                  ? "Live"
                  : "Offline"}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Dropdown
              value={dropdownValue}
              onChange={handleDropdownChange}
              onSelectEntry={handleSelectEntry}
            />
            <button
              type="button"
              onClick={() => void handleResetDemo()}
              disabled={isResettingDemo || isLoading}
              className="shrink-0 cursor-pointer rounded-md border border-panel-border px-3 py-2 text-xs font-medium text-foreground-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResettingDemo ? "Resetting…" : "Reset demo"}
            </button>
          </div>
        </div>
      </header>

      <ResizableSplitPane
        main={
          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={handleInputChange}
            onSend={() => void sendMessage()}
            isLoading={isLoading}
          />
        }
        side={
          <SidePanel
            intent={intent}
            focus={focus}
            alignment={alignment}
            ad={ad}
            tokens={tokens}
            metrics={metrics}
            costs={costs}
            trace={trace}
            overmindConfigured={overmindConfigured}
            isLoading={isLoading}
            adsEnabled={adsEnabled}
            onAdsEnabledChange={setAdsEnabled}
            onResetMetrics={() => void handleResetMetrics()}
            isResettingMetrics={isResettingMetrics}
          />
        }
      />
    </div>
  );
}
