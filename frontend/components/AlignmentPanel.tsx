import ImpactPanel from "@/components/ui/ImpactPanel";
import type { AlignmentPayload } from "@/lib/api";

type AlignmentPanelProps = {
  alignment: AlignmentPayload | null;
  isLoading?: boolean;
};

function AlignmentSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-4 w-3/4 animate-pulse rounded bg-background-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-background-muted" />
      <div className="h-3 w-full animate-pulse rounded-full bg-background-muted" />
    </div>
  );
}

function formatFocus(focus: { category: string; sub_category: string }): string {
  const category = focus.category?.trim();
  const sub = focus.sub_category?.trim();
  if (category && sub) return `${category} › ${sub}`;
  if (category) return category;
  if (sub) return sub;
  return "—";
}

function labelClass(label: string): string {
  if (label === "strong" || label === "match") {
    return "text-success";
  }
  if (label === "partial") {
    return "text-accent";
  }
  if (label === "n/a") {
    return "text-foreground-muted";
  }
  return "text-red-300";
}

export default function AlignmentPanel({
  alignment,
  isLoading = false,
}: AlignmentPanelProps) {
  const overallPercent =
    alignment != null
      ? Math.round(alignment.scores.overall * 100)
      : null;

  const showPersona =
    alignment?.question.persona_role ||
    alignment?.answer.persona_id ||
    alignment?.labels.persona !== "n/a";

  return (
    <ImpactPanel
      title="Answer fit"
      subtitle="How well the reply matches question persona and focus"
      variant="impact"
    >
      {isLoading && alignment == null ? (
        <AlignmentSkeleton />
      ) : alignment == null ? (
        <p className="text-sm text-foreground-muted">
          Send a message to measure answer alignment.
        </p>
      ) : (
        <div className="space-y-3 text-xs">
          {showPersona ? (
            <div className="space-y-1">
              <p className="font-medium text-foreground-muted">Persona</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                <span className="text-foreground-muted">Q</span>
                <span>{alignment.question.persona_role ?? "—"}</span>
                <span className="text-foreground-muted">A</span>
                <span>
                  {alignment.answer.persona_id
                    ? alignment.answer.persona_id.replace(/-/g, " ")
                    : "—"}
                </span>
              </div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-wide ${labelClass(alignment.labels.persona)}`}
              >
                {alignment.labels.persona === "match"
                  ? "Persona match"
                  : alignment.labels.persona === "mismatch"
                    ? "Persona mismatch"
                    : "Persona n/a"}
              </p>
            </div>
          ) : null}

          <div className="space-y-1">
            <p className="font-medium text-foreground-muted">Focus</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
              <span className="text-foreground-muted">Q</span>
              <span>{formatFocus(alignment.question.focus)}</span>
              <span className="text-foreground-muted">A</span>
              <span>{formatFocus(alignment.answer.focus)}</span>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-foreground-muted">Match</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {overallPercent}%
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-background-muted/80 ring-1 ring-panel-border/50"
              role="progressbar"
              aria-valuenow={overallPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall alignment"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500/70 to-violet-400 transition-[width] duration-500 ease-out"
                style={{ width: `${alignment.scores.overall * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-foreground-muted">
              Focus {(alignment.scores.focus_match * 100).toFixed(0)}%
              {alignment.scores.persona_match != null
                ? ` · Persona ${(alignment.scores.persona_match * 100).toFixed(0)}%`
                : ""}
              {" · "}
              <span className={labelClass(alignment.labels.focus)}>
                {alignment.labels.focus}
              </span>
            </p>
          </div>

          {alignment.answer.rationale ? (
            <blockquote className="border-l-2 border-violet-500/40 py-0.5 pl-2.5 text-[11px] leading-relaxed text-foreground-muted italic">
              {alignment.answer.rationale}
            </blockquote>
          ) : null}
        </div>
      )}
    </ImpactPanel>
  );
}
