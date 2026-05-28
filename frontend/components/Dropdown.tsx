"use client";

import { useEffect, useMemo, useState } from "react";
import { getDataset, type DatasetEntry } from "@/lib/api";

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectEntry: (entry: DatasetEntry | null) => void;
};

const TIER_ORDER = ["high", "medium", "low", "off-topic"] as const;

const TIER_LABELS: Record<(typeof TIER_ORDER)[number], string> = {
  high: "🔴 High Intent",
  medium: "🟡 Medium Intent",
  low: "🟢 Low Intent",
  "off-topic": "⚫ Off-topic",
};

function truncate(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function Dropdown({ value, onChange, onSelectEntry }: DropdownProps) {
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDataset()
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load dataset");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const byTier = new Map<string, DatasetEntry[]>();
    for (const tier of TIER_ORDER) {
      byTier.set(tier, []);
    }
    for (const entry of entries) {
      const tier = entry.intent.tier;
      const bucket = byTier.get(tier) ?? byTier.get("off-topic")!;
      bucket.push(entry);
    }
    return TIER_ORDER.map((tier) => ({ tier, items: byTier.get(tier) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [entries]);

  const handleChange = (selected: string) => {
    onChange(selected);
    if (!selected) {
      onSelectEntry(null);
      return;
    }
    const entry = entries.find((e) => e.user_input === selected) ?? null;
    onSelectEntry(entry);
  };

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="flex-1 min-w-0 rounded-md border border-panel-border bg-[#0e0e12] px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      aria-label="Demo questions"
      title={loadError ?? undefined}
    >
      <option value="">
        {loadError ? "Dataset unavailable" : "Select demo question…"}
      </option>
      {grouped.map(({ tier, items }) => (
        <optgroup key={tier} label={TIER_LABELS[tier as (typeof TIER_ORDER)[number]] ?? tier}>
          {items.map((entry) => (
            <option key={entry.user_input} value={entry.user_input}>
              {truncate(entry.user_input)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
