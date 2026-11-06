"use client";

import { useEffect, useState } from "react";

/* The flight-controller mixer, top down. Pick a command and watch how one stick becomes four
   motor throttles. Pitch, roll and yaw all come from speeding some props up and slowing others —
   there is no moving control surface anywhere on the craft. */

type Cmd = "hover" | "throttle" | "pitch" | "roll" | "yaw";
type Spin = "cw" | "ccw";
interface Motor { id: number; label: string; x: number; y: number; spin: Spin; front: boolean; left: boolean }

/* Front is up the screen. Adjacent motors spin opposite ways; diagonals match. */
const MOTORS: Motor[] = [
  { id: 4, label: "FL", x: 46, y: 46, spin: "cw", front: true, left: true },
  { id: 2, label: "FR", x: 194, y: 46, spin: "ccw", front: true, left: false },
  { id: 3, label: "RL", x: 46, y: 194, spin: "ccw", front: false, left: true },
  { id: 1, label: "RR", x: 194, y: 194, spin: "cw", front: false, left: false },
];
const BASE = 0.55, D = 0.22;

function throttle(m: Motor, cmd: Cmd) {
  switch (cmd) {
    case "throttle": return BASE + D;
    case "pitch": return BASE + (m.front ? -D : D); /* nose-down → fly forward */
    case "roll": return BASE + (m.left ? D : -D); /* roll right */
    case "yaw": return BASE + (m.spin === "ccw" ? D : -D); /* net CW reaction → nose right */
    default: return BASE;
  }
}

const CMDS: { id: Cmd; label: string; stick: string }[] = [
  { id: "hover", label: "Hover", stick: "sticks centred" },
  { id: "throttle", label: "Throttle up", stick: "throttle stick up" },
  { id: "pitch", label: "Pitch forward", stick: "right stick forward" },
  { id: "roll", label: "Roll right", stick: "right stick right" },
  { id: "yaw", label: "Yaw right", stick: "left stick right" },
];

const MOTION: Record<Cmd, { kind: "none" | "lift" | "move" | "spin"; angle?: number; text: string }> = {
  hover: { kind: "none", text: "All four equal — the craft holds height and heading." },
  throttle: { kind: "lift", text: "All four rise together, so total thrust climbs and the craft lifts straight up." },
  pitch: { kind: "move", angle: -90, text: "Rear pair faster, front pair slower: the craft tips nose-down and accelerates forward." },
  roll: { kind: "move", angle: 0, text: "Left pair faster, right pair slower: the craft banks and slides to the right." },
  yaw: { kind: "spin", text: "The CCW-spinning diagonal speeds up; its reaction torque turns the craft to the right." },
};

export function DroneMixer() {
  const [cmd, setCmd] = useState<Cmd>("hover");
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSpin(true);
  }, []);

  const motion = MOTION[cmd];
  const pct = (v: number) => Math.round(v * 100);

  return (
    <div className="dr-mix">
      <svg viewBox="0 0 240 240" className="dr-quad" role="img"
        aria-label={`Quad mixer, command ${cmd}: ${MOTORS.map((m) => `${m.label} ${pct(throttle(m, cmd))} percent`).join(", ")}`}>
        {/* arms + body */}
        <g stroke="var(--line)" strokeWidth="10" strokeLinecap="round">
          <line x1="46" y1="46" x2="194" y2="194" /><line x1="194" y1="46" x2="46" y2="194" />
        </g>
        <rect x="96" y="96" width="48" height="48" rx="8" fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.3" />
        <path d="M112,112 L128,112 L120,100 Z" fill="var(--accent)" />
        <text x="120" y="134" textAnchor="middle" className="dr-q-body">FC</text>
        <text x="120" y="20" textAnchor="middle" className="dr-q-front">front ▲</text>

        {MOTORS.map((m) => {
          const v = throttle(m, cmd);
          const r = 11 + v * 20;
          const hot = v > BASE + 0.001, cold = v < BASE - 0.001;
          const col = hot ? "var(--accent)" : cold ? "var(--ph-b)" : "var(--muted)";
          return (
            <g key={m.id}>
              <circle cx={m.x} cy={m.y} r={r} fill="none" stroke={col} strokeOpacity=".3" strokeWidth="2" />
              <g className={`dr-prop2 ${spin ? "spin" : ""} ${m.spin}`} style={{ transformOrigin: `${m.x}px ${m.y}px` }}>
                <ellipse cx={m.x} cy={m.y} rx={r - 2} ry="3.2" fill={col} fillOpacity=".8" />
                <ellipse cx={m.x} cy={m.y} rx="3.2" ry={r - 2} fill={col} fillOpacity=".8" />
              </g>
              <circle cx={m.x} cy={m.y} r="7" fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.2" />
              <text x={m.x} y={m.y + 3} textAnchor="middle" className="dr-q-m">{m.id}</text>
              {/* spin direction tick */}
              <path d={m.spin === "cw"
                ? `M${m.x + 9},${m.y - 4} a6,6 0 0 1 2,8`
                : `M${m.x - 9},${m.y - 4} a6,6 0 0 0 -2,8`}
                fill="none" stroke={col} strokeWidth="1.6" markerEnd="url(#dr-sp)" />
              <text x={m.x} y={m.y + (m.front ? -r - 6 : r + 14)} textAnchor="middle" className="dr-q-pct" fill={col}>{pct(v)}%</text>
            </g>
          );
        })}

        {/* resulting motion */}
        {motion.kind === "move" && (
          <g transform={`rotate(${motion.angle} 120 120)`}>
            <line x1="120" y1="120" x2="210" y2="120" stroke="var(--accent)" strokeWidth="3" markerEnd="url(#dr-mv)" />
          </g>
        )}
        {motion.kind === "spin" && (
          <path d="M150,78 a44,44 0 1 1 -14,-20" fill="none" stroke="var(--accent)" strokeWidth="3" markerEnd="url(#dr-mv)" />
        )}
        {motion.kind === "lift" && (
          <g className="dr-lift"><circle cx="120" cy="120" r="54" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="4 6" /></g>
        )}

        <defs>
          <marker id="dr-mv" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" /></marker>
          <marker id="dr-sp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" /></marker>
        </defs>
      </svg>

      <div className="dr-mix-side">
        <div className="dr-cmds" role="group" aria-label="Pilot command">
          {CMDS.map((c) => (
            <button key={c.id} type="button" className={`dr-cmd${cmd === c.id ? " on" : ""}`} onClick={() => setCmd(c.id)} aria-pressed={cmd === c.id}>
              <b>{c.label}</b><span>{c.stick}</span>
            </button>
          ))}
        </div>
        <div className="xs-readout">
          <span className="mono">Command · {CMDS.find((c) => c.id === cmd)!.label}</span>
          <span className="muted">{motion.text}</span>
        </div>
        <ul className="dr-legend">
          <li><i style={{ background: "var(--accent)" }} />faster than hover</li>
          <li><i style={{ background: "var(--ph-b)" }} />slower than hover</li>
          <li><i className="ring" />disc size and % show each motor's throttle</li>
        </ul>
        <p className="muted xs-note">The flight controller does this mix every loop, blending real pitch, roll, yaw and throttle demands at once — not one at a time. Every motion comes from the four throttles alone.</p>
      </div>
    </div>
  );
}
