"use client";
import { useEffect } from "react";

/**
 * Sets `--mx`/`--my` CSS variables on every element with class `glass-card`
 * (or `spotlight`) when the cursor is over it. Powers the radial light spot
 * in `.glass-card::after`.
 *
 * Defers attachment by two animation frames so hydration is fully settled
 * before any DOM mutation — avoids React 19 hydration mismatch warnings.
 */
export function SpotlightTracker() {
  useEffect(() => {
    let raf1 = 0, raf2 = 0;
    let attached = false;

    const handle = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".glass-card, .spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        window.addEventListener("pointermove", handle, { passive: true });
        attached = true;
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (attached) window.removeEventListener("pointermove", handle);
    };
  }, []);

  return null;
}
