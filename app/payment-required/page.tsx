export default function PaymentRequiredPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl text-3xl"
          style={{ background: "color-mix(in oklch, var(--color-status-overdue) 14%, transparent)" }}>
          ⏸
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Service paused</h1>
        <p className="text-[var(--text-soft)]">
          Your subscription is past due. Your data is safe — nothing was deleted.
          As soon as payment is recorded, access is restored instantly.
        </p>
        <div className="p-4 rounded-xl border text-sm space-y-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-semibold">Contact your vendor</p>
          <p>Gio · <a href="mailto:hello@stimulicrm.app" className="text-[var(--color-accent)]">hello@stimulicrm.app</a></p>
        </div>
      </div>
    </main>
  );
}
