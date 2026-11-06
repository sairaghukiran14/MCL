"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Anatomy, PartId, StepIcon } from "@/lib/content/anatomy";
import { Mcq } from "../Exercises";
import { KITS } from "./kits";

interface Props { a: Anatomy; lessonTitles: Record<string, string> }

const STEP_ICONS: Record<StepIcon, ReactNode> = {
  battery: <svg viewBox="0 0 48 48"><rect x="6" y="14" width="34" height="22" rx="3" /><rect x="40" y="21" width="4" height="8" rx="1" /><path d="M24 17 l-5 9 h6 l-3 8" className="fill" /></svg>,
  switches: <svg viewBox="0 0 48 48">{[8, 20, 32].map((x) => <g key={x}><rect x={x} y="8" width="8" height="12" rx="1" /><rect x={x} y="28" width="8" height="12" rx="1" /></g>)}<path d="M4 24 H44" /></svg>,
  field: <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" /><circle cx="24" cy="24" r="7" /><path d="M24 4 A20 20 0 0 1 43 20" className="acc" /><path d="M40 14 l3 6 l-6 0" className="acc" /></svg>,
  magnet: <svg viewBox="0 0 48 48"><rect x="6" y="16" width="18" height="16" rx="2" className="s" /><rect x="24" y="16" width="18" height="16" rx="2" className="n" /><path d="M10 10 A16 16 0 0 1 38 10" className="acc" /></svg>,
  chip: <svg viewBox="0 0 48 48"><rect x="12" y="12" width="24" height="24" rx="2" />{[16, 22, 28].map((v) => <g key={v}><path d={`M${v + 2} 12 V6`} /><path d={`M${v + 2} 36 V42`} /></g>)}</svg>,
  gate: <svg viewBox="0 0 48 48"><path d="M4 30 H12 V14 H22 V30 H30 V14 H40 V30 H44" className="acc" /><path d="M6 40 H42" /><path d="M24 36 v8" /></svg>,
  heat: <svg viewBox="0 0 48 48"><rect x="8" y="30" width="32" height="8" rx="1" />{[12, 20, 28, 36].map((x) => <path key={x} d={`M${x} 38 V44`} />)}<path d="M16 24 c-4 -5 4 -8 0 -14 M24 24 c-4 -5 4 -8 0 -14 M32 24 c-4 -5 4 -8 0 -14" className="acc" /></svg>,
  wave: <svg viewBox="0 0 48 48"><path d="M4 32 H10 V16 H14 V32 H18 V16 H24 V32 H26 V16 H34 V32 H36 V16 H38 V32 H44" /><path d="M4 26 C 14 6, 24 6, 34 26 S 44 40, 46 30" className="acc" /></svg>,
};

export function AnatomyView({ a, lessonTitles }: Props) {
  const { Scene, Icon, Live, System } = KITS[a.id];
  const groupOf = (id: string) => a.groups.find((g) => g.id === id);
  const [t, setT] = useState(1);
  const [hover, setHover] = useState<PartId[] | null>(null);
  const [picked, setPicked] = useState<PartId | null>(null);
  const anim = useRef<number | null>(null);
  const active: PartId[] = hover ?? (picked ? [picked] : []);
  const shown = a.parts.find((p) => p.id === (hover?.length === 1 ? hover[0] : picked));

  const animateTo = (target: number) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setT(target); return; }
    const from = t, start = performance.now(), dur = 900;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setT(from + (target - from) * e);
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current); }, []);

  const pick = (id: PartId) => setPicked((p) => (p === id ? null : id));
  const enter = (id: PartId | null) => setHover(id ? [id] : null);

  return (
    <div className="anatomy">
      {/* ------------------------------------------------ exploded view */}
      <section className="an-hero block" id="exploded" aria-labelledby="an-ex-h">
        <header>
          <span className="num">01</span><h3 id="an-ex-h">Exploded view</h3>
          <span className="hint-xp">hover or tap a part · {a.parts.length} parts</span>
        </header>
        <div className="an-stage" onClick={() => setPicked(null)}>
          <Scene t={t} active={active} onEnter={enter} onPick={pick} />
        </div>
        <div className="an-toolbar">
          <div className="an-slider">
            <label htmlFor="an-t">Assembled</label>
            <input id="an-t" type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
            <label htmlFor="an-t">Exploded</label>
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn small" onClick={() => animateTo(t > 0.5 ? 0 : 1)}>{t > 0.5 ? "Put it together" : "Take it apart"}</button>
          </div>
          <div className="an-groups">
            {a.groups.map((g) => {
              const ids = a.parts.filter((p) => p.group === g.id).map((p) => p.id);
              return (
                <button key={g.id} type="button" onMouseEnter={() => setHover(ids)} onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(ids)} onBlur={() => setHover(null)}>
                  <i style={{ background: g.color }} />{g.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`an-info${shown ? " on" : ""}`} aria-live="polite">
          {shown ? (
            <>
              <b>{shown.name}{shown.sub && <span className="muted"> · {shown.sub}</span>}</b>
              <span>{shown.fn}</span>
              {shown.lesson && <Link href={`/learn/${shown.lesson}`}>Lesson: {lessonTitles[shown.lesson]} →</Link>}
            </>
          ) : (
            <span className="muted">Point at any part to see what it does. Drag the slider to put the motor back together.</span>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ parts + cross-section + system */}
      <div className="an-grid">
        <section className="block" aria-labelledby="an-parts-h">
          <header><span className="num">02</span><h3 id="an-parts-h">Parts and what they do</h3></header>
          <ul className="an-parts">
            {a.parts.map((p) => (
              <li key={p.id} className={active.includes(p.id) ? "on" : ""}
                onMouseEnter={() => enter(p.id)} onMouseLeave={() => enter(null)}>
                <button type="button" className="an-part" onClick={() => pick(p.id)} onFocus={() => enter(p.id)} onBlur={() => enter(null)} aria-pressed={picked === p.id}>
                  <Icon id={p.id} />
                  <span className="an-part-text">
                    <b>{p.name}</b>
                    {p.sub && <span className="muted an-part-sub">{p.sub}</span>}
                    <span className="an-part-fn">{p.fn}</span>
                  </span>
                  <span className="an-tag"><i style={{ background: groupOf(p.group)?.color }} />{groupOf(p.group)?.tag}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="an-col">
          <section className="block" aria-labelledby="an-xs-h">
            <header><span className="num">03</span><h3 id="an-xs-h">{a.live.title}</h3><span className="hint-xp">{a.live.hint}</span></header>
            <Live />
          </section>
          <section className="block" aria-labelledby="an-sys-h">
            <header><span className="num">04</span><h3 id="an-sys-h">The whole system</h3><span className="hint-xp">{a.system.hint}</span></header>
            <System />
          </section>
        </div>
      </div>

      {/* ------------------------------------------------ how it works */}
      <section className="block" aria-labelledby="an-how-h">
        <header><span className="num">05</span><h3 id="an-how-h">How it works, step by step</h3><span className="hint-xp">hover a step to see its parts</span></header>
        <ol className="an-how">
          {a.steps.map((s, i) => (
            <li key={s.title} onMouseEnter={() => s.parts.length && setHover(s.parts)} onMouseLeave={() => setHover(null)}>
              <span className="an-how-n">{i + 1}</span>
              <span className="an-how-icon" aria-hidden="true">{STEP_ICONS[s.icon]}</span>
              <b>{s.title}</b>
              <span className="an-how-text">{s.text}</span>
              {s.lesson && <Link href={`/learn/${s.lesson}`} className="muted">{lessonTitles[s.lesson]} →</Link>}
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ takeaways + check */}
      <div className="an-grid an-grid-even">
        <section className="block" aria-labelledby="an-key-h">
          <header><span className="num">06</span><h3 id="an-key-h">Key takeaways</h3></header>
          <ul className="checks an-keys">
            {a.takeaways.map(([k, v]) => <li key={k}><b>{k}:</b> {v}</li>)}
          </ul>
          <div className="an-lessons">
            <span className="eyebrow">Go deeper</span>
            <div className="chips">
              {a.lessons.map((id) => <Link key={id} className="chip" href={`/learn/${id}`}>{lessonTitles[id]}</Link>)}
            </div>
          </div>
        </section>
        <section className="block" aria-labelledby="an-q-h">
          <header><span className="num">07</span><h3 id="an-q-h">Check yourself</h3></header>
          <div className="qlist">
            {a.quiz.map((q, i) => (
              <Mcq key={i} title={`${i + 1}. ${q.q}`} options={q.options} answer={q.answer} why={q.why} solved={false} onRight={() => {}} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
