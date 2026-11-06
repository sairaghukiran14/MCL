"use client";

import Link from "next/link";
import { Glyph, CAT_GLYPH } from "./Glyph";
import { XP, useProgress } from "./ProgressProvider";
import { CATS, budgetLabel, fmtINR, type Project } from "@/lib/content/projects";
import { findLesson } from "@/lib/content";

interface Props {
  p: Project;
  lessons: { id: string; title: string; level: string; prereq?: boolean }[];
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
}

export function ProjectView({ p, lessons, prev, next }: Props) {
  const pr = useProgress();
  const done = p.steps.filter((_, i) => pr.has("p", `${p.id}:${i}`)).length;
  const total = p.parts.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/projects">Projects</Link><span>/</span><span>{CATS[p.cat].label}</span></div>
      <header className="project-head">
        <div className="project-glyph"><Glyph kind={CAT_GLYPH[p.cat]} size={96} /></div>
        <div className="page-title">
          <span className="eyebrow">{CATS[p.cat].label} · {p.level}</span>
          <h1>{p.title}</h1>
          <p className="lede-sm">{p.tagline}</p>
          <div className="chips">
            <span className={`chip lvl-${p.level.toLowerCase()}`}>{p.level}</span>
            <span className="chip">{p.weeks} {p.weeks === 1 ? "week" : "weeks"}</span>
            <span className="chip">{budgetLabel(p.budget)}</span>
            <span className="chip">{done}/{p.steps.length} milestones</span>
          </div>
        </div>
      </header>

      {p.safety && <div className="safety"><b>Safety</b>{p.safety}</div>}

      <div className="project-grid">
        <div className="lesson-body">
          <section className="block">
            <header><span className="num">01</span><h3>Milestones</h3><span className="hint-xp">{XP.p} XP each · tick them off as you go</span></header>
            <div className="pbar big"><i style={{ width: `${(100 * done) / p.steps.length}%` }} /></div>
            <ol className="milestones">
              {p.steps.map((s, i) => {
                const key = `${p.id}:${i}`, on = pr.has("p", key);
                return (
                  <li key={i} className={on ? "on" : ""}>
                    <label htmlFor={`ms-${i}`}>
                      <input id={`ms-${i}`} type="checkbox" checked={on} onChange={(e) => (e.target.checked ? pr.mark("p", key) : pr.unmark("p", key))} />
                      <span className="ms-n">{String(i + 1).padStart(2, "0")}</span>
                      <span>{s}</span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>

          {p.milestones && p.milestones.length > 0 && (
            <section className="block">
              <header><span className="num">02</span><h3>Done when</h3><span className="hint-xp">measurable checks for each checkpoint</span></header>
              <div className="accept">
                {p.milestones.map((m, mi) => {
                  const keys = m.accept.map((_, ai) => `${p.id}:${mi}:${ai}`);
                  const all = keys.every((k) => pr.has("a", k));
                  return (
                    <div key={mi} className={`accept-group${all ? " on" : ""}`}>
                      <h4><span className="ms-n">{all ? "✓" : mi + 1}</span>{m.title}</h4>
                      {m.accept.map((a, ai) => {
                        const k = keys[ai], id = `ac-${mi}-${ai}`;
                        return (
                          <label key={ai} htmlFor={id}>
                            <input id={id} type="checkbox" checked={pr.has("a", k)} onChange={(e) => (e.target.checked ? pr.mark("a", k) : pr.unmark("a", k))} />
                            <span>{a}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="block">
            <header><span className="num">{p.milestones?.length ? "03" : "02"}</span><h3>Deliverable</h3></header>
            <p>{p.deliverable}</p>
            <div className="callout"><b>Stretch goal:</b> {p.stretch}</div>
            {p.pitfalls && p.pitfalls.length > 0 && (
              <div>
                <span className="eyebrow">Common pitfalls</span>
                <ul className="pitfalls">{p.pitfalls.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
          </section>

          <section className="block">
            <header><span className="num">{p.milestones?.length ? "04" : "03"}</span><h3>Learn it first</h3><span className="hint-xp">each lesson has a simulation</span></header>
            <div className="related">
              {lessons.map((l) => {
                const r = findLesson(l.id);
                const m = pr.ready && r ? pr.mastery(r.lesson) : null;
                return (
                  <Link key={l.id} href={`/learn/${l.id}`} className="related-item">
                    <span className="chip">{l.level}</span>
                    <span>{l.title}{l.prereq && <span className="muted"> · get to Practised before you start</span>}</span>
                    <span className="related-end">{m && m.level > 0 && <span className={`chip mastery m${m.level}`}>{m.label}</span>}<span className="arrow-r">→</span></span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="project-side">
          <section className="block">
            <header><h3>What you will learn</h3></header>
            <ul className="checks" style={{ marginTop: 0 }}>{p.learn.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <section className="block">
            <header><h3>Parts</h3><span className="hint-xp">approximate ₹</span></header>
            {p.budget[1] === 0 ? <p className="muted">Software only. Everything here is free.</p> : (
              <table className="prog parts">
                <tbody>
                  {p.parts.map(([name, v]) => <tr key={name}><td>{name}</td><td className="num-r">{v ? fmtINR(v) : "–"}</td></tr>)}
                  <tr className="total"><td>Total</td><td className="num-r">{fmtINR(total)}</td></tr>
                </tbody>
              </table>
            )}
          </section>
        </aside>
      </div>

      <div className="lesson-nav">
        {prev ? <Link className="btn" href={`/projects/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link className="btn primary" href={`/projects/${next.id}`}>{next.title} →</Link> : <Link className="btn primary" href="/projects">All projects</Link>}
      </div>
    </div>
  );
}
