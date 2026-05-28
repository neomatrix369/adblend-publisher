"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { getDataset, type DatasetEntry } from "@/lib/api";
import {
  TIER_LABELS,
  TIER_ORDER,
  type IntentTier,
} from "@/lib/tier-styles";

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectEntry: (entry: DatasetEntry | null) => void;
};

function truncate(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function optgroupLabel(tier: IntentTier): string {
  return TIER_LABELS[tier];
}

export default function Dropdown({
  value,
  onChange,
  onSelectEntry,
}: DropdownProps) {
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
          setLoadError(
            err instanceof Error ? err.message : "Failed to load dataset",
          );
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
    return TIER_ORDER.map((tier) => ({
      tier,
      items: byTier.get(tier) ?? [],
    })).filter((g) => g.items.length > 0);
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
    <div className="relative min-w-0 flex-1">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="input-field w-full cursor-pointer appearance-none pr-10 text-sm"
        aria-label="Demo questions"
        aria-invalid={loadError ? true : undefined}
        title={loadError ?? undefined}
      >
        <option value="">
          {loadError ? "Dataset unavailable" : "Select demo question…"}
        </option>
        {grouped.map(({ tier, items }) => (
          <optgroup
            key={tier}
            label={optgroupLabel(tier as IntentTier)}
          >
            {items.map((entry) => (
              <option key={entry.user_input} value={entry.user_input}>
                {truncate(entry.user_input)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-foreground-muted"
        aria-hidden
      />
      {loadError ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
