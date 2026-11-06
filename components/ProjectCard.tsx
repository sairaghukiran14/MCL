"use client";

import Link from "next/link";
import { Glyph, CAT_GLYPH } from "./Glyph";
import { useProgress } from "./ProgressProvider";
import { CATS, budgetLabel, type Project } from "@/lib/content/projects";

export function ProjectCard({ p, index = 0 }: { p: Project; index?: number }) {
  const { has, ready } = useProgress();
  const done = ready ? p.steps.filter((_, i) => has("p", `${p.id}:${i}`)).length : 0;
  return (
    <Link href={`/projects/${p.id}`} className="pcard" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div className="pcard-top">
        <Glyph kind={CAT_GLYPH[p.cat]} size={48} />
        <span className={`chip lvl-${p.level.toLowerCase()}`}>{p.level}</span>
      </div>
      <span className="pcard-cat">{CATS[p.cat].label}</span>
      <h3>{p.title}</h3>
      <p>{p.tagline}</p>
      <div className="pcard-meta">
        <span>{p.weeks} wk</span><span>·</span><span>{budgetLabel(p.budget)}</span>
      </div>
      <div className="pbar" aria-label={`${done} of ${p.steps.length} milestones done`}>
        <i style={{ width: `${(100 * done) / p.steps.length}%` }} />
      </div>
    </Link>
  );
}
