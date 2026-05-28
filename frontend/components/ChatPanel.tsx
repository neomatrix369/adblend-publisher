"use client";

import { FormEvent, useRef, useEffect } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSend();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">
            Send a message — Tavily + Claude; high commercial intent unlocks a mock ad.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-accent/20 text-foreground"
                  : "border border-panel-border bg-[#14141a] text-foreground"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" &&
              (msg.sources?.length || msg.tokens) ? (
              <div className="mt-2 space-y-1">
                {msg.sources && msg.sources.length > 0 ? (
                  <>
                    <p className="text-xs text-text-muted">
                      Powered by{" "}
                      <span className="text-accent">Tavily</span>
                    </p>
                    <ul className="space-y-1 text-xs text-text-muted">
                      {msg.sources.map((source) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent/90 hover:text-accent hover:underline"
                          >
                            {source.title || source.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {msg.tokens &&
                (msg.tokens.input > 0 || msg.tokens.output > 0) ? (
                  <p className="text-xs text-gray-600">
                    {msg.tokens.input} in · {msg.tokens.output} out
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-panel-border p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask anything…"
            disabled={isLoading}
            className="flex-1 rounded-md border border-panel-border bg-[#0e0e12] px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
