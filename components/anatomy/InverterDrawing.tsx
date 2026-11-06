"use client";

import type { ReactNode } from "react";
import type { PartId } from "@/lib/content/anatomy";
import type { SceneProps } from "./kits";

/* Exploded isometric stack of a 48 V three-phase motor inverter.
   Board coordinates: x along the long edge (0..W), y across (0..D), z up.
   Layers come apart diagonally (up and to the right) so each one's front edge stays visible. */

const C = 0.866, S = 0.3, W = 220, D = 150;
const VIEW = { w: 960, h: 650 };
const OY = 490;

interface O { ox: number; oy: number }
type Pt = [number, number];
const P = (o: O, x: number, y: number, z: number): Pt => [o.ox + C * (x - y), o.oy + S * (x + y) - z];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
/* Draw flat things in board coordinates on a horizontal plane at height z. */
const topT = (o: O, z: number) => `matrix(${C} ${S} ${-C} ${S} ${o.ox} ${o.oy - z})`;
/* Draw on the front-left wall (plane y = Y), in (x, z). */
const leftT = (o: O, Y: number) => `matrix(${C} ${S} 0 -1 ${o.ox - C * Y} ${o.oy + S * Y})`;
/* Draw on the front-right wall (plane x = X), in (y, z). */
const rightT = (o: O, X: number) => `matrix(${-C} ${S} 0 -1 ${o.ox + C * X} ${o.oy + S * X})`;

function Box({ o, x, y, z, w, d, h, c, stroke = "rgba(0,0,0,.35)" }: {
  o: O; x: number; y: number; z: number; w: number; d: number; h: number; c: [string, string, string]; stroke?: string;
}) {
  const t = [P(o, x, y, z + h), P(o, x + w, y, z + h), P(o, x + w, y + d, z + h), P(o, x, y + d, z + h)];
  const left = [P(o, x, y + d, z + h), P(o, x + w, y + d, z + h), P(o, x + w, y + d, z), P(o, x, y + d, z)];
  const right = [P(o, x + w, y, z + h), P(o, x + w, y + d, z + h), P(o, x + w, y + d, z), P(o, x + w, y, z)];
  return (
    <g strokeWidth=".7" stroke={stroke} strokeLinejoin="round">
      <polygon points={pts(...right)} fill={c[2]} />
      <polygon points={pts(...left)} fill={c[1]} />
      <polygon points={pts(...t)} fill={c[0]} />
    </g>
  );
}

/* Upright cylinder, e.g. an electrolytic capacitor or a terminal stud. */
function Can({ o, cx, cy, z, r, h, body, top, children }: {
  o: O; cx: number; cy: number; z: number; r: number; h: number; body: string; top: string; children?: ReactNode;
}) {
  const [bx, by] = P(o, cx, cy, z);
  const [, ty] = P(o, cx, cy, z + h);
  const rx = r * C * Math.SQRT2, ry = r * S * Math.SQRT2;
  return (
    <g>
      <path d={`M${bx - rx},${ty} V${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} V${ty} Z`} fill={body} stroke="rgba(0,0,0,.4)" strokeWidth=".7" />
      <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill={top} stroke="rgba(0,0,0,.35)" strokeWidth=".7" />
      {children}
    </g>
  );
}

export function InverterDefs() {
  return (
    <defs>
      <linearGradient id="iv-cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1c2d63" /><stop offset=".35" stopColor="#3f5fbf" /><stop offset=".55" stopColor="#2c4596" /><stop offset="1" stopColor="#141f45" />
      </linearGradient>
      <linearGradient id="iv-stud" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a6a2c" /><stop offset=".4" stopColor="#f0d48a" /><stop offset="1" stopColor="#7a5a20" />
      </linearGradient>
      <radialGradient id="iv-captop" cx=".4" cy=".35" r=".8">
        <stop offset="0" stopColor="#f3f4f6" /><stop offset="1" stopColor="#9aa0a8" />
      </radialGradient>
    </defs>
  );
}

/* ---------------------------------------------------------------- layers */

const ALU: [string, string, string] = ["#dfe2e6", "#b3b9c0", "#949aa3"];

function Heatsink({ o, z }: { o: O; z: number }) {
  const h = 30;
  return (
    <>
      <Box o={o} x={0} y={0} z={z} w={W} d={D} h={h} c={ALU} />
      <g transform={leftT(o, D)}>
        {Array.from({ length: 18 }, (_, i) => <rect key={i} x={8 + i * 12} y={z} width={5} height={h - 8} fill="#7d838b" />)}
      </g>
      <g transform={rightT(o, W)}>
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={8 + i * 12} y={z} width={5} height={h - 8} fill="#6b7179" />)}
      </g>
      <g transform={topT(o, z + h)}>
        <rect x={14} y={14} width={W - 28} height={D - 28} rx={4} fill="none" stroke="#9aa0a8" strokeWidth="1.2" />
        {[[10, 10], [W - 10, 10], [10, D - 10], [W - 10, D - 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#4b5058" />)}
      </g>
    </>
  );
}

function Pad({ o, z }: { o: O; z: number }) {
  return (
    <>
      <Box o={o} x={15} y={15} z={z} w={190} d={120} h={2} c={["#b9cadb", "#8ea3b8", "#7d92a7"]} stroke="rgba(0,0,0,.2)" />
      <g transform={topT(o, z + 2)} opacity=".35">
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={20} y1={22 + i * 13} x2={200} y2={22 + i * 13} stroke="#fff" strokeWidth="1" />)}
      </g>
    </>
  );
}

const LEG_X = [70, 120, 170];
const FET: [string, string, string] = ["#2b2e33", "#16181b", "#0f1113"];

function PowerBoard({ o, z, shunts, terms }: { o: O; z: number; shunts: string; terms: string }) {
  const zt = z + 5;
  return (
    <>
      <g className="core">
        <Box o={o} x={0} y={0} z={z} w={W} d={D} h={5} c={["#eef0f2", "#b9bec4", "#a3a9b0"]} />
        <g transform={topT(o, zt)}>
          <rect x={56} y={16} width={154} height={14} rx={2} fill="#d0884a" />
          <text x={60} y={27} className="iv-silk">DC+ BUS</text>
          <rect x={56} y={120} width={154} height={8} rx={2} fill="#d0884a" opacity=".8" />
          {LEG_X.map((x, k) => (
            <g key={k}>
              <rect x={x + 6} y={30} width={18} height={92} fill="#d9a06f" opacity=".55" />
              <rect x={x} y={62} width={30} height={14} fill="#d0884a" />
              <path d={`M${x + 15},76 V${D - 6}`} stroke="#d0884a" strokeWidth="8" />
            </g>
          ))}
          <path d="M14,128 V30 H56" stroke="#d0884a" strokeWidth="8" fill="none" />
          <path d="M40,128 V128 H56" stroke="#7a8088" strokeWidth="6" fill="none" />
        </g>
        {LEG_X.map((x, k) => (
          <g key={k}>
            <Box o={o} x={x} y={38} z={zt} w={30} d={20} h={6} c={FET} />
            <Box o={o} x={x} y={80} z={zt} w={30} d={20} h={6} c={FET} />
            <g transform={topT(o, zt + 6)}>
              <text x={x + 4} y={52} className="iv-chip">Q{2 * k + 1}</text>
              <text x={x + 4} y={94} className="iv-chip">Q{2 * k + 2}</text>
            </g>
          </g>
        ))}
      </g>
      <g className={shunts}>
        {LEG_X.map((x, k) => <Box key={k} o={o} x={x + 2} y={104} z={zt} w={26} d={9} h={3} c={["#d7dbe0", "#a5abb3", "#8e949c"]} />)}
      </g>
      <g className={terms}>
        {[
          { x: 14, label: "B+", collar: "#c2463b" },
          { x: 40, label: "B−", collar: "#222" },
          ...LEG_X.map((x, k) => ({ x: x + 15, label: "UVW"[k], collar: ["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"][k] })),
        ].map((t) => (
          <g key={t.label}>
            <Can o={o} cx={t.x} cy={D - 14} z={zt} r={6} h={4} body={t.collar} top={t.collar} />
            <Can o={o} cx={t.x} cy={D - 14} z={zt + 4} r={3.5} h={10} body="url(#iv-stud)" top="#e9d08c" />
            <g transform={topT(o, zt)}><text x={t.x + 7} y={D - 3} className="iv-silk">{t.label}</text></g>
          </g>
        ))}
      </g>
    </>
  );
}

function CapBank({ o, z }: { o: O; z: number }) {
  const zt = z + 3;
  const cans = [40, 85, 130, 175];
  return (
    <>
      <Box o={o} x={10} y={10} z={z} w={200} d={130} h={3} c={["#c27a45", "#9a5a2c", "#874d24"]} />
      <g transform={topT(o, zt)}>
        <rect x={16} y={16} width={188} height={118} fill="none" stroke="#f4c9a0" strokeOpacity=".5" />
        <text x={20} y={130} className="iv-silk">LAMINATED BUSBAR</text>
      </g>
      {[48, 100].map((cy) => cans.map((cx) => (
        <Can key={`${cx}-${cy}`} o={o} cx={cx} cy={cy} z={zt} r={15} h={40} body="url(#iv-cap)" top="url(#iv-captop)">
          {(() => { const [x, y] = P(o, cx, cy, zt + 40); return <path d={`M${x - 8},${y} H${x + 8} M${x},${y - 3} V${y + 3}`} stroke="#6b7078" strokeWidth="1" />; })()}
        </Can>
      )))}
    </>
  );
}

function GateBoard({ o, z }: { o: O; z: number }) {
  const zt = z + 4;
  return (
    <>
      <Box o={o} x={0} y={20} z={z} w={W} d={110} h={4} c={["#2f8f4e", "#1f6a38", "#185a2f"]} />
      <g transform={topT(o, zt)}>
        {LEG_X.map((x, k) => <path key={k} d={`M${x + 10},96 V118 M${x + 20},96 V118`} stroke="#d4b25a" strokeWidth="1.2" />)}
        <text x={60} y={124} className="iv-silk light">GATE DRIVE · 12 V</text>
      </g>
      {LEG_X.map((x, k) => (
        <g key={k}>
          <Box o={o} x={x} y={70} z={zt} w={24} d={16} h={3} c={FET} />
          <Box o={o} x={x + 28} y={74} z={zt} w={8} d={5} h={4} c={["#e2c48f", "#b9985f", "#a88850"]} />
        </g>
      ))}
      <Box o={o} x={6} y={34} z={zt} w={14} d={80} h={9} c={["#f2f2f0", "#cfcfcb", "#bdbdb8"]} />
    </>
  );
}

function ControlBoard({ o, z }: { o: O; z: number }) {
  const zt = z + 4;
  return (
    <>
      <Box o={o} x={0} y={0} z={z} w={W} d={D} h={4} c={["#2a63b5", "#1c4a8a", "#163d73"]} />
      <g transform={topT(o, zt)}>
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${82},${72 + i * 3} H${120 + i * 6} V${130}`} stroke="#d4b25a" strokeOpacity=".7" strokeWidth=".8" fill="none" />)}
        <text x={150} y={20} className="iv-silk light">CONTROL · 3.3 V</text>
      </g>
      <Box o={o} x={40} y={70} z={zt} w={38} d={38} h={4} c={FET} />
      <g transform={topT(o, zt + 4)}><text x={44} y={93} className="iv-chip">MCU</text><circle cx={46} cy={75} r={1.6} fill="#555" /></g>
      <Box o={o} x={92} y={100} z={zt} w={12} d={5} h={3} c={["#e7e9ec", "#b7bcc2", "#a3a9b0"]} />
      <Box o={o} x={120} y={60} z={zt} w={16} d={10} h={3} c={FET} />
      <Box o={o} x={6} y={20} z={zt} w={14} d={110} h={9} c={["#f2f2f0", "#cfcfcb", "#bdbdb8"]} />
      <Box o={o} x={120} y={128} z={zt} w={70} d={14} h={10} c={["#f2f2f0", "#cfcfcb", "#bdbdb8"]} />
      <Box o={o} x={200} y={40} z={zt} w={5} d={5} h={2} c={["#ff6b5a", "#c94636", "#b33c2e"]} />
    </>
  );
}

function Lid({ o, z }: { o: O; z: number }) {
  const h = 72;
  return (
    <>
      <Box o={o} x={-4} y={-4} z={z} w={W + 8} d={D + 8} h={h} c={["#e6e9ec", "#bcc2c9", "#9ea5ad"]} />
      <g transform={topT(o, z + h)}>
        <rect x={20} y={20} width={W - 40} height={D - 40} rx={10} fill="#d9dde1" stroke="#b5bbc2" />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={36} y1={40 + i * 13} x2={W - 36} y2={40 + i * 13} stroke="#c4c9cf" strokeWidth="3" />)}
        <text x={40} y={D - 30} className="iv-lid">48 V · 60 A · IP65</text>
      </g>
      <g transform={leftT(o, D + 4)}>
        <rect x={20} y={z + 18} width={60} height={20} rx={3} fill="#2b2e33" />
        <text x={26} y={z + 25} className="iv-silk light" transform={`scale(1 -1) translate(0 ${-2 * (z + 25)})`}>CAN · HALL</text>
      </g>
    </>
  );
}

/* ---------------------------------------------------------------- scene */

interface Layer { id: PartId; zA: number; zE: number; name: string }
const LAYERS: Layer[] = [
  { id: "heatsink", zA: -30, zE: -30, name: "Heatsink baseplate" },
  { id: "pad", zA: 0, zE: 40, name: "Thermal interface" },
  { id: "mosfets", zA: 2, zE: 95, name: "Power stage" },
  { id: "caps", zA: 7, zE: 150, name: "DC-link capacitors" },
  { id: "gate", zA: 52, zE: 240, name: "Gate drivers" },
  { id: "control", zA: 60, zE: 300, name: "Control board" },
  { id: "lid", zA: 0, zE: 372, name: "Enclosure lid" },
];
const SUBS: Record<string, PartId[]> = { mosfets: ["shunts", "terminals"] };
/* Exploded layers fan out from the lower left; assembled, the box sits in the middle of the frame. */
const oAt = (i: number, t: number): O => ({ ox: 145 + t * i * 100 + (1 - t) * 330, oy: OY - (1 - t) * 190 });
const zAt = (l: Layer, t: number) => l.zA + t * (l.zE - l.zA);

interface Label { id: PartId; text: string; sub?: string; ax: number; ay: number; lx: number; ly: number; anchor?: "start" | "end" }
const LABELS: Label[] = [
  { id: "heatsink", text: "Heatsink", sub: "finned aluminium", ax: 240, ay: 604, lx: 292, ly: 626 },
  { id: "pad", text: "Thermal pad", sub: "insulating", ax: 332, ay: 542, lx: 382, ly: 566 },
  { id: "mosfets", text: "Power stage", sub: "6 MOSFETs · 3 legs", ax: 438, ay: 490, lx: 490, ly: 514 },
  { id: "caps", text: "DC-link capacitors", sub: "8 × electrolytic", ax: 510, ay: 400, lx: 566, ly: 470 },
  { id: "gate", text: "Gate drivers", sub: "12 V, dead time", ax: 458, ay: 294, lx: 412, ly: 270, anchor: "end" },
  { id: "control", text: "Control board", sub: "microcontroller", ax: 541, ay: 240, lx: 498, ly: 206, anchor: "end" },
  { id: "lid", text: "Enclosure lid", sub: "die-cast aluminium", ax: 650, ay: 139, lx: 604, ly: 92, anchor: "end" },
  { id: "terminals", text: "Power terminals", sub: "B+ B− U V W", ax: 241, ay: 427, lx: 200, ly: 378, anchor: "end" },
  { id: "shunts", text: "Current shunts", sub: "low side, 1 mΩ", ax: 318, ay: 444, lx: 214, ly: 424, anchor: "end" },
];

function layerNode(l: Layer, o: O, z: number, active: PartId[]) {
  switch (l.id) {
    case "heatsink": return <Heatsink o={o} z={z} />;
    case "pad": return <Pad o={o} z={z} />;
    case "mosfets": return <PowerBoard o={o} z={z} shunts={`sub ${active.includes("shunts") ? "on" : ""}`} terms={`sub ${active.includes("terminals") ? "on" : ""}`} />;
    case "caps": return <CapBank o={o} z={z} />;
    case "gate": return <GateBoard o={o} z={z} />;
    case "control": return <ControlBoard o={o} z={z} />;
    default: return <Lid o={o} z={z} />;
  }
}

export function InverterScene({ t, active, onEnter, onPick }: SceneProps) {
  const any = active.length > 0;
  const state = (l: Layer) => {
    if (!any) return "";
    if (active.includes(l.id)) return "on";
    if ((SUBS[l.id] ?? []).some((s) => active.includes(s))) return "wonly";
    return "dim";
  };
  const labelOpacity = Math.max(0, Math.min(1, (t - 0.65) / 0.3));
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="an-scene" role="group" aria-label="Exploded view of a three-phase motor inverter">
      <InverterDefs />
      {LAYERS.map((l, i) => (
        <g key={l.id} className={`ap ${state(l)}`} tabIndex={0} role="button" aria-label={l.name}
          onMouseEnter={() => onEnter(l.id)} onMouseLeave={() => onEnter(null)} onFocus={() => onEnter(l.id)} onBlur={() => onEnter(null)}
          onClick={(e) => { e.stopPropagation(); onPick(l.id); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(l.id); } }}>
          {layerNode(l, oAt(i, t), zAt(l, t), active)}
        </g>
      ))}
      <g className="an-labels" style={{ opacity: labelOpacity }} aria-hidden={labelOpacity < 0.5}>
        {LABELS.map((l) => {
          const on = active.includes(l.id);
          const end = l.anchor === "end";
          const lx2 = end ? l.lx + 6 : l.lx - 6;
          return (
            <g key={l.id} className={`an-label${on ? " on" : ""}`} onMouseEnter={() => onEnter(l.id)} onMouseLeave={() => onEnter(null)} onClick={() => onPick(l.id)}>
              <polyline points={`${l.ax},${l.ay} ${lx2},${l.ly - 4}`} fill="none" />
              <circle cx={l.ax} cy={l.ay} r="2.5" />
              <text x={l.lx} y={l.ly} textAnchor={l.anchor ?? "start"} className="an-name">{l.text}</text>
              {l.sub && <text x={l.lx} y={l.ly + 15} textAnchor={l.anchor ?? "start"} className="an-sub">{l.sub}</text>}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* Small standalone picture of one part, for the parts list. */
export function InverterIcon({ id }: { id: PartId }) {
  const o: O = { ox: 150, oy: 60 };
  let node: ReactNode;
  let vb = "10 0 330 210";
  switch (id) {
    case "shunts": node = <Box o={o} x={0} y={0} z={0} w={60} d={20} h={8} c={["#d7dbe0", "#a5abb3", "#8e949c"]} />; vb = "92 40 120 50"; break;
    case "terminals": node = <><Can o={o} cx={0} cy={0} z={0} r={14} h={10} body="#c2463b" top="#c2463b" /><Can o={o} cx={0} cy={0} z={10} r={8} h={30} body="url(#iv-stud)" top="#e9d08c" /></>; vb = "110 10 80 70"; break;
    case "caps": node = <Can o={o} cx={0} cy={0} z={0} r={30} h={80} body="url(#iv-cap)" top="url(#iv-captop)" />; vb = "100 -40 100 130"; break;
    default: {
      const l = LAYERS.find((x) => x.id === id)!;
      node = layerNode(l, { ox: 150, oy: id === "lid" ? 140 : 60 }, 0, []);
      vb = id === "lid" ? "10 40 330 230" : id === "heatsink" ? "10 20 330 190" : "10 20 330 170";
    }
  }
  return <svg viewBox={vb} className="an-icon" aria-hidden="true" preserveAspectRatio="xMidYMid meet">{node}</svg>;
}
