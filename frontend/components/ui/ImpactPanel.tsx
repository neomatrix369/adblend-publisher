import type { ReactNode } from "react";

type ImpactVariant = "hero" | "impact" | "muted";

type ImpactPanelProps = {
  step?: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  variant?: ImpactVariant;
  accent?: "default" | "success" | "warning";
  children: ReactNode;
  className?: string;
};

const VARIANT_CLASS: Record<ImpactVariant, string> = {
  hero: "panel-hero",
  impact: "panel-impact",
  muted: "panel-muted",
};

const ACCENT_CLASS: Record<NonNullable<ImpactPanelProps["accent"]>, string> = {
  default: "",
  success: "panel-hero-success",
  warning: "panel-hero-warning",
};

export default function ImpactPanel({
  step,
  title,
  subtitle,
  variant = "hero",
  accent = "default",
  children,
  className = "",
}: ImpactPanelProps) {
  return (
    <section
      className={`${VARIANT_CLASS[variant]} ${accent !== "default" && variant === "hero" ? ACCENT_CLASS[accent] : ""} p-4 ${className}`.trim()}
    >
      <header className="flex items-start gap-3">
        {step != null ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-[0_0_12px_rgb(249_115_22/0.5)]"
            aria-hidden
          >
            {step}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <div className={step != null ? "mt-4" : "mt-3"}>{children}</div>
    </section>
  );
}
