"use client";

import { useEffect, useRef, useState } from "react";

/* Front view of a 12-slot, 8-pole BLDC running six-step commutation.
   Teeth are wound A, B, C, A, B, C… Each step drives one phase positive (its teeth become N)
   and one negative (S). The rotor advances 15° mechanical per step: 60° electrical / 4 pole pairs. */

const PHASES = ["A", "B", "C"] as const;
type Ph = (typeof PHASES)[number];
const PH_COLOR: Record<Ph, string> = { A: "var(--ph-r)", B: "var(--ph-y)", C: "var(--ph-b)" };
const STEPS: [Ph, Ph][] = [["A", "B"], ["A", "C"], ["B", "C"], ["B", "A"], ["C", "A"], ["C", "B"]];
const STEP_MS = 900;

const rad = (d: number) => (d * Math.PI) / 180;
const r2 = (n: number) => Math.round(n * 100) / 100;
function seg(r1: number, r2: number, a1: number, a2: number) {
  const p = (r: number, a: number) => `${(r * Math.cos(rad(a))).toFixed(2)},${(r * Math.sin(rad(a))).toFixed(2)}`;
  return `M${p(r2, a1)} A${r2},${r2} 0 0 1 ${p(r2, a2)} L${p(r1, a2)} A${r1},${r1} 0 0 0 ${p(r1, a1)} Z`;
}

export function BldcCrossSection() {
  const [pos, setPos] = useState(0.35); /* steps elapsed, fractional */
  const [playing, setPlaying] = useState(false);
  const last = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setPlaying(true);
  }, []);
  useEffect(() => {
    if (!playing) { last.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current !== null) setPos((p) => (p + (now - last.current!) / STEP_MS) % 600);
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const k = Math.floor(pos) % 6;
  const [hi, lo] = STEPS[k];
  const rotor = 15 * pos - 7.5;
  const pole = (ph: Ph) => (ph === hi ? "N" : ph === lo ? "S" : null);

  return (
    <figure className="xs">
      <svg viewBox="-160 -160 320 320" className="xs-svg" role="img"
        aria-label={`Cross-section, step ${k + 1} of 6: phase ${hi} positive, phase ${lo} negative`}>
        <circle r="150" fill="#8d939b" stroke="#5f646c" />
        <circle r="128" fill="#9ba1a9" />
        {Array.from({ length: 12 }, (_, i) => {
          const ph = PHASES[i % 3];
          const p = pole(ph);
          const a = i * 30 - 90;
          return (
            <g key={i} transform={`rotate(${a})`}>
              <rect x="80" y="-9" width="50" height="18" fill="#7b818a" />
              <rect x="80" y="-15" width="6" height="30" rx="1" fill={p ? (p === "N" ? "#c2463b" : "#3c5bb5") : "#7b818a"} className="xs-tip" />
              <rect x="90" y="-17" width="34" height="34" rx="7" fill="url(#an-copper)" stroke={p ? PH_COLOR[ph] : "#6e3310"} strokeWidth={p ? 3 : 1}
                className={p ? "xs-coil live" : "xs-coil"} />
              <circle cx="138" cy="0" r="8" fill={PH_COLOR[ph]} opacity={p ? 1 : 0.35} />
              <text x="138" y="3.5" textAnchor="middle" transform={`rotate(${-a} 138 0)`} className="xs-ph">{ph}</text>
              {p && <text x="72" y="4" textAnchor="middle" transform={`rotate(${-a} 72 0)`} className="xs-pole">{p}</text>}
            </g>
          );
        })}
        <g transform={`rotate(${rotor})`}>
          <circle r="62" fill="#b6bbc2" stroke="#5f646c" />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <path d={seg(46, 62, i * 45 - 21, i * 45 + 21)} fill={i % 2 ? "url(#an-n)" : "url(#an-s)"} stroke="#1e2126" strokeWidth=".6" />
              <text x={r2(54 * Math.cos(rad(i * 45)))} y={r2(54 * Math.sin(rad(i * 45)) + 3.5)} textAnchor="middle" className="xs-mag"
                transform={`rotate(${r2(-rotor)} ${r2(54 * Math.cos(rad(i * 45)))} ${r2(54 * Math.sin(rad(i * 45)))})`}>{i % 2 ? "N" : "S"}</text>
            </g>
          ))}
          <circle r="16" fill="url(#an-face)" stroke="#6b7078" />
          <line x1="0" y1="0" x2="0" y2="-12" stroke="#3a3e44" strokeWidth="2" />
        </g>
        <path d="M 100 -60 A 116 116 0 0 1 116 -10" fill="none" stroke="var(--accent)" strokeWidth="2.5" markerEnd="url(#xs-arrow)" opacity=".85" />
        <defs>
          <marker id="xs-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>
      </svg>
      <figcaption className="xs-side">
        <div className="xs-readout">
          <span className="mono">Step {k + 1} of 6</span>
          <b><span style={{ color: PH_COLOR[hi] }}>{hi}+</span> → <span style={{ color: PH_COLOR[lo] }}>{lo}−</span></b>
          <span className="muted">Phase {"ABC".replace(hi, "").replace(lo, "")} floats</span>
        </div>
        <ol className="xs-steps" aria-label="Commutation sequence">
          {STEPS.map(([h, l], i) => (
            <li key={i} className={i === k ? "on" : ""}>
              <button type="button" onClick={() => { setPlaying(false); setPos(i + 0.35); }}>
                <span style={{ color: PH_COLOR[h] }}>{h}</span><span style={{ color: PH_COLOR[l] }}>{l}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn small primary" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
          <button type="button" className="btn small" onClick={() => { setPlaying(false); setPos((p) => Math.floor(p) + 1.35); }}>Next step</button>
        </div>
        <ul className="xs-legend">
          <li><i style={{ background: "#c2463b" }} />Tooth driven as N</li>
          <li><i style={{ background: "#3c5bb5" }} />Tooth driven as S</li>
          <li><i className="ring" />12 slots, 8 magnets, airgap about 0.5 mm</li>
        </ul>
        <p className="muted xs-note">Each step moves the pattern of N and S teeth by 60° electrical. With 4 pole pairs that is 15° of shaft rotation, so 24 steps make one turn.</p>
      </figcaption>
    </figure>
  );
}
