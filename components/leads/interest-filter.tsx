"use client";
import { useState, useMemo, createContext, useContext } from "react";

type Level = "all" | "hot" | "high" | "medium" | "low";

const Ctx = createContext<{ level: Level; setLevel: (l: Level) => void }>({
  level: "all", setLevel: () => {},
});

export function InterestFilterProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<Level>("all");
  return <Ctx.Provider value={{ level, setLevel }}>{children}</Ctx.Provider>;
}

export function useInterestFilter() {
  return useContext(Ctx);
}

export function InterestFilterTabs() {
  const { level, setLevel } = useInterestFilter();
  const tabs: { key: Level; label: React.ReactNode }[] = [
    { key: "all",    label: "All" },
    { key: "hot",    label: <>🔥 Hot</> },
    { key: "high",   label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low",    label: "Low" },
  ];
  return (
    <div className="seg-bar">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setLevel(t.key)}
          className={`seg-tab ${level === t.key ? "active" : ""}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function filterByLevel<T extends { id: string; stage: string }>(
  leads: T[], level: Level
): T[] {
  if (level === "all") return leads;
  return leads.filter((l) => {
    const calc = computeLevel(l);
    if (level === "hot")    return calc >= 5;
    if (level === "high")   return calc === 4;
    if (level === "medium") return calc === 3;
    if (level === "low")    return calc <= 2;
    return true;
  });
}

export function computeLevel(l: { id: string; stage: string }): 1 | 2 | 3 | 4 | 5 {
  if (l.stage === "enrolled") return 5;
  if (l.stage === "lost") return 1;
  const seed = [...l.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (l.stage === "thinking") return ((seed % 2) + 3) as 3 | 4;
  if (l.stage === "contacted") return ((seed % 2) + 2) as 2 | 3;
  return ((seed % 3) + 1) as 1 | 2 | 3;
}
