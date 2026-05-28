# Slice 6 — AdTech Metrics Panel
**Priority:** Should Have | **Est:** 20 min  
**Depends on:** Slice 3, Slice 5

---

## Goal

Running session metrics that update after every query. Shows the sell-side publisher story: how many queries, how many monetised, fill rate, and the state of the last impression.

---

## Metrics State (backend, in-memory per server process)

Frontend displays metrics returned on each `POST /chat` response; session state lives in `backend/metrics.py`.

---

## Metrics Panel UI

```
┌─────────────────────────────┐
│  SESSION METRICS            │
│                             │
│  Queries      12            │
│  Ads served    7   58%      │  ← fill rate
│  No fill       3            │
│  Blocked       2            │
│                             │
│  LAST IMPRESSION            │
│  State    ✅ Logged         │
│  Tier     High  0.88        │
│  Bid      Won               │
└─────────────────────────────┘
```

---

## Backend Metrics (session-level, in-memory)

**File:** `backend/metrics.py`

```python
from dataclasses import dataclass, field

@dataclass
class SessionMetrics:
    total_queries: int = 0
    ads_served: int = 0
    no_fill: int = 0
    blocked: int = 0

    def record(self, ad_served: bool, thrad_called: bool):
        self.total_queries += 1
        if ad_served:
            self.ads_served += 1
        elif thrad_called:
            self.no_fill += 1
        else:
            self.blocked += 1

    @property
    def fill_rate(self) -> float:
        denom = self.ads_served + self.no_fill
        return round(self.ads_served / denom * 100, 1) if denom > 0 else 0.0

    def to_dict(self):
        return {
            "total_queries": self.total_queries,
            "ads_served": self.ads_served,
            "no_fill": self.no_fill,
            "blocked": self.blocked,
            "fill_rate": self.fill_rate
        }

metrics = SessionMetrics()  # singleton per server process
```

**In `/chat`:**

```python
from metrics import metrics as session_metrics

# after ad decision:
thrad_called = intent["score"] >= 0.70
ad_served = ad is not None
session_metrics.record(ad_served, thrad_called)

return {
    ...
    "metrics": session_metrics.to_dict()
}
```

---

## Impression State

| Condition | State | Display |
|---|---|---|
| Ad served | `logged` | ✅ Logged |
| Thrad called, no fill | `no_fill` | ⚠️ No fill |
| Score < 0.70 | `none` | ⛔ Blocked |

---

## Steps

1. Create `metrics.py` singleton
2. Update `/chat` to record and return metrics
3. Build metrics panel component
4. Frontend: update metrics state after every response
5. Add `POST /metrics/reset` endpoint for demo reset
6. Wire reset button in UI (for demo restarts)

---

## Done When

- [x] Metrics update after every query
- [x] Fill rate calculates correctly
- [x] Last impression state reflects actual Thrad outcome
- [x] Reset button clears session metrics
- [x] Metrics panel does not flicker or reset on re-render
