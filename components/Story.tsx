"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fitCanvas, reducedMotion, themeColors } from "@/lib/sim/runtime";
import { STORY_DRAW } from "@/lib/sim/stories";
import { findExplainer } from "@/lib/content/explainers";
import { useProgress } from "./ProgressProvider";

const STEP_SECONDS = 7;

/** Animated, step-by-step explainer: canvas + caption + transport controls. */
export function Story({ id, compact = false }: { id: string; compact?: boolean }) {
  const ex = findExplainer(id)!;
  const { mark } = useProgress();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const state = useRef({ step: 0, stepStart: 0, t0: 0, playing: false });
  const n = ex.steps.length;

  const go = useCallback((k: number) => {
    const next = Math.max(0, Math.min(n - 1, k));
    state.current.step = next;
    state.current.stepStart = performance.now();
    setStep(next);
    setProgress(0);
    if (next === n - 1) mark("x", id);
  }, [n, id, mark]);

  useEffect(() => {
    state.current.playing = playing;
    if (playing) state.current.stepStart = performance.now() - progress * STEP_SECONDS * 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => { if (!reducedMotion()) setPlaying(!compact); }, [compact]);

  useEffect(() => {
    const draw = STORY_DRAW[id];
    const s = state.current;
    s.t0 = performance.now(); s.stepStart = performance.now();
    let raf = 0, lastP = -1;
    const frame = (now: number) => {
      const el = cv.current;
      if (el) {
        const C = themeColors();
        const { ctx, w, h } = fitCanvas(el);
        const st = (now - s.stepStart) / 1000;
        draw(ctx, w, h, { step: s.step, st, t: (now - s.t0) / 1000 }, C);
        const p = Math.min(1, st / STEP_SECONDS);
        if (s.playing && Math.abs(p - lastP) > 0.01) { lastP = p; setProgress(p); }
        if (s.playing && st > STEP_SECONDS) {
          if (s.step < n - 1) go(s.step + 1);
          else { s.playing = false; setPlaying(false); }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [id, n, go]);

  const cur = ex.steps[step];
  return (
    <div className={`story${compact ? " compact" : ""}`}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(step + 1); if (e.key === "ArrowLeft") go(step - 1); }}>
      <div className="story-stage">
        <canvas ref={cv} aria-label={`${ex.title}, step ${step + 1}: ${cur.title}`} />
      </div>
      <div className="story-caption" aria-live="polite">
        <span className="story-step">Step {step + 1} of {n}</span>
        <h3>{cur.title}</h3>
        <p>{cur.text}</p>
      </div>
      <div className="story-controls">
        <button type="button" className="btn small" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step">←</button>
        <button type="button" className="btn small primary" onClick={() => {
          if (!playing && step === n - 1 && progress >= 1) go(0);
          setPlaying((p) => !p);
        }}>{playing ? "Pause" : step === n - 1 && progress >= 1 ? "Replay" : "Play"}</button>
        <button type="button" className="btn small" onClick={() => go(step + 1)} disabled={step === n - 1} aria-label="Next step">→</button>
        <div className="story-dots" role="tablist" aria-label="Steps">
          {ex.steps.map((s, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === step} title={s.title}
              className={i < step ? "done" : i === step ? "on" : ""} onClick={() => go(i)}>
              {i === step && <i style={{ width: `${progress * 100}%` }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
