# Slice 5 — Live Intent + Attributes UI
**Priority:** Should Have | **Est:** 25 min  
**Depends on:** Slice 3, Slice 4

---

## Goal

Make the intent scoring visible and meaningful in the UI. Show score, tier badge, focus tag, and rationale for every query — whether static (dropdown) or live (freeform). Also expose Claude token usage.

---

## Intent Panel (side panel, top section)

```
┌─────────────────────────────┐
│  INTENT                     │
│                             │
│  Score    0.88              │
│  ████████░░  88%            │
│                             │
│  Tier     🔴 HIGH           │
│  Gate     ✅ Ad eligible    │
│                             │
│  Focus    AI tooling        │
│           model selection   │
│                             │
│  "Explicit production       │
│   vendor selection"         │ ← rationale (muted)
└─────────────────────────────┘
```

---

## Tier Badge Colours

```tsx
const TIER_STYLES = {
  high:      "bg-red-500/20 text-red-400 border-red-500/30",
  medium:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low:       "bg-green-500/20 text-green-400 border-green-500/30",
  "off-topic": "bg-gray-500/20 text-gray-400 border-gray-500/30"
}
```

---

## Score Bar

```tsx
<div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
  <div
    className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
    style={{ width: `${intent.score * 100}%` }}
  />
</div>
```

---

## Focus Chip (purple, existing pattern)

```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                 bg-purple-500/20 text-purple-300 border border-purple-500/30">
  {focus.category} › {focus.sub_category}
</span>
```

---

## Token Usage (Claude attributes)

Add to response payload:

```python
# in main.py, after claude_respond()
return {
    ...
    "tokens": {
        "input": msg.usage.input_tokens,
        "output": msg.usage.output_tokens
    }
}
```

Show in metrics panel (Slice 6) or as a subtle footer under response:

```tsx
<span className="text-xs text-gray-600">
  {tokens.input} in · {tokens.output} out
</span>
```

---

## Focus Detection for Freeform

When source is `"freeform"`, add focus detection to the intent call:

```python
SYSTEM = """You are a commercial intent classifier for an AI publisher.
Score the user's message from 0.0 to 1.0 based on purchase/adoption intent.
Also classify the focus category and sub-category.

Return ONLY valid JSON:
{
  "score": float,
  "tier": "high|medium|low|off-topic",
  "rationale": "one line explanation",
  "focus": {
    "category": "advertising|AI tooling|DevOps|general",
    "sub_category": "specific sub-topic"
  }
}"""
```

---

## Steps

1. Extend `intent_score()` to return `rationale` + `focus` for freeform
2. Update `/chat` response to include `tokens` from Claude usage
3. Build intent panel UI component with score bar + tier badge + focus chip
4. Show rationale text (muted, italic)
5. Show gate decision (✅ eligible / ⛔ blocked + reason)
6. Test: switch between dropdown tiers → panel updates correctly each time

---

## Done When

- [x] Score bar animates on each query
- [x] Tier badge colour matches intent tier
- [x] Focus chip shows correct category › sub-category
- [x] Rationale text visible (muted)
- [x] Gate decision (eligible / blocked) shown clearly
- [x] Token count visible somewhere in UI
- [x] Freeform queries get focus auto-detected
