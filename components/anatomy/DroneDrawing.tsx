"use client";

import type { ReactNode } from "react";
import type { PartId } from "@/lib/content/anatomy";
import type { SceneProps } from "./kits";

/* Exploded isometric stack of a quadcopter's flight electronics, drawn board by board.
   Board coordinates: x along one edge (0..W), y across (0..D), z up. The frame sits at the
   bottom with its four arms, motors and props; the ESC, flight controller, receiver and
   battery lift off it diagonally so every board's front edge stays visible. */

const C = 0.866, S = 0.3, W = 170, D = 170;
const VIEW = { w: 940, h: 640 };
const OY = 480;

interface O { ox: number; oy: number }
type Pt = [number, number];
const P = (o: O, x: number, y: number, z: number): Pt => [o.ox + C * (x - y), o.oy + S * (x + y) - z];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
/* Draw flat things in board coordinates on a horizontal plane at height z. */
const topT = (o: O, z: number) => `matrix(${C} ${S} ${-C} ${S} ${o.ox} ${o.oy - z})`;
/* Draw on the front-left wall (plane y = Y), in (x, z). */
const leftT = (o: O, Y: number) => `matrix(${C} ${S} 0 -1 ${o.ox - C * Y} ${o.oy + S * Y})`;

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

/* Upright cylinder: a motor bell, a standoff post or a GPS puck. */
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

export function DroneDefs() {
  return (
    <defs>
      <linearGradient id="dr-lipo" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#14213a" /><stop offset=".4" stopColor="#2f4d86" /><stop offset=".55" stopColor="#24406f" /><stop offset="1" stopColor="#0f1830" />
      </linearGradient>
      <linearGradient id="dr-lipotop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3a5fa8" /><stop offset="1" stopColor="#16233f" />
      </linearGradient>
      <linearGradient id="dr-bell" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3b3f46" /><stop offset=".4" stopColor="#9aa0a8" /><stop offset=".6" stopColor="#6b7178" /><stop offset="1" stopColor="#2b2e33" />
      </linearGradient>
      <radialGradient id="dr-belltop" cx=".4" cy=".35" r=".8">
        <stop offset="0" stopColor="#eef0f2" /><stop offset=".55" stopColor="#b9bec4" /><stop offset="1" stopColor="#70767d" />
      </radialGradient>
      <radialGradient id="dr-gps" cx=".4" cy=".3" r=".9">
        <stop offset="0" stopColor="#f3f5f7" /><stop offset="1" stopColor="#aab0b8" />
      </radialGradient>
    </defs>
  );
}

/* ---------------------------------------------------------------- layer colours */

const CARBON: [string, string, string] = ["#2c2f35", "#191b1f", "#111316"];
const CHIP: [string, string, string] = ["#2b2e33", "#16181b", "#0f1113"];
const ESC_PCB: [string, string, string] = ["#8a1f22", "#5f1517", "#4a1012"];
const FC_PCB: [string, string, string] = ["#1f3f78", "#15305d", "#102347"];
const RX_PCB: [string, string, string] = ["#1d1f24", "#121419", "#0d0f12"];
const PAD: [string, string, string] = ["#d9a24a", "#b4832f", "#9c6f26"];

/* Four motor corners, just outside the frame plate, and the arm each sits on. */
const MOTORS = [
  { cx: -2, cy: -2, spin: "cw" as const },
  { cx: W + 2, cy: -2, spin: "ccw" as const },
  { cx: -2, cy: D + 2, spin: "ccw" as const },
  { cx: W + 2, cy: D + 2, spin: "cw" as const },
];
const HUB = { cx: W / 2, cy: D / 2 };

function Prop({ o, cx, cy, z, spin }: { o: O; cx: number; cy: number; z: number; spin: "cw" | "ccw" }) {
  const dir = spin === "cw" ? 1 : -1;
  return (
    <g transform={topT(o, z)}>
      <g transform={`translate(${cx} ${cy})`}>
        <ellipse rx="30" ry="30" fill="var(--ink)" opacity=".07" />
        {[0, 1].map((k) => (
          <g key={k} transform={`rotate(${18 * dir + k * 180})`}>
            <path d={`M0,-4 Q30,${-10 * dir} 30,${2 * dir} Q20,4 0,4 Z`} fill="#4a4e55" stroke="#2b2e33" strokeWidth="1" />
          </g>
        ))}
        <circle r="5" fill="#2b2e33" stroke="#17191c" />
      </g>
    </g>
  );
}

function Frame({ o, z, motorsOn, propsOn }: { o: O; z: number; motorsOn: boolean; propsOn: boolean }) {
  const h = 6;
  return (
    <>
      {/* arms: a stiff cross reaching each motor */}
      <g transform={topT(o, z + h)}>
        {MOTORS.map((m, i) => (
          <line key={i} x1={HUB.cx} y1={HUB.cy} x2={m.cx} y2={m.cy} stroke="#1b1d21" strokeWidth="26" strokeLinecap="round" />
        ))}
        {MOTORS.map((m, i) => (
          <line key={`g${i}`} x1={HUB.cx} y1={HUB.cy} x2={m.cx} y2={m.cy} stroke="#3a3e45" strokeWidth="5" strokeLinecap="round" opacity=".5" />
        ))}
      </g>
      {/* centre plate the stack bolts to */}
      <Box o={o} x={26} y={26} z={z} w={W - 52} d={D - 52} h={h} c={CARBON} />
      <g transform={topT(o, z + h)}>
        {[[40, 40], [W - 40, 40], [40, D - 40], [W - 40, D - 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="#0c0d0f" stroke="#3a3e45" />)}
        <rect x={62} y={70} width={46} height={30} rx={3} fill="none" stroke="#52575e" strokeWidth="1.2" />
      </g>
      {/* standoffs the ESC/FC/RX ride on */}
      {[[40, 40], [W - 40, 40], [40, D - 40], [W - 40, D - 40]].map(([x, y], i) => (
        <Can key={i} o={o} cx={x} cy={y} z={z + h} r={3.2} h={46} body="#20232a" top="#363b43" />
      ))}
      {/* motors on the arm ends */}
      <g className={`sub ${motorsOn ? "on" : ""}`}>
        {MOTORS.map((m, i) => (
          <g key={i}>
            <Can o={o} cx={m.cx} cy={m.cy} z={z + h} r={16} h={13} body="url(#dr-bell)" top="url(#dr-belltop)">
              {(() => { const [px, py] = P(o, m.cx, m.cy, z + h + 13); return <>
                <circle cx={px} cy={py} r="3" fill="#44474d" />
                {[0, 60, 120].map((a) => { const rad = (a * Math.PI) / 180; return <line key={a} x1={px} y1={py} x2={px + 11 * C * Math.cos(rad)} y2={py + 11 * S * Math.sin(rad) * 1.4} stroke="#30333a" strokeWidth="1.4" />; })}
              </>; })()}
            </Can>
          </g>
        ))}
      </g>
      {/* props above the motors */}
      <g className={`sub ${propsOn ? "on" : ""}`}>
        {MOTORS.map((m, i) => <Prop key={i} o={o} cx={m.cx} cy={m.cy} z={z + h + 15} spin={m.spin} />)}
      </g>
    </>
  );
}

function Esc({ o, z }: { o: O; z: number }) {
  const zt = z + 5;
  return (
    <>
      <Box o={o} x={20} y={20} z={z} w={130} d={130} h={5} c={ESC_PCB} />
      <g transform={topT(o, zt)}>
        <rect x={28} y={28} width={114} height={114} rx={6} fill="none" stroke="#e7b7b8" strokeOpacity=".4" />
        <text x={32} y={132} className="dr-silk light">4-IN-1 ESC · 4×30 A</text>
        {/* four output phase-pad triples near the corners */}
        {[[40, 40], [130, 40], [40, 130], [130, 130]].map(([x, y], i) => (
          <g key={i}>
            {["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"].map((c, k) => <circle key={k} cx={x - 10 + k * 10} cy={y} r={3.4} fill={c} />)}
          </g>
        ))}
      </g>
      {/* four FET banks (one inverter per motor) + bus cap */}
      {[[36, 36], [112, 36], [36, 112], [112, 112]].map(([x, y], i) => (
        <Box key={i} o={o} x={x} y={y} z={zt} w={22} d={14} h={4} c={CHIP} />
      ))}
      <Can o={o} cx={85} cy={85} z={zt} r={11} h={16} body="url(#dr-lipo)" top="url(#dr-lipotop)" />
    </>
  );
}

function Fc({ o, z, imuOn }: { o: O; z: number; imuOn: boolean }) {
  const zt = z + 5;
  return (
    <>
      <Box o={o} x={32} y={32} z={z} w={106} d={106} h={5} c={FC_PCB} />
      <g transform={topT(o, zt)}>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M64,${62 + i * 3} H${96 + i * 4} V110`} stroke="#d4b25a" strokeOpacity=".6" strokeWidth=".8" fill="none" />)}
        <text x={40} y={128} className="dr-silk light">FLIGHT CONTROLLER</text>
      </g>
      {/* MCU */}
      <Box o={o} x={48} y={48} z={zt} w={30} d={30} h={4} c={CHIP} />
      <g transform={topT(o, zt + 4)}><text x={51} y={67} className="dr-chip">MCU</text><circle cx={52} cy={52} r={1.6} fill="#555" /></g>
      {/* IMU (highlightable sub) */}
      <g className={`sub ${imuOn ? "on" : ""}`}>
        <Box o={o} x={96} y={92} z={zt} w={18} d={18} h={4} c={["#20232a", "#121419", "#0c0e11"]} />
        <g transform={topT(o, zt + 4)}><text x={99} y={104} className="dr-chip">IMU</text><circle cx={100} cy={95} r={1.2} fill="#777" /></g>
      </g>
      {/* pin headers + usb edge */}
      <Box o={o} x={40} y={118} z={zt} w={58} d={10} h={7} c={["#2b2e33", "#1b1d21", "#131519"]} />
      <Box o={o} x={118} y={54} z={zt} w={8} d={14} h={6} c={["#e7e9ec", "#b7bcc2", "#a3a9b0"]} />
    </>
  );
}

function Rx({ o, z, gpsOn }: { o: O; z: number; gpsOn: boolean }) {
  const zt = z + 4;
  return (
    <>
      <Box o={o} x={46} y={46} z={z} w={78} d={78} h={4} c={RX_PCB} />
      <g transform={topT(o, zt)}>
        <rect x={52} y={52} width={66} height={66} rx={4} fill="none" stroke="#5a5f66" strokeOpacity=".5" />
        <text x={54} y={114} className="dr-silk light">RX</text>
      </g>
      <Box o={o} x={56} y={56} z={zt} w={16} d={12} h={3} c={CHIP} />
      {/* two antenna whips */}
      {(() => {
        const [ax, ay] = P(o, 120, 56, zt); const [bx, by] = P(o, 120, 118, zt);
        return <g stroke="#b9bec4" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d={`M${ax},${ay} q 26,-10 30,-40`} /><circle cx={ax + 30} cy={ay - 40} r="2.4" fill="#d6460f" stroke="none" />
          <path d={`M${bx},${by} q 30,-6 40,-30`} /><circle cx={bx + 40} cy={by - 30} r="2.4" fill="#d6460f" stroke="none" />
        </g>;
      })()}
      {/* GPS puck (highlightable sub) */}
      <g className={`sub ${gpsOn ? "on" : ""}`}>
        <Can o={o} cx={62} cy={104} z={zt} r={13} h={6} body="#2b2e33" top="url(#dr-gps)" />
        <g transform={topT(o, zt + 6)}><circle cx={62} cy={104} r={9} fill="none" stroke="#9aa0a8" strokeWidth="1" /><text x={54} y={107} className="dr-chip dark">GPS</text></g>
      </g>
    </>
  );
}

function Battery({ o, z }: { o: O; z: number }) {
  const h = 34;
  return (
    <>
      <Box o={o} x={12} y={44} z={z} w={146} d={82} h={h} c={["#2f4d86", "#1c3360", "#12233f"]} />
      <g transform={topT(o, z + h)}>
        <rect x={18} y={50} width={134} height={70} rx={5} fill="url(#dr-lipotop)" stroke="#16233f" />
        <text x={26} y={78} className="dr-lipo-lbl">LiPo 4S</text>
        <text x={26} y={96} className="dr-lipo-sub">14.8 V · 1500 mAh</text>
        <rect x={110} y={58} width={34} height={22} rx={2} fill="#d6460f" opacity=".85" />
        <text x={116} y={73} className="dr-chip">XT60</text>
      </g>
      {/* cell seams on the long side */}
      <g transform={leftT(o, 44)} opacity=".4">
        {[1, 2, 3].map((i) => <line key={i} x1={12 + i * 36} y1={z} x2={12 + i * 36} y2={z + h} stroke="#0c1424" strokeWidth="1.4" />)}
      </g>
    </>
  );
}

/* ---------------------------------------------------------------- scene */

interface Layer { id: PartId; zA: number; zE: number; name: string }
const LAYERS: Layer[] = [
  { id: "frame", zA: 0, zE: 0, name: "Frame and arms" },
  { id: "esc", zA: 16, zE: 96, name: "4-in-1 ESC" },
  { id: "fc", zA: 30, zE: 188, name: "Flight controller" },
  { id: "rx", zA: 44, zE: 272, name: "Radio receiver" },
  { id: "battery", zA: 58, zE: 356, name: "LiPo battery" },
];
const SUBS: Record<string, PartId[]> = { frame: ["motors", "props"], fc: ["imu"], rx: ["gps"] };
/* Assembled, every board shares a centred origin; exploded, they fan up and to the right. */
const oAt = (i: number, t: number): O => ({ ox: 240 + t * i * 84 + (1 - t) * 90, oy: OY - (1 - t) * 150 });
const zAt = (l: Layer, t: number) => l.zA + t * (l.zE - l.zA);

interface Label { id: PartId; text: string; sub?: string; ax: number; ay: number; lx: number; ly: number; anchor?: "start" | "end" }
const LABELS: Label[] = [
  { id: "frame", text: "Frame & arms", sub: "carbon fibre", ax: 224, ay: 560, lx: 150, ly: 606, anchor: "end" },
  { id: "motors", text: "Motors", sub: "4 × outrunner BLDC", ax: 190, ay: 536, lx: 158, ly: 486, anchor: "end" },
  { id: "props", text: "Propellers", sub: "2 CW · 2 CCW", ax: 430, ay: 548, lx: 500, ly: 574, anchor: "start" },
  { id: "esc", text: "4-in-1 ESC", sub: "four inverters", ax: 352, ay: 452, lx: 452, ly: 486, anchor: "start" },
  { id: "fc", text: "Flight controller", sub: "the brain", ax: 440, ay: 372, lx: 536, ly: 398, anchor: "start" },
  { id: "imu", text: "IMU", sub: "gyro + accel", ax: 404, ay: 352, lx: 312, ly: 322, anchor: "end" },
  { id: "rx", text: "Radio receiver", sub: "pilot link", ax: 520, ay: 300, lx: 600, ly: 266, anchor: "start" },
  { id: "gps", text: "GPS & compass", sub: "position hold", ax: 470, ay: 300, lx: 384, ly: 250, anchor: "end" },
  { id: "battery", text: "LiPo battery", sub: "4S flight pack", ax: 552, ay: 200, lx: 486, ly: 168, anchor: "end" },
];

function layerNode(l: Layer, o: O, z: number, active: PartId[]) {
  switch (l.id) {
    case "frame": return <Frame o={o} z={z} motorsOn={active.includes("motors")} propsOn={active.includes("props")} />;
    case "esc": return <Esc o={o} z={z} />;
    case "fc": return <Fc o={o} z={z} imuOn={active.includes("imu")} />;
    case "rx": return <Rx o={o} z={z} gpsOn={active.includes("gps")} />;
    default: return <Battery o={o} z={z} />;
  }
}

export function DroneScene({ t, active, onEnter, onPick }: SceneProps) {
  const any = active.length > 0;
  const state = (l: Layer) => {
    if (!any) return "";
    if (active.includes(l.id)) return "on";
    if ((SUBS[l.id] ?? []).some((s) => active.includes(s))) return "wonly";
    return "dim";
  };
  const labelOpacity = Math.max(0, Math.min(1, (t - 0.65) / 0.3));
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="an-scene" role="group" aria-label="Exploded view of a quadcopter's flight stack">
      <DroneDefs />
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
export function DroneIcon({ id }: { id: PartId }) {
  const o: O = { ox: 150, oy: 70 };
  let node: ReactNode;
  let vb = "20 0 300 200";
  switch (id) {
    case "motors": node = <Can o={{ ox: 150, oy: 70 }} cx={0} cy={0} z={0} r={30} h={26} body="url(#dr-bell)" top="url(#dr-belltop)" />; vb = "70 -10 160 120"; break;
    case "props": node = <Prop o={{ ox: 150, oy: 80 }} cx={0} cy={0} z={0} spin="cw" />; vb = "90 20 120 90"; break;
    case "imu": node = <Box o={o} x={0} y={0} z={0} w={60} d={60} h={14} c={["#20232a", "#121419", "#0c0e11"]} />; vb = "80 10 150 130"; break;
    case "gps": node = <Can o={{ ox: 150, oy: 70 }} cx={0} cy={0} z={0} r={30} h={12} body="#2b2e33" top="url(#dr-gps)" />; vb = "70 10 160 110"; break;
    case "battery": node = <Battery o={{ ox: 150, oy: 120 }} z={0} />; vb = "20 30 300 170"; break;
    default: {
      const l = LAYERS.find((x) => x.id === id)!;
      node = layerNode(l, { ox: 150, oy: id === "frame" ? 120 : 90 }, 0, []);
      vb = id === "frame" ? "0 40 330 220" : "10 20 330 180";
    }
  }
  return <svg viewBox={vb} className="an-icon" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><DroneDefs />{node}</svg>;
}
