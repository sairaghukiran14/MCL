"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SimHost } from "./SimHost";
import { Challenge, Mcq } from "./Exercises";
import { XP, useProgress } from "./ProgressProvider";
import type { Lesson } from "@/lib/content/types";
import { Story } from "./Story";
import { ProjectCard } from "./ProjectCard";
import { explainersForLesson } from "@/lib/content/explainers";
import { projectsForLesson } from "@/lib/content/projects";
import { formulasForLesson } from "@/lib/content/reference";
import { anatomiesForLesson } from "@/lib/content/anatomy";
import { WorkedExample } from "./WorkedExample";

interface Props {
  lesson: Lesson;
  track: { id: string; code: string; title: string };
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
}

export function LessonView({ lesson: l, track, prev, next }: Props) {
  const p = useProgress();
  const s = p.stats(l);
  const m = p.mastery(l);
  const { ready, visit } = p;
  useEffect(() => { if (ready) visit(l.id); }, [ready, visit, l.id]);
  const formulas = formulasForLesson(l.id);
  const teardowns = anatomiesForLesson(l.id);
  let n = 0;
  const num = () => String(++n).padStart(2, "0");
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const watch = explainersForLesson(l.id)[0];
  const builds = projectsForLesson(l.id);
  const toc = [
    ...(watch ? [{ id: "watch", label: "Watch", done: p.has("x", watch.id) }] : []),
    { id: "learn", label: "Learn", done: false },
    { id: "explore", label: "Explore", done: false },
    ...(l.worked ? [{ id: "worked", label: "Worked example", done: p.has("k", l.id) }] : []),
    { id: "quiz", label: "Quiz", done: s.qd === l.quiz.length },
    { id: "challenge", label: "Challenge", done: s.cd === l.challenges.length },
    { id: "debug", label: "Debug", done: !!s.dd },
    { id: "proof", label: "Proof of work", done: !!s.wd },
    ...(builds.length ? [{ id: "build", label: "Build it", done: false }] : []),
  ];
  return (
    <div className="wrap page">
      <div className="page-title">
        <div className="crumbs">
          <Link href="/">Tracks</Link><span>/</span>
          <Link href={`/tracks/${track.id}`}>{track.code} {track.title}</Link><span>/</span><span>{l.level}</span>
        </div>
        <h1>{l.title}</h1>
        <div className="chips">
          <span className="chip acc">{l.level}</span>
          <span className="chip">{l.minutes} min</span>
          <span className="chip">{s.done}/{s.total} done</span>
          {p.ready && <span className={`chip mastery m${m.level}`}>{m.label}</span>}
        </div>
        {p.ready && <p className="mastery-next muted">{m.next}</p>}
      </div>

      <div className="lesson-layout">
        <nav className="toc" aria-label="Lesson sections">
          {toc.map((t) => (
            <a key={t.id} href={`#${t.id}`} onClick={jump(t.id)} className={t.done ? "done" : ""}>
              <span className="dot" />{t.label}
            </a>
          ))}
        </nav>

        <div className="lesson-body">
          {watch && (
            <section className="block" id="watch">
              <header><span className="num">00</span><h3>Watch first</h3><span className="hint-xp">{watch.title} · {XP.x} XP</span></header>
              <Story id={watch.id} compact />
            </section>
          )}

          <section className="block" id="learn">
            <header><span className="num">{num()}</span><h3>Learn</h3></header>
            {teardowns.map((td) => (
              <Link key={td.id} href={`/anatomy/${td.id}`} className="an-callout">
                <span className="eyebrow">See the hardware</span>
                <b>{td.title}</b>
                <span className="muted">Every part labelled and explained, with a live animation →</span>
              </Link>
            ))}
            <div className="theory" dangerouslySetInnerHTML={{ __html: l.theory }} />
            {formulas.length > 0 && (
              <div className="key-formulas">
                <span className="eyebrow">On the formula sheet</span>
                <div className="chips">
                  {formulas.map((f) => <Link key={f.id} className="chip" href={`/reference#${f.id}`}>{f.name}</Link>)}
                </div>
              </div>
            )}
          </section>

          <section className="block" id="explore">
            <header><span className="num">{num()}</span><h3>Explore</h3></header>
            <p className="simnote" dangerouslySetInnerHTML={{ __html: l.simNote }} />
            <SimHost name={l.sim} />
          </section>

          {l.worked && (
            <section className="block" id="worked">
              <header><span className="num">{num()}</span><h3>Worked example</h3><span className="hint-xp">{XP.k} XP · read it step by step</span></header>
              <WorkedExample worked={l.worked} done={p.has("k", l.id)} onDone={() => p.mark("k", l.id)}
                onSkip={() => document.getElementById("challenge")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
            </section>
          )}

          <section className="block" id="quiz">
            <header><span className="num">{num()}</span><h3>Quiz</h3><span className="hint-xp">{XP.q} XP each</span></header>
            <div className="qlist">
              {l.quiz.map((q, i) => (
                <Mcq key={i} title={`${i + 1}. ${q.q}`} options={q.options} answer={q.answer} why={q.why}
                  solved={p.has("q", `${l.id}:${i}`)} onRight={() => p.mark("q", `${l.id}:${i}`)} />
              ))}
            </div>
          </section>

          <section className="block" id="challenge">
            <header><span className="num">{num()}</span><h3>Challenges</h3><span className="hint-xp">{XP.c} XP each · work it out, then enter the number</span></header>
            <div className="qlist">
              {l.challenges.map((c, i) => (
                <Challenge key={i} item={c} index={i} solved={p.has("c", `${l.id}:${i}`)} onSolved={() => p.mark("c", `${l.id}:${i}`)} />
              ))}
            </div>
          </section>

          <section className="block" id="debug">
            <header><span className="num">{num()}</span><h3>Debug this</h3><span className="hint-xp">{XP.d} XP</span></header>
            <div className="q">
              <div className="scenario"><b>Symptom</b><span dangerouslySetInnerHTML={{ __html: l.debug.scenario }} /></div>
              {l.debug.code && <pre className="code" dangerouslySetInnerHTML={{ __html: l.debug.code }} />}
              <Mcq title="What is the root cause?" options={l.debug.options} answer={l.debug.answer} why={l.debug.why}
                solved={p.has("d", l.id)} onRight={() => p.mark("d", l.id)} />
            </div>
          </section>

          <section className="block" id="proof">
            <header><span className="num">{num()}</span><h3>Proof of work</h3><span className="hint-xp">{XP.w} XP · publish it on GitHub</span></header>
            <label className="pow" htmlFor="pow-check">
              <input id="pow-check" type="checkbox" checked={p.has("w", l.id)}
                onChange={(e) => (e.target.checked ? p.mark("w", l.id) : p.unmark("w", l.id))} />
              <span dangerouslySetInnerHTML={{ __html: l.pow }} />
            </label>
          </section>

          {builds.length > 0 && (
            <section className="block" id="build">
              <header><span className="num">{num()}</span><h3>Build it</h3><span className="hint-xp">projects that use this lesson</span></header>
              <div className="pgrid compact">{builds.slice(0, 3).map((b) => <ProjectCard key={b.id} p={b} />)}</div>
              {builds.length > 3 && <Link href="/projects" className="muted">and {builds.length - 3} more in Projects →</Link>}
            </section>
          )}

          <div className="lesson-nav">
            {prev ? <Link className="btn" href={`/learn/${prev.id}`}>← {prev.title}</Link> : <span />}
            {next ? <Link className="btn primary" href={`/learn/${next.id}`}>{next.title} →</Link> : <Link className="btn primary" href="/lab">Go to the Live Lab →</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
