"use client";

import { useEffect, useRef, useState } from "react";

/* The six-switch bridge cycling through its eight switching states.
   A digit per leg: 1 = upper switch on (phase tied to +), 0 = lower switch on (phase tied to −).
   The six active states are the corners of the space-vector hexagon; 000 and 111 sit at its centre. */

type Bits = [0 | 1, 0 | 1, 0 | 1];
const ACTIVE: Bits[] = [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1], [1, 0, 1]];
const ZERO: Bits[] = [[0, 0, 0], [1, 1, 1]];
const VDC = 48;
const PH = ["A", "B", "C"] as const;
const PH_COLOR = ["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"];
const LEG_X = [140, 215, 290];
const MID_Y = [120, 135, 150];
const STEP_MS = 1100;

const code = (b: Bits) => b.join("");
const r2 = (n: number) => Math.round(n * 100) / 100;
const isZero = (b: Bits) => b[0] === b[1] && b[1] === b[2];

function phaseVolts(b: Bits) {
  const vn = ((b[0] + b[1] + b[2]) / 3) * VDC;
  return b.map((x) => x * VDC - vn);
}

function Switch({ x, y, on, name }: { x: number; y: number; on: boolean; name: string }) {
  return (
    <g className={`iv-sw${on ? " on" : ""}`}>
      <rect x={x - 17} y={y} width={34} height={40} rx={6} />
      <circle cx={x} cy={y + 8} r="2.2" />
      <circle cx={x} cy={y + 32} r="2.2" />
      {on ? <line x1={x} y1={y + 8} x2={x} y2={y + 32} /> : <line x1={x} y1={y + 8} x2={x + 11} y2={y + 28} />}
      <text x={x + 21} y={y + 24} className="iv-swname">{name}</text>
    </g>
  );
}

export function InverterLive() {
  const [state, setState] = useState<Bits>(ACTIVE[0]);
  const [playing, setPlaying] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      idx.current = (idx.current + 1) % 6;
      setState(ACTIVE[idx.current]);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const pick = (b: Bits) => {
    setPlaying(false);
    const i = ACTIVE.findIndex((a) => code(a) === code(b));
    if (i >= 0) idx.current = i;
    setState(b);
  };
  const zero = isZero(state);
  const v = phaseVolts(state);
  const live = (cond: boolean, rev = false) => (cond ? `iv-w live${rev ? " rev" : ""}` : "iv-w");

  /* hop over a vertical wire at x when running horizontally at y */
  const lane = (k: number) => {
    const y = MID_Y[k];
    let d = `M${LEG_X[k]},${y}`;
    for (let j = k + 1; j < 3; j++) d += ` H${LEG_X[j] - 6} a6,6 0 0 1 12,0`;
    return `${d} H360`;
  };
  const coil = (k: number) => {
    const y = MID_Y[k];
    let d = `M360,${y}`;
    for (let i = 0; i < 4; i++) d += ` a6,6 0 0 1 12,0`;
    return `${d} L452,135`;
  };

  return (
    <div className="iv-live">
      <svg viewBox="0 0 480 270" className="iv-circuit" role="img"
        aria-label={`Switching state ${code(state)}: ${state.map((b, i) => `${PH[i]} ${b ? "high" : "low"}`).join(", ")}`}>
        {/* DC link */}
        <path d="M30,30 H300" className={live(!zero)} />
        <path d="M30,240 H300" className={live(!zero, true)} />
        <path d="M30,30 V122 M30,148 V240" className="iv-w" />
        <path d="M16,122 H44 M16,132 H44" className="iv-cap" />
        <path d="M22,140 q8,-6 16,0" className="iv-cap" fill="none" />
        <text x="50" y="128" className="iv-t">DC link</text>
        <text x="50" y="142" className="iv-s">{VDC} V</text>
        <text x="36" y="22" className="iv-s">+</text>
        <text x="36" y="258" className="iv-s">−</text>

        {LEG_X.map((x, k) => {
          const hi = state[k] === 1;
          return (
            <g key={k}>
              <path d={`M${x},30 V55`} className={live(hi && !zero)} />
              <path d={`M${x},95 V${MID_Y[k]}`} className={live(hi)} />
              <path d={`M${x},${MID_Y[k]} V175`} className={live(!hi)} />
              <path d={`M${x},215 V240`} className={live(!hi && !zero)} />
              <Switch x={x} y={55} on={hi} name={`${PH[k]}↑`} />
              <Switch x={x} y={175} on={!hi} name={`${PH[k]}↓`} />
              <circle cx={x} cy={MID_Y[k]} r="3.5" fill={PH_COLOR[k]} />
              <path d={lane(k)} className={live(true, !hi)} style={{ stroke: PH_COLOR[k] }} />
              <path d={coil(k)} fill="none" stroke={PH_COLOR[k]} strokeWidth="2" />
              <text x={352} y={MID_Y[k] - 5} textAnchor="end" className="iv-ph" fill={PH_COLOR[k]}>{PH[k]}</text>
            </g>
          );
        })}
        <circle cx="452" cy="135" r="3.5" fill="var(--ink)" />
        <text x="410" y="190" textAnchor="middle" className="iv-s">motor windings</text>
      </svg>

      <div className="iv-under">
        <svg viewBox="0 0 180 170" className="iv-hex" role="group" aria-label="Space-vector hexagon">
          {(() => {
            const cx = 90, cy = 85, R = 62;
            const vtx = ACTIVE.map((_, i) => [r2(cx + R * Math.cos((i * Math.PI) / 3)), r2(cy - R * Math.sin((i * Math.PI) / 3))] as const);
            const ai = ACTIVE.findIndex((a) => code(a) === code(state));
            return (
              <>
                <polygon points={vtx.map((p) => p.join(",")).join(" ")} fill="var(--bg)" stroke="var(--line)" />
                <circle cx={cx} cy={cy} r={R * 0.866} fill="none" stroke="var(--muted)" strokeDasharray="3 4" opacity=".6" />
                {ai >= 0 && <line x1={cx} y1={cy} x2={vtx[ai][0]} y2={vtx[ai][1]} stroke="var(--accent)" strokeWidth="3" markerEnd="url(#iv-arrow)" />}
                <defs>
                  <marker id="iv-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" /></marker>
                </defs>
                {ACTIVE.map((a, i) => {
                  const [x, y] = vtx[i];
                  const lx = r2(cx + (R + 15) * Math.cos((i * Math.PI) / 3)), ly = r2(cy - (R + 15) * Math.sin((i * Math.PI) / 3));
                  return (
                    <g key={i} className={`iv-vtx${i === ai ? " on" : ""}`} onClick={() => pick(a)} role="button" tabIndex={0}
                      aria-label={`State ${code(a)}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(a); } }}>
                      <circle cx={x} cy={y} r="6" />
                      <text x={lx} y={ly + 4} textAnchor="middle">{code(a)}</text>
                    </g>
                  );
                })}
                <g className={`iv-vtx${zero ? " on" : ""}`} onClick={() => pick(state[0] ? ZERO[0] : ZERO[1])} role="button" tabIndex={0} aria-label="Zero state"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(ZERO[0]); } }}>
                  <circle cx={cx} cy={cy} r="6" />
                  <text x={cx} y={cy + 20} textAnchor="middle">000 · 111</text>
                </g>
              </>
            );
          })()}
        </svg>

        <div className="iv-read">
          <div className="xs-readout">
            <span className="mono">State {code(state)}</span>
            <b>{state.map((b, k) => <span key={k} style={{ color: PH_COLOR[k] }}>{PH[k]}{b ? "+" : "−"} </span>)}</b>
            <span className="muted">
              {zero ? "Zero state: every phase on the same rail. Motor current freewheels through the switches and no current is drawn from the battery."
                : `Current flows from + into ${PH.filter((_, k) => state[k]).join(" and ")} and returns through ${PH.filter((_, k) => !state[k]).join(" and ")}.`}
            </span>
          </div>
          <div className="iv-volts">
            {v.map((x, k) => (
              <span key={k}><i style={{ color: PH_COLOR[k] }}>V{PH[k].toLowerCase()}</i> {x > 0 ? "+" : x < 0 ? "−" : ""}{Math.abs(x).toFixed(0)} V</span>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn small primary" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
            <button type="button" className="btn small" onClick={() => { setPlaying(false); idx.current = (idx.current + 1) % 6; setState(ACTIVE[idx.current]); }}>Next state</button>
            <button type="button" className="btn small" onClick={() => pick(ZERO[0])}>Zero state</button>
          </div>
          <p className="muted xs-note">
            Six-step drive uses these six states in turn. SVPWM blends the two neighbouring states and a zero state inside every 50 µs period,
            so the voltage vector can point anywhere inside the dashed circle, not just at the corners.
          </p>
        </div>
      </div>
    </div>
  );
}
