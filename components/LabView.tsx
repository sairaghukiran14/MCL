"use client";

import { useEffect, useRef } from "react";
import { useProgress } from "./ProgressProvider";

export function LabView() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useProgress();
  const pr = useRef(p);
  pr.current = p;

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const el = ref.current;
    import("@/lib/sim/mount").then((m) => {
      if (cancelled || !el) return;
      el.innerHTML = "";
      const scope = m.beginScope();
      m.mountLab(el, {
        full: true,
        progress: {
          has: (k: string, key: string) => pr.current.has(k as "m", key),
          mark: (k: string, key: string) => pr.current.mark(k as "m", key),
        },
      });
      m.endScope();
      cleanup = () => scope.forEach((stop) => stop());
    });
    return () => { cancelled = true; cleanup(); if (el) el.innerHTML = ""; };
  }, []);

  return <div ref={ref} style={{ minHeight: 600 }} />;
}
