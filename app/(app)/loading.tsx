export default function AppLoading() {
  return (
    <div className="px-8 py-7 animate-pulse">
      <div className="h-3 w-24 rounded-md bg-[var(--surface-2)] mb-3" />
      <div className="h-12 w-72 rounded-lg bg-[var(--surface-2)] mb-7" />

      <div className="flex items-end gap-10 mb-8">
        <div>
          <div className="h-20 w-24 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-3 w-16 rounded-md bg-[var(--surface-2)] mt-2" />
        </div>
        <div>
          <div className="h-20 w-24 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-3 w-20 rounded-md bg-[var(--surface-2)] mt-2" />
        </div>
        <div>
          <div className="h-20 w-24 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-3 w-12 rounded-md bg-[var(--surface-2)] mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card rounded-3xl p-4 h-[280px]">
            <div className="h-2 w-12 rounded-md bg-[var(--surface-2)] mb-2" />
            <div className="h-8 w-8 rounded-md bg-[var(--surface-2)] mb-4" />
            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-[var(--surface-2)]" />
              <div className="h-16 rounded-xl bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
