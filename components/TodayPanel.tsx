"use client";

import Link from "next/link";
import { findLesson, TRACKS } from "@/lib/content";
import { useProgress } from "./ProgressProvider";

/* Shown on the home page once a learner has some progress: review queue, where to resume, mastery by track. */
export function TodayPanel() {
  const p = useProgress();
  if (!p.ready) return null;
  const started = !!p.state.last || p.xp > 0;
  if (!started) return null;

  const last = p.state.last ? findLesson(p.state.last) : undefined;
  const lastM = last ? p.mastery(last.lesson) : undefined;
  const due = p.due.length;

  return (
    <section className="today" aria-labelledby="today-h">
      <div className="today-main">
        <span className="eyebrow" id="today-h">Today</span>
        <div className="today-row">
          <div>
            <b>{due ? `Review ${due} card${due === 1 ? "" : "s"}` : "No reviews due"}</b>
            <span className="muted">{due ? `About ${Math.max(1, Math.round(due * 0.5))} min. Spaced review keeps earlier tracks from fading.` : "Solve quiz questions and challenges to add cards."}</span>
          </div>
          {due > 0 && <Link className="btn primary" href="/review">Start review</Link>}
        </div>
        {last && lastM && (
          <div className="today-row">
            <div>
              <b>Continue: {last.lesson.title}</b>
              <span className="muted">{last.track.code} · {lastM.label}. {lastM.next}</span>
            </div>
            <Link className="btn" href={`/learn/${last.lesson.id}`}>Resume</Link>
          </div>
        )}
      </div>
      <div className="today-mastery">
        <span className="eyebrow">Mastery by track</span>
        {TRACKS.map((t) => {
          const lv = t.lessons.map((l) => p.mastery(l).level);
          const n = lv.length, practised = lv.filter((x) => x >= 2).length, mastered = lv.filter((x) => x === 4).length;
          return (
            <Link key={t.id} href={`/tracks/${t.id}`} className="tm-row">
              <span className="mono">{t.code}</span>
              <span className="tm-title">{t.title}</span>
              <span className="tm-bar" aria-label={`${practised} of ${n} practised, ${mastered} mastered`}>
                <i className="pr" style={{ width: `${(100 * practised) / n}%` }} />
                <i className="ma" style={{ width: `${(100 * mastered) / n}%` }} />
              </span>
            </Link>
          );
        })}
        <span className="muted tm-key"><i className="pr" /> practised or better <i className="ma" /> mastered</span>
      </div>
    </section>
  );
}
