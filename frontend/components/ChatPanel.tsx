"use client";

import { FormEvent, useEffect, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";

import Spinner from "@/components/ui/Spinner";
import type { TavilySource, TokenUsage } from "@/lib/api";

export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: TavilySource[];
  tokens?: TokenUsage;
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
  const canSend = !isLoading && input.trim().length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }, [messages, isLoading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSend) onSend();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 md:px-6"
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
          <ul className="mx-auto flex max-w-3xl flex-col gap-4" role="list">
            {messages.map((msg, i) => (
              <li
                key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <article
                  className={`max-w-[min(85%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent-muted text-foreground ring-1 ring-accent/25"
                      : "panel-card text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
                      {msg.tokens &&
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
        <div className="h-px shrink-0" aria-hidden />
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
