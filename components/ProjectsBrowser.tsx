"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { CATS, LEVELS, PROJECTS, type ProjectCat, type ProjectLevel } from "@/lib/content/projects";

export function ProjectsBrowser() {
  const [cat, setCat] = useState<ProjectCat | "all">("all");
  const [lvl, setLvl] = useState<ProjectLevel | "all">("all");
  const [free, setFree] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => PROJECTS.filter((p) =>
    (cat === "all" || p.cat === cat) && (lvl === "all" || p.level === lvl) && (!free || p.budget[1] === 0) &&
    (!q || (p.title + " " + p.tagline).toLowerCase().includes(q.toLowerCase()))), [cat, lvl, free, q]);
  const cats = Object.keys(CATS) as ProjectCat[];
  return (
    <div className="pbrowser">
      <div className="filters">
        <div className="seg" role="group" aria-label="Category">
          <button type="button" className={cat === "all" ? "on" : ""} onClick={() => setCat("all")}>All <span>{PROJECTS.length}</span></button>
          {cats.map((c) => (
            <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
              {CATS[c].label} <span>{PROJECTS.filter((p) => p.cat === c).length}</span>
            </button>
          ))}
        </div>
        <div className="filters-row">
          <div className="seg small" role="group" aria-label="Level">
            <button type="button" className={lvl === "all" ? "on" : ""} onClick={() => setLvl("all")}>Any level</button>
            {LEVELS.map((l) => <button key={l} type="button" className={lvl === l ? "on" : ""} onClick={() => setLvl(l)}>{l}</button>)}
          </div>
          <label className="toggle" htmlFor="free-only"><input id="free-only" type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Simulation only (free)</label>
          <input className="search" id="project-search" type="search" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
        </div>
      </div>
      {cat !== "all" && <p className="muted">{CATS[cat].blurb}</p>}
      <div className="pgrid">
        {list.map((p, i) => <ProjectCard key={p.id} p={p} index={i} />)}
      </div>
      {list.length === 0 && <p className="muted">No projects match. Clear a filter to see more.</p>}
    </div>
  );
}
