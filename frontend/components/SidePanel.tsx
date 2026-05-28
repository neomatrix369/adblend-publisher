export default function SidePanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 border-l border-panel-border p-4">
      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Intent
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Score</dt>
            <dd>—</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Tier</dt>
            <dd>—</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Focus</dt>
            <dd>—</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Ad
        </h2>
        <p className="mt-3 text-sm text-text-muted">No placement yet</p>
      </section>

      <section className="rounded-lg border border-panel-border p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Metrics
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Queries</dt>
            <dd>0</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Ads served</dt>
            <dd>0</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Fill rate</dt>
            <dd>—</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
