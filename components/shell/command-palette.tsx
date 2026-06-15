"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, User, LayoutGrid, FileText, ArrowRight, Loader2 } from "lucide-react";
import { searchEverything, type SearchResult } from "@/lib/actions/search";

function debounce<F extends (...a: never[]) => void>(fn: F, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Reset query when closing
  useEffect(() => {
    if (!open) { setQ(""); setResults([]); setActive(0); }
  }, [open]);

  // Initial results (recent / pages) on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    searchEverything("").then((r) => { setResults(r); setLoading(false); });
  }, [open]);

  // Debounced search as user types
  const runSearch = useCallback(
    debounce((needle: string) => {
      searchEverything(needle).then((r) => {
        setResults(r); setActive(0); setLoading(false);
      });
    }, 180),
    [],
  );
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    runSearch(q);
  }, [q, open, runSearch]);

  function go(r: SearchResult) {
    setOpen(false);
    router.push(r.href);
  }

  return (
    <>
      {/* Sidebar trigger button (exposed via this component so sidebar can render it) */}
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 mb-2 mt-1 mx-1 rounded-lg border text-xs w-[calc(100%-8px)]"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-faint)" }}>
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <span className="px-1.5 py-px rounded text-[10px] font-mono border"
          style={{ borderColor: "var(--border)" }}>⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[640px] rounded-2xl border overflow-hidden glass"
            style={{
              background: "var(--surface-glass)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-lg)",
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
            }}>
            {/* Input row */}
            <div className="flex items-center gap-2.5 px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
              <Search className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
              <input ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
                }}
                placeholder="Search leads, programs, jump to a page…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]" />
              {loading && <Loader2 className="w-4 h-4 text-[var(--text-faint)] animate-spin" />}
              <span className="text-[10px] font-mono text-[var(--text-faint)] px-1.5 py-px rounded border"
                style={{ borderColor: "var(--border)" }}>ESC</span>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && !loading && (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-faint)]">
                  No results
                </div>
              )}
              {results.map((r, i) => (
                <button key={`${r.kind}-${r.id}`}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active ? "" : "hover:bg-[var(--surface-hover)]"
                  }`}
                  style={i === active ? { background: "var(--surface-hover)" } : undefined}>
                  <KindIcon kind={r.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    {r.subtitle && (
                      <div className="text-[11px] text-[var(--text-faint)] truncate">{r.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{r.kind}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 px-4 py-2 border-t text-[10px] text-[var(--text-faint)]"
              style={{ borderColor: "var(--border)" }}>
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span className="ml-auto">esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KindIcon({ kind }: { kind: SearchResult["kind"] }) {
  const cls = "w-7 h-7 rounded-md grid place-items-center shrink-0";
  const style = { background: "var(--surface-2)" };
  if (kind === "lead") return <div className={cls} style={style}><User className="w-3.5 h-3.5 text-[var(--text-soft)]" /></div>;
  if (kind === "program") return <div className={cls} style={style}><LayoutGrid className="w-3.5 h-3.5 text-[var(--text-soft)]" /></div>;
  return <div className={cls} style={style}><FileText className="w-3.5 h-3.5 text-[var(--text-soft)]" /></div>;
}
