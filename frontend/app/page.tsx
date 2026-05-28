"use client";

import { useCallback, useState } from "react";
import ChatPanel, { type Message } from "@/components/ChatPanel";
import Dropdown from "@/components/Dropdown";
import SidePanel from "@/components/SidePanel";
import { postChat } from "@/lib/api";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postChat({
        message: text,
        source: dropdownValue ? "dropdown" : "freeform",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          sources: data.sources?.length ? data.sources : undefined,
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
  }, [input, isLoading, dropdownValue]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-panel-border px-4 py-3">
        <h1 className="shrink-0 text-lg font-semibold">
          <span className="text-accent">AdBlend</span> Publisher
        </h1>
        <Dropdown value={dropdownValue} onChange={setDropdownValue} />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col border-r border-panel-border">
          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={() => void sendMessage()}
            isLoading={isLoading}
          />
        </main>
        <SidePanel />
      </div>
    </div>
  );
}
