"use client";

import Link from "next/link";
import { useProgress } from "./ProgressProvider";
import type { Level, Track } from "@/lib/content/types";

const LEVELS: Level[] = ["Basic", "Fundamental", "Advanced"];
const strip = (s: string) => s.replace(/<[^>]+>/g, "");

export function TrackView({ track: t }: { track: Track }) {
  const { stats, mastery, ready } = useProgress();
  return (
    <div className="wrap page">
      <div className="page-title">
        <div className="crumbs"><Link href="/">Tracks</Link><span>/</span><span>{t.code}</span></div>
        <span className="eyebrow">{t.code} · {t.rating}</span>
        <h1>{t.title}</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>{t.summary}</p>
      </div>
      <div className="levels">
        {LEVELS.map((lv, i) => {
          const items = t.lessons.filter((l) => l.level === lv);
          return (
            <div key={lv} className={`level-col l${i + 1}`}>
              <h3><span className="pip" />{lv}</h3>
              {items.length === 0 && <p className="muted" style={{ fontSize: ".88rem" }}>More lessons coming.</p>}
              {items.map((l) => {
                const s = stats(l);
                const m = mastery(l);
                return (
                  <Link key={l.id} href={`/learn/${l.id}`} className={`lcard${ready && s.complete ? " complete" : ""}`}>
                    <h4>{l.title}</h4>
                    <div className="chips">
                      <span className="chip">{l.minutes} min</span>
                      <span className="chip">{l.quiz.length} quiz</span>
                      <span className="chip">{l.challenges.length} challenges</span>
                      <span className="chip">debug</span>
                      {ready && s.started && !s.complete && <span className="chip">{s.done}/{s.total}</span>}
                      {ready && m.level > 0 && <span className={`chip mastery m${m.level}`}>{m.label}</span>}
                    </div>
                    <p>{strip(l.pow).slice(0, 110)}…</p>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
