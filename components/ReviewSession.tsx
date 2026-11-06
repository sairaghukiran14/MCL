"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findLesson } from "@/lib/content";
import type { Lesson } from "@/lib/content/types";
import { INTERVALS, today, useProgress } from "./ProgressProvider";

const SESSION_MAX = 20;

interface Item { id: string; retry: boolean }
interface Parsed { kind: "q" | "c" | "d"; lesson: Lesson; track: string; index: number }

function parse(id: string): Parsed | null {
  const [kind, lessonId, idx] = id.split(":");
  const r = findLesson(lessonId);
  if (!r || (kind !== "q" && kind !== "c" && kind !== "d")) return null;
  const index = Number(idx ?? 0);
  if (kind === "q" && !r.lesson.quiz[index]) return null;
  if (kind === "c" && !r.lesson.challenges[index]) return null;
  return { kind, lesson: r.lesson, track: r.track.code, index };
}

/* Fixed shuffle per card and session, so answer positions can't be memorised. */
function order(n: number, seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export function ReviewSession() {
  const p = useProgress();
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; from: number; to: number } | null>(null);
  const [firstTry, setFirstTry] = useState(0);
  const [seed] = useState(() => String(Date.now()));

  useEffect(() => {
    if (p.ready && queue === null) {
      setQueue(p.due.filter((id) => parse(id)).slice(0, SESSION_MAX).map((id) => ({ id, retry: false })));
    }
  }, [p.ready, p.due, queue]);

  const counts = useMemo(() => {
    const boxes = [0, 0, 0, 0, 0, 0];
    let next = Infinity;
    const t = today();
    for (const c of Object.values(p.state.cards)) {
      boxes[c.box]++;
      if (c.due > t) next = Math.min(next, c.due);
    }
    return { boxes, total: Object.keys(p.state.cards).length, nextIn: Number.isFinite(next) ? next - t : null };
  }, [p.state.cards]);

  if (!p.ready || queue === null) return <p className="muted">Loading your cards…</p>;

  const item = queue[pos];
  const answer = (ok: boolean) => {
    if (result) return;
    const from = p.state.cards[item.id]?.box ?? 1;
    setResult({ ok, from, to: ok ? Math.min(5, from + 1) : 1 });
    if (!item.retry) {
      p.review(item.id, ok);
      if (ok) setFirstTry((n) => n + 1);
    }
    if (!ok) setQueue((q) => (q ? [...q, { id: item.id, retry: true }] : q));
  };
  const next = () => { setResult(null); setPos((n) => n + 1); };

  if (queue.length === 0) {
    return (
      <div className="review-empty block">
        <h3>{counts.total === 0 ? "No cards yet" : "Nothing due today"}</h3>
        <p className="muted">
          {counts.total === 0
            ? "Every quiz question, challenge and debug case you solve becomes a review card. Solve a few in any lesson and they start coming back tomorrow."
            : `You have ${counts.total} cards. The next ones are due ${counts.nextIn === 1 ? "tomorrow" : `in ${counts.nextIn} days`}.`}
        </p>
        <BoxBar boxes={counts.boxes} total={counts.total} />
        <div className="btn-row"><Link className="btn primary" href="/#tracks">Go to the lessons</Link></div>
      </div>
    );
  }

  if (!item) {
    const firstCount = queue.filter((i) => !i.retry).length;
    return (
      <div className="review-empty block">
        <h3>Session done</h3>
        <p className="muted">
          {firstTry} of {firstCount} right on the first try. Cards you got right move up a box and come back later.
          Cards you missed went back to box 1 and return tomorrow.
        </p>
        <BoxBar boxes={counts.boxes} total={counts.total} />
        <div className="btn-row">
          {p.due.length > 0 && <button type="button" className="btn primary" onClick={() => { setQueue(null); setPos(0); setFirstTry(0); }}>Review {Math.min(p.due.length, SESSION_MAX)} more</button>}
          <Link className="btn" href="/">Back to home</Link>
        </div>
      </div>
    );
  }

  const c = parse(item.id)!;
  const card = p.state.cards[item.id];
  const firstTotal = queue.filter((i) => !i.retry).length;
  const done = Math.min(pos, firstTotal);
  return (
    <div className="review">
      <div className="review-progress">
        <span>{done} of {firstTotal}{queue.length > firstTotal ? ` · ${queue.length - firstTotal} to retry` : ""}</span>
        <div className="pbar big"><i style={{ width: `${(100 * pos) / queue.length}%` }} /></div>
      </div>
      <article className="block review-card" key={`${item.id}-${pos}`}>
        <header>
          <span className="num">{c.track}</span>
          <Link href={`/learn/${c.lesson.id}`} className="review-src">{c.lesson.title}</Link>
          <span className="hint-xp">
            {item.retry ? "retry" : result ? `box ${result.from} → ${result.to}` : `box ${card?.box ?? 1}`}
          </span>
        </header>
        {c.kind === "c"
          ? <ChallengeCard lesson={c.lesson} index={c.index} result={result} onAnswer={answer} />
          : <ChoiceCard lesson={c.lesson} kind={c.kind} index={c.index} seed={seed + item.id + pos} result={result} onAnswer={answer} />}
        {result && (
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={next}>
              {pos + 1 < queue.length ? "Next card" : "Finish"}
            </button>
            {!item.retry && <span className="muted review-when">{result.ok ? `Back in ${INTERVALS[result.to]} days` : "Back tomorrow, and once more at the end of this session"}</span>}
          </div>
        )}
      </article>
    </div>
  );
}

function ChoiceCard({ lesson, kind, index, seed, result, onAnswer }: {
  lesson: Lesson; kind: "q" | "d"; index: number; seed: string; result: { ok: boolean } | null; onAnswer: (ok: boolean) => void;
}) {
  const src = kind === "q" ? lesson.quiz[index] : lesson.debug;
  const [picked, setPicked] = useState<number | null>(null);
  const ord = useMemo(() => order(src.options.length, seed), [src.options.length, seed]);
  return (
    <div className="q">
      {kind === "q"
        ? <p dangerouslySetInnerHTML={{ __html: lesson.quiz[index].q }} />
        : <>
            <div className="scenario"><b>Symptom</b><span dangerouslySetInnerHTML={{ __html: lesson.debug.scenario }} /></div>
            {lesson.debug.code && <pre className="code" dangerouslySetInnerHTML={{ __html: lesson.debug.code }} />}
            <p>What is the root cause?</p>
          </>}
      <div className="opts">
        {ord.map((oi, k) => (
          <button key={oi} type="button" disabled={!!result}
            className={`opt${result && oi === src.answer ? " right" : ""}${result && picked === oi && oi !== src.answer ? " wrong" : ""}`}
            onClick={() => { setPicked(oi); onAnswer(oi === src.answer); }}>
            <span className="k">{"ABCD"[k]}</span>
            <span dangerouslySetInnerHTML={{ __html: src.options[oi] }} />
          </button>
        ))}
      </div>
      {result && <div className={`why${result.ok ? "" : " no"}`}><b>{result.ok ? "Correct." : "Not this time."}</b> <span dangerouslySetInnerHTML={{ __html: src.why }} /></div>}
    </div>
  );
}

function ChallengeCard({ lesson, index, result, onAnswer }: {
  lesson: Lesson; index: number; result: { ok: boolean } | null; onAnswer: (ok: boolean) => void;
}) {
  const item = lesson.challenges[index];
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const check = () => {
    const v = parseFloat(value.replace(/,/g, ""));
    if (Number.isNaN(v)) { setErr("Enter a number"); return; }
    const tol = item.tol === 0 ? 0.5 : Math.max(Math.abs(item.answer) * item.tol, 1e-6);
    onAnswer(Math.abs(v - item.answer) <= tol);
  };
  return (
    <div className="q">
      <p dangerouslySetInnerHTML={{ __html: item.q }} />
      <div className="answer-row">
        <input id={`rv-${lesson.id}-${index}`} inputMode="decimal" aria-label="Your answer" placeholder="your answer"
          value={value} disabled={!!result} autoFocus
          onChange={(e) => { setValue(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }} />
        <span className="unit">{item.unit}</span>
        <button type="button" className="btn small primary" onClick={check} disabled={!!result}>Check</button>
        <button type="button" className="btn small" onClick={() => onAnswer(false)} disabled={!!result}>I don't remember</button>
        {err && <span className="status no">{err}</span>}
      </div>
      {result && <div className={`why${result.ok ? "" : " no"}`}><b>{result.ok ? "Correct." : `Answer: ${item.answer} ${item.unit}.`}</b> <span dangerouslySetInnerHTML={{ __html: item.solution }} /></div>}
    </div>
  );
}

function BoxBar({ boxes, total }: { boxes: number[]; total: number }) {
  if (!total) return null;
  const names = ["", "1 day", "3 days", "1 week", "3 weeks", "2 months"];
  return (
    <div className="boxbar">
      {[1, 2, 3, 4, 5].map((b) => (
        <div key={b} className={`boxcol b${b}`}>
          <b>{boxes[b]}</b>
          <span>box {b}</span>
          <span className="muted">{names[b]}</span>
        </div>
      ))}
    </div>
  );
}
