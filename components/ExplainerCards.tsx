"use client";

import Link from "next/link";
import { Glyph } from "./Glyph";
import { useProgress } from "./ProgressProvider";
import { EXPLAINERS } from "@/lib/content/explainers";

export function ExplainerCards({ limit }: { limit?: number }) {
  const { has, ready } = useProgress();
  return (
    <div className="xgrid">
      {EXPLAINERS.slice(0, limit ?? EXPLAINERS.length).map((e, i) => (
        <Link key={e.id} href={`/explain/${e.id}`} className="xcard" style={{ animationDelay: `${i * 60}ms` }}>
          <Glyph kind={e.glyph} size={52} />
          <h3>{e.title}</h3>
          <p>{e.summary}</p>
          <span className="xcard-meta">{e.steps.length} animated steps{ready && has("x", e.id) ? " · watched ✓" : ""}</span>
        </Link>
      ))}
    </div>
  );
}
