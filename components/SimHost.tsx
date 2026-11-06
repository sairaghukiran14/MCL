"use client";

import { useEffect, useRef } from "react";

/** Mounts one of the imperative canvas simulations and tears it down on unmount. */
export function SimHost({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const el = ref.current;
    import("@/lib/sim/mount").then((m) => {
      if (cancelled || !el) return;
      el.innerHTML = "";
      cleanup = m.mountSim(name, el);
    });
    return () => {
      cancelled = true;
      cleanup();
      if (el) el.innerHTML = "";
    };
  }, [name]);
  return <div ref={ref} style={{ minHeight: 320 }} />;
}
