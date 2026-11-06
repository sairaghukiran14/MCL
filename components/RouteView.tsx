"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress, xpMax } from "./ProgressProvider";
import { ALL_LESSONS, MISSIONS, WEEKS, findLesson } from "@/lib/content";

export function RouteView() {
  const p = useProgress();
  const [armed, setArmed] = useState(false);
  const all = ALL_LESSONS.map((l) => p.stats(l));
  const n = (k: "q" | "c" | "d" | "w" | "m") => Object.keys(p.state[k]).length;
  return (
    <div className="wrap page">
      <div className="page-title">
        <span className="eyebrow">Nov 2026 → Jan 2027</span>
        <h1>13-week route</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>
          Plan for 15–20 hours a week. Progress is saved in this browser only, so clearing site data resets it.
          Your GitHub repo is the real record: one commit per proof of work.
        </p>
      </div>
      <div className="readouts">
        <div className="ro"><span>XP</span><b>{p.xp} / {xpMax()}</b></div>
        <div className="ro"><span>Lessons complete</span><b>{all.filter((s) => s.complete).length} / {all.length}</b></div>
        <div className="ro"><span>Quiz answers</span><b>{n("q")}</b></div>
        <div className="ro"><span>Challenges solved</span><b>{n("c")}</b></div>
        <div className="ro"><span>Bugs found</span><b>{n("d")}</b></div>
        <div className="ro"><span>Lab missions</span><b>{n("m")} / {MISSIONS.length}</b></div>
      </div>
      <div className="tablewrap panel" style={{ padding: "6px 16px" }}>
        <table className="prog">
          <thead><tr><th>Week</th><th>Focus</th><th>Lessons</th></tr></thead>
          <tbody>
            {WEEKS.map((w) => (
              <tr key={w.w}>
                <td className="n">{w.w}</td>
                <td>{w.focus}</td>
                <td style={{ display: "grid", gap: 6 }}>
                  {w.ids.map((id) => {
                    if (id === "LAB") return <span key={id}><Link href="/lab">Live Lab missions</Link> <span className="chip">{n("m")}/{MISSIONS.length}</span></span>;
                    if (id === "PORTFOLIO") return <span key={id}>Portfolio, write-ups, resume <span className="chip">{n("w")} proofs of work</span></span>;
                    const r = findLesson(id);
                    if (!r) return null;
                    const s = p.stats(r.lesson);
                    return (
                      <span key={id}>
                        <Link href={`/learn/${id}`}>{r.lesson.title}</Link>{" "}
                        <span className={`chip${s.complete ? " ok" : s.started ? " acc" : ""}`}>{s.done}/{s.total}</span>
                      </span>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn small" type="button" onClick={() => { if (!armed) setArmed(true); else { p.reset(); setArmed(false); } }}>
          {armed ? "Click again to erase all progress" : "Reset my progress"}
        </button>
      </div>
    </div>
  );
}
