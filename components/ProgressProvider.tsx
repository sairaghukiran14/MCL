"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRACKS, MISSIONS, ALL_LESSONS } from "@/lib/content";
import { PROJECTS, projectsForLesson } from "@/lib/content/projects";
import { EXPLAINERS } from "@/lib/content/explainers";
import type { Lesson } from "@/lib/content/types";

/* q quiz · c challenge · d debug · w proof of work · m lab mission · p project step · x explainer finished
   k worked example finished · s lesson opened · a project acceptance check */
export type Kind = "q" | "c" | "d" | "w" | "m" | "p" | "x" | "k" | "s" | "a";
const KINDS: Kind[] = ["q", "c", "d", "w", "m", "p", "x", "k", "s", "a"];
type Marks = Record<Kind, Record<string, 1>>;

/* Review cards use Leitner boxes 1–5. `due` is a local day number (see today()). */
export interface Card { box: number; due: number; lapses: number }
interface State extends Marks { cards: Record<string, Card>; last?: string }

const emptyMarks = (): Marks => Object.fromEntries(KINDS.map((k) => [k, {}])) as unknown as Marks;
const EMPTY: State = { ...emptyMarks(), cards: {} };
const STORE = "emk-progress-v3";
const OLD_STORE = "emk-progress-v2";
export const XP: Record<Kind, number> = { q: 10, c: 25, d: 20, w: 50, m: 40, p: 15, x: 15, k: 10, s: 0, a: 0 };
/* Days until a card comes back, by the box it has just moved into. */
export const INTERVALS = [0, 1, 3, 7, 21, 60];

export function today(): number {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

/* Card ids: q:<lesson>:<i>, c:<lesson>:<i>, d:<lesson>. Progress keys stay <lesson>:<i> and <lesson>. */
const cardFor = (k: Kind, key: string): string | null => (k === "q" || k === "c" || k === "d" ? `${k}:${key}` : null);
export const lessonCards = (l: Lesson): string[] => [
  ...l.quiz.map((_, i) => `q:${l.id}:${i}`),
  ...l.challenges.map((_, i) => `c:${l.id}:${i}`),
  `d:${l.id}`,
];

export interface LessonStats {
  qd: number; cd: number; dd: number; wd: number; done: number; total: number;
  complete: boolean; started: boolean;
}

/* Mastery is derived from progress, never stored. */
export type MasteryLevel = 0 | 1 | 2 | 3 | 4;
export const MASTERY_LABEL = ["Not started", "Seen", "Practised", "Applied", "Mastered"] as const;
export interface Mastery { level: MasteryLevel; label: string; next: string }

export function xpMax(): number {
  let s = 0;
  for (const l of ALL_LESSONS) s += l.quiz.length * XP.q + l.challenges.length * XP.c + XP.d + XP.w + (l.worked ? XP.k : 0);
  for (const pr of PROJECTS) s += pr.steps.length * XP.p;
  return s + MISSIONS.length * XP.m + EXPLAINERS.length * XP.x;
}

function load(): State {
  const parse = (raw: string | null) => (raw ? (JSON.parse(raw) as Partial<State>) : null);
  const v3 = parse(localStorage.getItem(STORE));
  if (v3) return { ...EMPTY, ...v3, cards: v3.cards ?? {} };
  const v2 = parse(localStorage.getItem(OLD_STORE));
  if (!v2) return EMPTY;
  /* Migrate: every solved quiz, challenge and debug case becomes a card, due today. */
  const s: State = { ...EMPTY, ...v2, cards: {} };
  const t = today();
  for (const k of ["q", "c", "d"] as Kind[]) {
    for (const key of Object.keys(s[k] ?? {})) s.cards[`${k}:${key}`] = { box: 1, due: t, lapses: 0 };
  }
  localStorage.setItem(STORE, JSON.stringify(s));
  return s;
}

interface Ctx {
  state: State;
  ready: boolean;
  has: (k: Kind, key: string) => boolean;
  mark: (k: Kind, key: string) => void;
  unmark: (k: Kind, key: string) => void;
  visit: (lessonId: string) => void;
  review: (cardId: string, ok: boolean) => void;
  due: string[];
  reset: () => void;
  xp: number;
  stats: (l: Lesson) => LessonStats;
  mastery: (l: Lesson) => Mastery;
}
const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setState(load()); } catch {}
    setReady(true);
  }, []);

  const update = useCallback((fn: (prev: State) => State) => {
    setState((prev) => {
      const next = fn(prev);
      if (next !== prev) { try { localStorage.setItem(STORE, JSON.stringify(next)); } catch {} }
      return next;
    });
  }, []);

  const has = useCallback((k: Kind, key: string) => !!state[k][key], [state]);
  const mark = useCallback((k: Kind, key: string) => update((prev) => {
    if (prev[k][key]) return prev;
    const next: State = { ...prev, [k]: { ...prev[k], [key]: 1 as const } };
    const cid = cardFor(k, key);
    if (cid && !prev.cards[cid]) next.cards = { ...prev.cards, [cid]: { box: 1, due: today() + INTERVALS[1], lapses: 0 } };
    return next;
  }), [update]);
  const unmark = useCallback((k: Kind, key: string) => update((prev) => {
    if (!prev[k][key]) return prev;
    const rest = { ...prev[k] };
    delete rest[key];
    return { ...prev, [k]: rest };
  }), [update]);
  const visit = useCallback((lessonId: string) => update((prev) => {
    if (prev.s[lessonId] && prev.last === lessonId) return prev;
    return { ...prev, s: { ...prev.s, [lessonId]: 1 as const }, last: lessonId };
  }), [update]);
  const review = useCallback((cardId: string, ok: boolean) => update((prev) => {
    const c = prev.cards[cardId] ?? { box: 1, due: today(), lapses: 0 };
    const box = ok ? Math.min(5, c.box + 1) : 1;
    const card: Card = { box, due: today() + INTERVALS[box], lapses: c.lapses + (ok ? 0 : 1) };
    return { ...prev, cards: { ...prev.cards, [cardId]: card } };
  }), [update]);
  const reset = useCallback(() => update(() => EMPTY), [update]);

  const due = useMemo(() => {
    const t = today();
    return Object.entries(state.cards)
      .filter(([, c]) => c.due <= t)
      .sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box)
      .map(([id]) => id);
  }, [state.cards]);

  const xp = useMemo(
    () => KINDS.reduce((s, k) => s + Object.keys(state[k]).length * XP[k], 0),
    [state],
  );
  const stats = useCallback((l: Lesson): LessonStats => {
    const qd = l.quiz.filter((_, i) => state.q[`${l.id}:${i}`]).length;
    const cd = l.challenges.filter((_, i) => state.c[`${l.id}:${i}`]).length;
    const dd = state.d[l.id] ? 1 : 0;
    const wd = state.w[l.id] ? 1 : 0;
    const total = l.quiz.length + l.challenges.length + 2;
    const done = qd + cd + dd + wd;
    return { qd, cd, dd, wd, done, total, complete: done === total, started: done > 0 };
  }, [state]);

  const mastery = useCallback((l: Lesson): Mastery => {
    const s = stats(l);
    const seen = !!state.s[l.id] || s.started;
    const practised = s.qd >= Math.ceil(0.8 * l.quiz.length) && s.cd === l.challenges.length && s.dd === 1;
    const projectDone = projectsForLesson(l.id).some((p) => p.steps.every((_, i) => state.p[`${p.id}:${i}`]));
    const applied = practised && (s.wd === 1 || projectDone);
    const ids = lessonCards(l);
    const retained = ids.filter((id) => (state.cards[id]?.box ?? 0) >= 4).length;
    const mastered = applied && retained === ids.length;
    const level: MasteryLevel = mastered ? 4 : applied ? 3 : practised ? 2 : seen ? 1 : 0;
    const next = [
      "Open the lesson to start.",
      "Get 80% of the quiz, every challenge and the debug case right to reach Practised.",
      "Finish the proof of work or a linked project to reach Applied.",
      `Keep reviewing: ${retained} of ${ids.length} review cards have lasted three weeks. All of them makes it Mastered.`,
      "Mastered. Its cards still come back every couple of months.",
    ][level];
    return { level, label: MASTERY_LABEL[level], next };
  }, [state, stats]);

  const value = useMemo(
    () => ({ state, ready, has, mark, unmark, visit, review, due, reset, xp, stats, mastery }),
    [state, ready, has, mark, unmark, visit, review, due, reset, xp, stats, mastery],
  );
  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error("useProgress must be used inside ProgressProvider");
  return c;
}

export { TRACKS };
