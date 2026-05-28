"use client";

import { FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";

import TokenCostDetail from "@/components/TokenCostDetail";
import Spinner from "@/components/ui/Spinner";
import type { AnthropicTokenCost, TavilySource, TokenUsage } from "@/lib/api";

const COLLAPSE_CHAR_THRESHOLD = 320;
const COLLAPSE_LINE_THRESHOLD = 6;

function isLongAnswer(content: string): boolean {
  if (content.length > COLLAPSE_CHAR_THRESHOLD) return true;
  return content.split("\n").length > COLLAPSE_LINE_THRESHOLD;
}

type CollapsibleAnswerProps = {
  content: string;
  expanded: boolean;
  onToggle: () => void;
};

function CollapsibleAnswer({
  content,
  expanded,
  onToggle,
}: CollapsibleAnswerProps) {
  const long = isLongAnswer(content);
  const collapsed = long && !expanded;

  return (
    <>
      <div className={collapsed ? "max-h-[8.5rem] overflow-hidden" : undefined}>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      {long ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 inline-flex w-full min-h-[2.25rem] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent-muted/50 px-3 py-2 text-sm font-semibold text-accent shadow-[0_1px_0_rgb(248_250_252/0.04)_inset] transition-colors hover:border-accent/60 hover:bg-accent-muted hover:text-accent-hover focus-visible:rounded-lg"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
              Show more
            </>
          )}
        </button>
      ) : null}
    </>
  );
}

export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: TavilySource[];
  tokens?: TokenUsage;
  anthropicTokenCost?: AnthropicTokenCost | null;
};

type ChatPanelProps = {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
};

export default function ChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  isLoading,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLLIElement>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(
    () => new Set(),
  );
  const canSend = !isLoading && input.trim().length > 0;

  const toggleAnswerExpanded = useCallback((index: number) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Run after layout so scrollHeight is correct; avoid smooth scroll on tall replies.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || messages.length === 0) return;

    const last = messages[messages.length - 1];
    const anchor = lastMessageRef.current;

    if (last.role === "assistant" && !isLoading && anchor) {
      anchor.scrollIntoView({ block: "start", behavior: "auto" });
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSend) onSend();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-4 pb-2 md:px-6 md:pt-6"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-panel-border bg-background-elevated shadow-[var(--shadow-panel)]">
              <MessageSquare
                className="h-7 w-7 text-accent"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <h2 className="mt-5 text-base font-semibold text-foreground">
              Try a publisher query
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              Answers use Tavily search and Claude. High commercial intent unlocks
              a mock sponsored placement in the side panel.
            </p>
            <p className="mt-4 text-xs text-foreground-muted">
              Pick a demo question from the header or type your own below.
            </p>
          </div>
        ) : (
          <ul
            className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4"
            role="list"
          >
            {messages.map((msg, i) => (
              <li
                key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
                ref={i === messages.length - 1 ? lastMessageRef : undefined}
                className={`flex scroll-mt-4 scroll-mb-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <article
                  className={`max-w-[min(85%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent-muted text-foreground ring-1 ring-accent/25"
                      : "panel-card text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <CollapsibleAnswer
                      content={msg.content}
                      expanded={expandedAnswers.has(i)}
                      onToggle={() => toggleAnswerExpanded(i)}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.role === "assistant" &&
                  (msg.sources?.length || msg.tokens) ? (
                    <footer className="mt-3 space-y-2 border-t border-panel-border/80 pt-3">
                      {msg.sources && msg.sources.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-foreground-muted">
                            Sources via{" "}
                            <span className="text-accent">Tavily</span>
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {msg.sources.map((source) => (
                              <li key={source.url}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-accent hover:text-accent-hover hover:underline focus-visible:rounded-sm"
                                >
                                  {source.title || source.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {msg.anthropicTokenCost ? (
                        <TokenCostDetail
                          usage={{
                            inputTokens: msg.anthropicTokenCost.input_tokens,
                            outputTokens: msg.anthropicTokenCost.output_tokens,
                            inputCostUsd: msg.anthropicTokenCost.input_cost_usd,
                            outputCostUsd: msg.anthropicTokenCost.output_cost_usd,
                            totalCostUsd: msg.anthropicTokenCost.total_cost_usd,
                            model: msg.anthropicTokenCost.model,
                          }}
                        />
                      ) : msg.tokens &&
                        (msg.tokens.input > 0 || msg.tokens.output > 0) ? (
                        <p className="font-mono text-xs tabular-nums text-foreground-muted">
                          {msg.tokens.input} in · {msg.tokens.output} out
                        </p>
                      ) : null}
                    </footer>
                  ) : null}
                </article>
              </li>
            ))}
            {isLoading ? (
              <li className="flex justify-start" aria-live="polite">
                <div className="panel-card flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-foreground-muted">
                  <Spinner label="Assistant is responding" />
                  <span className="animate-pulse-subtle">
                    Searching and composing…
                  </span>
                </div>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-panel-border bg-background-muted/80 px-4 py-4 backdrop-blur-sm md:px-6"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask anything…"
            disabled={isLoading}
            autoComplete="off"
            className="input-field flex-1 text-sm md:text-base"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="btn-primary shrink-0 px-4"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <Spinner className="h-4 w-4 text-white" />
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
