"use client";

import type { ReactNode } from "react";
import type { PartId } from "@/lib/content/anatomy";

/* Exploded view of an inrunner BLDC motor, drawn in an oblique projection along the shaft axis.
   Each circular face is drawn as a true circle inside a group squashed by K, so polar details
   (teeth, magnets, balls, bolt holes) project correctly. */

export const CY = 215;
const K = 0.3;
export const VIEW = { w: 960, h: 420 };

interface Geo { xa: number; xe: number; len: number; r: number }
/* xa: axial position when assembled, xe: when fully exploded */
export const GEO: Record<Exclude<PartId, "windings" | "shaft">, Geo> = {
  "front-cover": { xa: 250, xe: 40, len: 16, r: 118 },
  bearing: { xa: 268, xe: 165, len: 14, r: 30 },
  stator: { xa: 285, xe: 270, len: 130, r: 108 },
  rotor: { xa: 275, xe: 470, len: 150, r: 50 },
  housing: { xa: 275, xe: 640, len: 150, r: 124 },
  sensor: { xa: 430, xe: 852, len: 6, r: 78 },
  "end-cover": { xa: 436, xe: 900, len: 26, r: 108 },
};
export const xAt = (id: keyof typeof GEO, t: number) => GEO[id].xa + t * (GEO[id].xe - GEO[id].xa);

const ns = { vectorEffect: "non-scaling-stroke" } as const;

/* Side of a cylinder from x to x+len, radius r: straight top and bottom, curved far end. */
function side(x: number, len: number, r: number) {
  const rx = K * r;
  return `M${x},${CY - r} H${x + len} A${rx},${r} 0 0 1 ${x + len},${CY + r} H${x} A${rx},${r} 0 0 1 ${x},${CY - r} Z`;
}
function Face({ x, children }: { x: number; children: ReactNode }) {
  return <g transform={`translate(${x} ${CY}) scale(${K} 1)`}>{children}</g>;
}
function polar(n: number, r: number, offset = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((offset + (360 * i) / n) * Math.PI) / 180;
    return [Math.round(r * Math.cos(a) * 100) / 100, Math.round(r * Math.sin(a) * 100) / 100] as const;
  });
}
function annulus(r1: number, r2: number, a1: number, a2: number) {
  const p = (r: number, a: number) => `${(r * Math.cos((a * Math.PI) / 180)).toFixed(2)},${(r * Math.sin((a * Math.PI) / 180)).toFixed(2)}`;
  return `M${p(r2, a1)} A${r2},${r2} 0 0 1 ${p(r2, a2)} L${p(r1, a2)} A${r1},${r1} 0 0 0 ${p(r1, a1)} Z`;
}

export function Defs() {
  return (
    <defs>
      <linearGradient id="an-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f5f7" /><stop offset=".45" stopColor="#c8ccd2" /><stop offset="1" stopColor="#7f858e" />
      </linearGradient>
      <linearGradient id="an-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7a808a" /><stop offset=".4" stopColor="#40454d" /><stop offset="1" stopColor="#1f2227" />
      </linearGradient>
      <linearGradient id="an-lam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b9bec5" /><stop offset=".5" stopColor="#868c95" /><stop offset="1" stopColor="#4c5159" />
      </linearGradient>
      <linearGradient id="an-copper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6c08d" /><stop offset=".5" stopColor="#c8692a" /><stop offset="1" stopColor="#7c3a12" />
      </linearGradient>
      <linearGradient id="an-pcb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3aa35c" /><stop offset="1" stopColor="#1b5a31" />
      </linearGradient>
      <linearGradient id="an-n" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e57a6f" /><stop offset="1" stopColor="#a5302a" />
      </linearGradient>
      <linearGradient id="an-s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7f9ce6" /><stop offset="1" stopColor="#2a48a3" />
      </linearGradient>
      <linearGradient id="an-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".35" stopColor="#fff" stopOpacity="0" />
        <stop offset=".7" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" />
      </linearGradient>
      <radialGradient id="an-face" cx=".35" cy=".3" r=".9">
        <stop offset="0" stopColor="#f7f8fa" /><stop offset=".6" stopColor="#c9cdd3" /><stop offset="1" stopColor="#8e949c" />
      </radialGradient>
    </defs>
  );
}

/* ---------------------------------------------------------------- individual parts */

function FrontCover({ x }: { x: number }) {
  const g = GEO["front-cover"];
  return (
    <>
      <path d={side(x, g.len, g.r)} fill="url(#an-steel)" stroke="#6b7078" strokeWidth=".8" />
      <Face x={x}>
        <circle r={g.r} fill="url(#an-face)" stroke="#7d838b" {...ns} />
        <circle r={52} fill="#d7dade" stroke="#9aa0a7" {...ns} />
        <circle r={22} fill="#2b2e33" />
        {polar(4, 94, 45).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={8} fill="#3a3e44" />)}
      </Face>
    </>
  );
}

function Bearing({ x }: { x: number }) {
  const g = GEO.bearing;
  return (
    <>
      <path d={side(x, g.len, g.r)} fill="url(#an-steel)" stroke="#6b7078" strokeWidth=".8" />
      <Face x={x}>
        <circle r={30} fill="url(#an-face)" stroke="#6b7078" {...ns} />
        <circle r={25} fill="#4a4f57" />
        {polar(8, 21).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={4.6} fill="#eef0f3" stroke="#8a9098" {...ns} />)}
        <circle r={15} fill="#cfd3d8" stroke="#7d838b" {...ns} />
        <circle r={10} fill="#25282d" />
      </Face>
    </>
  );
}

export function Shaft({ x }: { x: number }) {
  const len = GEO.rotor.len + 150, r = 10;
  return (
    <>
      <path d={side(x, len, r)} fill="url(#an-steel)" stroke="#6b7078" strokeWidth=".8" />
      <Face x={x}><circle r={r} fill="url(#an-face)" stroke="#7d838b" {...ns} /></Face>
    </>
  );
}
export const shaftX = (t: number) => xAt("rotor", t) - 110 + (1 - t) * -10;

function Stator({ x, coils }: { x: number; coils: string }) {
  const g = GEO.stator;
  return (
    <>
      <g className="core">
        <clipPath id={`an-clip-stator-${Math.round(x * 10)}`}><path d={side(x, g.len, g.r)} /></clipPath>
        <path d={side(x, g.len, g.r)} fill="url(#an-lam)" stroke="#555a62" strokeWidth=".8" />
        <g clipPath={`url(#an-clip-stator-${Math.round(x * 10)})`} stroke="#2f3338" strokeOpacity=".22" strokeWidth="1">
          {Array.from({ length: Math.floor(g.len / 4) + 10 }, (_, i) => (
            <path key={i} d={`M${x + 4 + i * 4},${CY - g.r} A${K * g.r},${g.r} 0 0 1 ${x + 4 + i * 4},${CY + g.r}`} fill="none" />
          ))}
        </g>
        <path d={side(x, g.len, g.r)} fill="url(#an-shade)" />
      </g>
      <Face x={x}>
        <circle className="core" r={g.r} fill="#9ba1a9" stroke="#5f646c" {...ns} />
        <circle className="core" r={g.r - 18} fill="#868c94" />
        <circle r={56} fill="#2a2d32" />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <rect className="core" x={54} y={-8} width={40} height={16} fill="#7b818a" />
            <rect className="core" x={54} y={-13} width={5} height={26} fill="#7b818a" />
            <g className={coils}>
              <rect x={62} y={-14} width={28} height={28} rx={6} fill="url(#an-copper)" stroke="#6e3310" {...ns} />
              {[66, 71, 76, 81, 86].map((cx) => <line key={cx} x1={cx} y1={-13} x2={cx} y2={13} stroke="#8a4318" strokeOpacity=".7" {...ns} />)}
            </g>
          </g>
        ))}
      </Face>
    </>
  );
}

function Rotor({ x }: { x: number }) {
  const g = GEO.rotor;
  /* 8 poles; boundaries every 45°, offset so a pole faces the viewer. Visible half: −90°..90°. */
  const bands: { y1: number; y2: number; n: boolean }[] = [];
  for (let k = -3; k <= 3; k++) {
    const a1 = Math.max(-90, -22.5 + k * 45), a2 = Math.min(90, 22.5 + k * 45);
    if (a2 <= a1) continue;
    const y = (a: number) => Math.round((CY + g.r * Math.sin((a * Math.PI) / 180)) * 100) / 100;
    bands.push({ y1: y(a1), y2: y(a2), n: (k + 8) % 2 === 0 });
  }
  return (
    <>
      <clipPath id={`an-clip-rotor-${Math.round(x * 10)}`}><path d={side(x, g.len, g.r)} /></clipPath>
      <g clipPath={`url(#an-clip-rotor-${Math.round(x * 10)})`}>
        <rect x={x - 20} y={CY - g.r} width={g.len + 40} height={2 * g.r} fill="#9aa0a8" />
        {bands.map((b, i) => (
          <g key={i}>
            <rect x={x - 20} y={b.y1} width={g.len + 40} height={b.y2 - b.y1} fill={b.n ? "url(#an-n)" : "url(#an-s)"} stroke="#1e2126" strokeOpacity=".5" strokeWidth=".6" />
            {b.y2 - b.y1 > 14 && <text x={x + g.len / 2} y={(b.y1 + b.y2) / 2 + 4} textAnchor="middle" className="an-pole">{b.n ? "N" : "S"}</text>}
          </g>
        ))}
        <rect x={x - 20} y={CY - g.r} width={g.len + 40} height={2 * g.r} fill="url(#an-shade)" />
      </g>
      <path d={side(x, g.len, g.r)} fill="none" stroke="#3a3e45" strokeWidth=".8" />
      <Face x={x}>
        <circle r={g.r} fill="url(#an-face)" stroke="#6b7078" {...ns} />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={annulus(34, 50, -22.5 + i * 45, 22.5 + i * 45)} fill={i % 2 ? "#3c5bb5" : "#c2463b"} stroke="#1e2126" strokeWidth=".6" {...ns} />
        ))}
        <circle r={34} fill="#b6bbc2" />
      </Face>
    </>
  );
}

function HousingBack({ x }: { x: number }) {
  return <Face x={x}><circle r={112} fill="#181a1e" /></Face>;
}
function Housing({ x }: { x: number }) {
  const g = GEO.housing;
  const rx = K * g.r, ri = 112;
  /* body with the open front cut out (even-odd), so the stator shows through the opening */
  const body = `${side(x, g.len, g.r)} M${x},${CY - ri} A${K * ri},${ri} 0 1 0 ${x},${CY + ri} A${K * ri},${ri} 0 1 0 ${x},${CY - ri} Z`;
  const fins = [];
  for (let a = -78; a <= 78; a += 12) fins.push(Math.round((CY + g.r * Math.sin((a * Math.PI) / 180)) * 100) / 100);
  return (
    <>
      <clipPath id={`an-clip-housing-${Math.round(x * 10)}`}><path d={side(x, g.len, g.r)} /></clipPath>
      <path d={body} fill="url(#an-dark)" fillRule="evenodd" stroke="#1d2024" strokeWidth=".8" />
      <g clipPath={`url(#an-clip-housing-${Math.round(x * 10)})`}>
        {fins.map((y, i) => (
          <g key={i}>
            <line x1={x + rx * 0.9} y1={y} x2={x + g.len + rx} y2={y} stroke="#000" strokeOpacity=".45" strokeWidth="2.2" />
            <line x1={x + rx * 0.9} y1={y - 2} x2={x + g.len + rx} y2={y - 2} stroke="#fff" strokeOpacity=".16" strokeWidth="1.2" />
          </g>
        ))}
      </g>
      <Face x={x}>
        <path d={`M0,${-g.r} A${g.r},${g.r} 0 1 0 0,${g.r} A${g.r},${g.r} 0 1 0 0,${-g.r} Z M0,${-ri} A${ri},${ri} 0 1 1 0,${ri} A${ri},${ri} 0 1 1 0,${-ri} Z`}
          fill="#5d636c" fillRule="evenodd" stroke="#2a2d32" {...ns} />
      </Face>
    </>
  );
}

function Sensor({ x }: { x: number }) {
  const g = GEO.sensor;
  return (
    <>
      <path d={side(x, g.len, g.r)} fill="#1b4d2b" />
      <Face x={x}>
        <circle r={g.r} fill="url(#an-pcb)" stroke="#123b20" {...ns} />
        <circle r={g.r - 6} fill="none" stroke="#d4b25a" strokeWidth="1.2" strokeDasharray="3 5" {...ns} />
        {polar(3, 58, -90).map(([cx, cy], i) => <rect key={i} x={cx - 6} y={cy - 5} width={12} height={10} rx={1.5} fill="#111" />)}
        <rect x={-26} y={-22} width={30} height={30} rx={2} fill="#141619" />
        <rect x={12} y={6} width={18} height={12} fill="#141619" />
        <rect x={-30} y={24} width={14} height={8} fill="#c9a24a" />
        <rect x={20} y={-30} width={10} height={6} fill="#e8e1d0" />
        <circle r={16} fill="#2a2d32" />
      </Face>
    </>
  );
}

function EndCover({ x }: { x: number }) {
  const g = GEO["end-cover"];
  return (
    <>
      <path d={side(x, g.len, g.r)} fill="url(#an-steel)" stroke="#6b7078" strokeWidth=".8" />
      <Face x={x}>
        <circle r={g.r} fill="url(#an-face)" stroke="#7d838b" {...ns} />
        <circle r={44} fill="#dfe2e6" stroke="#9aa0a7" {...ns} />
        <circle r={18} fill="#b3b8bf" stroke="#7d838b" {...ns} />
        {polar(4, 88, 45).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={7} fill="#3a3e44" />)}
      </Face>
    </>
  );
}

/* ---------------------------------------------------------------- the full scene */

interface Label { id: PartId; text: string; sub?: string; ax: number; ay: number; lx: number; ly: number; anchor?: "start" | "middle" | "end"; below?: boolean }
/* Positions for the fully exploded view; labels fade in as the motor comes apart. */
const LABELS: Label[] = [
  { id: "front-cover", text: "Front end cover", ax: 48, ay: 97, lx: 14, ly: 40, anchor: "start" },
  { id: "bearing", text: "Bearing", ax: 172, ay: 245, lx: 172, ly: 312, below: true },
  { id: "windings", text: "Windings", sub: "3-phase copper", ax: 262, ay: 292, lx: 200, ly: 372, below: true },
  { id: "stator", text: "Stator", sub: "laminated core", ax: 335, ay: 107, lx: 335, ly: 40 },
  { id: "shaft", text: "Shaft", ax: 440, ay: 225, lx: 440, ly: 312, below: true },
  { id: "rotor", text: "Rotor", sub: "permanent magnets", ax: 545, ay: 165, lx: 535, ly: 62 },
  { id: "housing", text: "Housing", sub: "finned frame", ax: 715, ay: 91, lx: 715, ly: 40 },
  { id: "sensor", text: "Position sensor", sub: "Hall board", ax: 855, ay: 293, lx: 830, ly: 372, below: true },
  { id: "end-cover", text: "Rear end cover", ax: 913, ay: 107, lx: 952, ly: 40, anchor: "end" },
];

interface SceneProps {
  t: number;
  active: PartId[];
  onEnter: (id: PartId | null) => void;
  onPick: (id: PartId) => void;
}

export function BldcScene({ t, active, onEnter, onPick }: SceneProps) {
  const any = active.length > 0;
  const state = (id: PartId) => (!any ? "" : active.includes(id) ? "on" : "dim");
  const statorState = !any ? "" : active.includes("stator") ? "on" : active.includes("windings") ? "wonly" : "dim";
  const part = (id: PartId, name: string, node: ReactNode, cls?: string) => (
    <g key={id} className={`ap ${cls ?? state(id)}`} tabIndex={0} role="button" aria-label={name}
      onMouseEnter={() => onEnter(id)} onMouseLeave={() => onEnter(null)} onFocus={() => onEnter(id)} onBlur={() => onEnter(null)}
      onClick={(e) => { e.stopPropagation(); onPick(id); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); } }}>
      {node}
    </g>
  );
  const labelOpacity = Math.max(0, Math.min(1, (t - 0.65) / 0.3));
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="an-scene" role="group" aria-label="Exploded view of a brushless DC motor">
      <Defs />
      <line x1="10" y1={CY} x2={VIEW.w - 10} y2={CY} stroke="var(--line)" strokeDasharray="2 6" />
      {part("end-cover", "Rear end cover", <EndCover x={xAt("end-cover", t)} />)}
      {part("sensor", "Position sensor", <Sensor x={xAt("sensor", t)} />)}
      <g className={`ap ${state("housing")}`} aria-hidden="true"><HousingBack x={xAt("housing", t)} /></g>
      {part("shaft", "Shaft", <Shaft x={shaftX(t)} />)}
      {part("rotor", "Rotor", <Rotor x={xAt("rotor", t)} />)}
      {part("stator", "Stator and windings", <Stator x={xAt("stator", t)} coils={`coils ${active.includes("windings") ? "on" : ""}`} />, statorState)}
      {part("housing", "Housing", <Housing x={xAt("housing", t)} />)}
      {part("bearing", "Bearing", <Bearing x={xAt("bearing", t)} />)}
      {part("front-cover", "Front end cover", <FrontCover x={xAt("front-cover", t)} />)}
      <g className="an-labels" style={{ opacity: labelOpacity }} aria-hidden={labelOpacity < 0.5}>
        {LABELS.map((l) => {
          const on = active.includes(l.id);
          const y2 = l.below ? l.ly - 15 : l.ly + (l.sub ? 22 : 8);
          return (
            <g key={l.id} className={`an-label${on ? " on" : ""}`} onMouseEnter={() => onEnter(l.id)} onMouseLeave={() => onEnter(null)} onClick={() => onPick(l.id)}>
              <line x1={l.ax} y1={l.ay} x2={l.ax} y2={y2} />
              <circle cx={l.ax} cy={l.ay} r="2.5" />
              <text x={l.lx} y={l.ly} textAnchor={l.anchor ?? "middle"} className="an-name">{l.text}</text>
              {l.sub && <text x={l.lx} y={l.ly + 15} textAnchor={l.anchor ?? "middle"} className="an-sub">{l.sub}</text>}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* Small standalone picture of one part, for the parts list. */
export function PartIcon({ id }: { id: PartId }) {
  const box = (x0: number, w: number, r: number) => `${x0} ${CY - r - 4} ${w} ${2 * r + 8}`;
  const icon: Record<PartId, { vb: string; node: ReactNode }> = {
    "front-cover": { vb: box(0, 80, 118), node: <FrontCover x={40} /> },
    bearing: { vb: box(150, 50, 30), node: <Bearing x={165} /> },
    shaft: { vb: `90 ${CY - 30} 330 60`, node: <Shaft x={100} /> },
    stator: { vb: box(230, 220, 108), node: <Stator x={270} coils="coils" /> },
    windings: {
      vb: "-40 -40 80 80",
      node: (
        <g>
          <rect x={-9} y={-38} width={18} height={76} fill="#7b818a" />
          <rect x={-24} y={-26} width={48} height={52} rx={9} fill="url(#an-copper)" stroke="#6e3310" />
          {[-18, -11, -4, 3, 10, 17].map((cy) => <line key={cy} x1={-23} y1={cy} x2={23} y2={cy} stroke="#8a4318" strokeOpacity=".7" />)}
        </g>
      ),
    },
    rotor: { vb: box(450, 200, 50), node: <Rotor x={470} /> },
    housing: { vb: box(595, 220, 124), node: <><HousingBack x={640} /><Housing x={640} /></> },
    sensor: { vb: box(822, 50, 78), node: <Sensor x={852} /> },
    "end-cover": { vb: box(865, 80, 108), node: <EndCover x={900} /> },
  };
  const { vb, node } = icon[id];
  return <svg viewBox={vb} className="an-icon" aria-hidden="true" preserveAspectRatio="xMidYMid meet">{node}</svg>;
}
