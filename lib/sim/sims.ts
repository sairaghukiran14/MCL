// @ts-nocheck
import { h, TAU, D2R, animate, themeColors, fitCanvas, axes, plotLine, plotFn, dot, arrow, ctl, toggle, selectCtl, readouts, legend } from "./runtime";
import { mount as mountLab } from "./lab";

/* Interactive simulations. Each SIMS[name](host) builds controls + canvases and registers its loop. */
export function layout(host, canvases) {
  const sim = h("div", { class: "sim" });
  const ctrls = h("div", { class: "sim-controls" });
  const stage = h("div", { class: "sim-stage" });
  sim.append(ctrls, stage); host.appendChild(sim);
  const cvs = canvases.map(c => { const cv = h("canvas", { class: c.cls || "", "aria-label": c.label || "simulation plot" }); stage.appendChild(cv); return cv; });
  return { ctrls, stage, cvs };
}
export const pad = (w, hh, l = 46, r = 12, t = 14, b = 22) => ({ x: l, y: t, w: w - l - r, h: hh - t - b });

export const SIMS: Record<string, (host: HTMLElement) => void> = {};

/* ------------------------------------------------ phasor */
SIMS.phasor = host => {
  const L = layout(host, [{ label: "Rotating phasors and their waveforms" }]);
  const A = ctl(L.ctrls, { key: "a", label: "Current amplitude", min: 0.2, max: 1.4, step: 0.05, value: 0.8, fmt: v => v.toFixed(2) + " pu" });
  const ph = ctl(L.ctrls, { key: "p", label: "Current phase φ", min: -180, max: 180, step: 5, value: -40, unit: "°" });
  const f = ctl(L.ctrls, { key: "f", label: "Animation speed", min: 0, max: 1.5, step: 0.05, value: 0.4, fmt: v => v.toFixed(2) + "×" });
  const ro = readouts(L.stage, [["vr", "V rms (230 V base)"], ["ir", "I rms (10 A base)"], ["pf", "Power factor"], ["p", "Avg power"], ["lag", "Relation"]]);
  legend(L.stage, [["var(--ph-r)", "voltage v(t)"], ["var(--ph-b)", "current i(t)"]]);
  let t = 0;
  animate(dt => {
    t += dt * TAU * f.v;
    const C = themeColors(), { ctx, w, h: hh } = fitCanvas(L.cvs[0]);
    const sq = Math.min(hh - 20, w * 0.36), R = sq * 0.42, cx = 10 + sq / 2, cy = hh / 2;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R - 6, cy); ctx.lineTo(cx + R + 6, cy); ctx.moveTo(cx, cy - R - 6); ctx.lineTo(cx, cy + R + 6); ctx.stroke();
    const phi = ph.v * D2R, a = A.v;
    const vx = Math.cos(t) * R, vy = Math.sin(t) * R, ix = Math.cos(t + phi) * R * a, iy = Math.sin(t + phi) * R * a;
    arrow(ctx, cx, cy, cx + vx, cy - vy, C.r, 3); arrow(ctx, cx, cy, cx + ix, cy - iy, C.b, 3);
    // projection lines to plot
    const box = pad(w, hh, sq + 56, 12, 14, 22), x0 = box.x;
    const ax = axes(ctx, box, { xmin: 0, xmax: 2, ymin: -1.5, ymax: 1.5, C, xlabel: "cycles", yn: 6 });
    ctx.setLineDash([3, 3]); ctx.strokeStyle = C.r; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + vx, cy - vy); ctx.lineTo(x0, ax.Y(Math.sin(t))); ctx.stroke();
    ctx.strokeStyle = C.b; ctx.beginPath(); ctx.moveTo(cx + ix, cy - iy); ctx.lineTo(x0, ax.Y(a * Math.sin(t + phi))); ctx.stroke(); ctx.setLineDash([]);
    // waves: at plot x (cycles back in time) value = sin(t - 2πx)
    plotFn(ctx, x => Math.sin(t - TAU * x), 0, 2, ax.X, ax.Y, C.r, 2);
    plotFn(ctx, x => a * Math.sin(t + phi - TAU * x), 0, 2, ax.X, ax.Y, C.b, 2);
    dot(ctx, x0, ax.Y(Math.sin(t)), 4, C.r); dot(ctx, x0, ax.Y(a * Math.sin(t + phi)), 4, C.b);
    const pf = Math.cos(phi);
    ro("vr", "230 V"); ro("ir", (10 * a).toFixed(2) + " A"); ro("pf", Math.abs(pf).toFixed(3), pf < 0 ? "bad" : "");
    ro("p", (230 * 10 * a * pf).toFixed(0) + " W", pf < 0 ? "bad" : "");
    ro("lag", ph.v < -2 ? `lags ${-ph.v}° (inductive)` : ph.v > 2 ? `leads ${ph.v}° (capacitive)` : "in phase");
  });
};

/* ------------------------------------------------ three-phase */
SIMS.threephase = host => {
  const L = layout(host, [{ label: "Three-phase currents and their sum" }, { label: "Instantaneous power per phase and total", cls: "short" }]);
  const phi = ctl(L.ctrls, { key: "phi", label: "PF angle φ", min: 0, max: 85, step: 1, value: 32, unit: "°" });
  const ub = ctl(L.ctrls, { key: "ub", label: "Y-phase current scale", min: 0.4, max: 1.6, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" });
  const spd = ctl(L.ctrls, { key: "s", label: "Animation speed", min: 0, max: 1.5, step: 0.05, value: 0.3, fmt: v => v.toFixed(2) + "×" });
  legend(L.stage, [["var(--ph-r)", "R"], ["var(--ph-y)", "Y"], ["var(--ph-b)", "B"], ["var(--ink)", "sum / total"]]);
  const ro = readouts(L.stage, [["P", "P (400 V, 10 A)"], ["Q", "Q"], ["S", "S"], ["pf", "PF"], ["sum", "Σi peak"], ["rip", "Power ripple"]]);
  let t = 0;
  animate(dt => {
    t += dt * TAU * spd.v;
    const C = themeColors(), cols = [C.r, C.y, C.b], fi = phi.v * D2R, sc = [1, ub.v, 1];
    const iF = (k, x) => sc[k] * Math.sin(TAU * x - k * TAU / 3 - fi + t);
    const vF = (k, x) => Math.sin(TAU * x - k * TAU / 3 + t);
    let g = fitCanvas(L.cvs[0]); let ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 2, ymin: -2, ymax: 2, C, xlabel: "cycles", ylabel: "i (pu)" });
    for (let k = 0; k < 3; k++) plotFn(g.ctx, x => iF(k, x), 0, 2, ax.X, ax.Y, cols[k], 2);
    plotFn(g.ctx, x => iF(0, x) + iF(1, x) + iF(2, x), 0, 2, ax.X, ax.Y, C.ink, 2, 300, [5, 4]);
    g = fitCanvas(L.cvs[1]); ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 2, ymin: -1, ymax: 2, C, xlabel: "cycles", ylabel: "p (pu)", yn: 3 });
    for (let k = 0; k < 3; k++) plotFn(g.ctx, x => vF(k, x) * iF(k, x), 0, 2, ax.X, ax.Y, cols[k], 1.5);
    plotFn(g.ctx, x => vF(0, x) * iF(0, x) + vF(1, x) * iF(1, x) + vF(2, x) * iF(2, x), 0, 2, ax.X, ax.Y, C.ink, 2.5);
    let smax = 0, pmin = 9, pmax = -9;
    for (let i = 0; i < 200; i++) { const x = i / 200; smax = Math.max(smax, Math.abs(iF(0, x) + iF(1, x) + iF(2, x))); const p = vF(0, x) * iF(0, x) + vF(1, x) * iF(1, x) + vF(2, x) * iF(2, x); pmin = Math.min(pmin, p); pmax = Math.max(pmax, p); }
    const S = Math.sqrt(3) * 400 * 10;
    ro("P", (S * Math.cos(fi) / 1000).toFixed(2) + " kW"); ro("Q", (S * Math.sin(fi) / 1000).toFixed(2) + " kvar"); ro("S", (S / 1000).toFixed(2) + " kVA");
    ro("pf", Math.cos(fi).toFixed(3), Math.cos(fi) < 0.8 ? "warn" : "");
    ro("sum", smax.toFixed(2) + " pu", smax > 0.02 ? "bad" : "good"); ro("rip", ((pmax - pmin) / Math.max(1e-6, (pmax + pmin) / 2) * 100).toFixed(1) + " %", pmax - pmin > 0.02 ? "warn" : "good");
  });
};

/* ------------------------------------------------ electromagnetism: coil in field */
SIMS.emag = host => {
  const L = layout(host, [{ label: "Coil rotating in a magnetic field, end view", cls: "tall" }]);
  const N = ctl(L.ctrls, { key: "n", label: "Turns N", min: 1, max: 100, step: 1, value: 40 });
  const B = ctl(L.ctrls, { key: "b", label: "Flux density B", min: 0.1, max: 1.5, step: 0.05, value: 0.8, unit: "T", fmt: v => v.toFixed(2) });
  const I = ctl(L.ctrls, { key: "i", label: "Current I", min: 0, max: 20, step: 0.5, value: 5, unit: "A" });
  const Ar = ctl(L.ctrls, { key: "a", label: "Coil area", min: 5, max: 50, step: 1, value: 20, unit: "cm²" });
  const com = toggle(L.ctrls, "Commutation (reverse current every half-turn)", false);
  const kick = h("button", { class: "btn small", type: "button" }, "Kick the rotor"); L.ctrls.appendChild(kick);
  const ro = readouts(L.stage, [["tp", "Peak torque"], ["tavg", "Avg torque / turn"], ["ang", "Coil angle θ"], ["rpm", "Speed"], ["dir", "Current"]]);
  let th = 1.3, w = 0;
  kick.addEventListener("click", () => { w += 12; });
  animate(dt => {
    const k = N.v * B.v * I.v * Ar.v * 1e-4;
    const J = 0.004, b = 0.004;
    for (let i = 0; i < 20; i++) {
      const s = Math.sin(th), dir = com.v ? (s >= 0 ? 1 : -1) : 1;
      const T = -k * s * dir;   // restoring torque toward θ = 0 without commutation
      w += (T - b * w - 0.002 * w * Math.abs(w)) / J * dt / 20; th += w * dt / 20;
    }
    w = Math.max(-60, Math.min(60, w));
    const C = themeColors(), { ctx, w: W, h: hh } = fitCanvas(L.cvs[0]);
    const half = Math.min(W * 0.45, 360), cx = half / 2 + 10, cy = hh / 2, R = Math.min(half, hh) * 0.32;
    // poles
    ctx.fillStyle = C.r; ctx.globalAlpha = .85; ctx.fillRect(cx - R * 1.65, cy - R * 0.9, R * 0.35, R * 1.8);
    ctx.fillStyle = C.b; ctx.fillRect(cx + R * 1.3, cy - R * 0.9, R * 0.35, R * 1.8); ctx.globalAlpha = 1;
    ctx.fillStyle = C.paper; ctx.font = "700 16px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("N", cx - R * 1.475, cy); ctx.fillText("S", cx + R * 1.475, cy);
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    for (let j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(cx - R * 1.28, cy + j * R * 0.25); ctx.lineTo(cx + R * 1.28, cy + j * R * 0.25); ctx.stroke(); arrow(ctx, cx + R * 0.95, cy + j * R * 0.25, cx + R * 1.05, cy + j * R * 0.25, C.line, 1); }
    // coil (end view): a line through centre, perpendicular to its normal; normal at angle th from B (B points +x)
    const nx = Math.cos(th), ny = Math.sin(th), px = -ny, py = nx;
    const s = Math.sin(th), dir = com.v ? (s >= 0 ? 1 : -1) : 1;
    ctx.strokeStyle = C.copper; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + px * R, cy - py * R); ctx.lineTo(cx - px * R, cy + py * R); ctx.stroke();
    const side = (x, y, out) => { dot(ctx, x, y, 11, C.panel); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.stroke(); if (out) dot(ctx, x, y, 3.5, C.ink); else { ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke(); } };
    side(cx + px * R, cy - py * R, dir > 0); side(cx - px * R, cy + py * R, dir < 0);
    arrow(ctx, cx, cy, cx + nx * R * 0.6, cy - ny * R * 0.6, C.muted, 1.5);
    // torque vs angle plot
    const box = { x: half + 60, y: 16, w: W - half - 74, h: hh - 40 };
    const kmax = Math.max(k, 1e-3);
    const ax = axes(ctx, box, { xmin: 0, xmax: 360, ymin: -kmax * 1.2, ymax: kmax * 1.2, C, xlabel: "θ (deg)", ylabel: "T (N·m)", xn: 6 });
    plotFn(ctx, a => { const ss = Math.sin(a * D2R); return k * ss * (com.v ? (ss >= 0 ? 1 : -1) : 1); }, 0, 360, ax.X, ax.Y, C.copper, 2.5);
    const ad = ((th / D2R) % 360 + 360) % 360;
    dot(ctx, ax.X(ad), ax.Y(k * Math.sin(ad * D2R) * (com.v ? (Math.sin(ad * D2R) >= 0 ? 1 : -1) : 1)), 5, C.ink);
    ro("tp", k.toFixed(3) + " N·m"); ro("tavg", (com.v ? 2 * k / Math.PI : 0).toFixed(3) + " N·m", com.v ? "good" : "warn");
    ro("ang", ad.toFixed(0) + "°"); ro("rpm", (w * 60 / TAU).toFixed(0) + " rpm"); ro("dir", com.v ? "reverses each ½ turn" : "fixed DC");
  });
};

/* ------------------------------------------------ DC motor */
SIMS.dcmotor = host => {
  const L = layout(host, [{ label: "Speed and current against time" }, { label: "Torque-speed line with operating point", cls: "short" }]);
  const V = ctl(L.ctrls, { key: "v", label: "Supply voltage", min: 0, max: 24, step: 0.5, value: 12, unit: "V" });
  const TL = ctl(L.ctrls, { key: "tl", label: "Load torque", min: 0, max: 1.5, step: 0.05, value: 0.2, unit: "N·m", fmt: v => v.toFixed(2) });
  const lim = toggle(L.ctrls, "Current limit 20 A (soft-start)", false);
  const rs = h("button", { class: "btn small", type: "button" }, "Restart from standstill"); L.ctrls.appendChild(rs);
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Motor: R = 0.5 Ω, L = 1 mH, K = 0.05 V·s/rad, J = 1×10⁻⁴ kg·m². Shown at ¼ real time."));
  legend(L.stage, [["var(--copper)", "speed (rpm)"], ["var(--ph-b)", "current (A)"]]);
  const ro = readouts(L.stage, [["rpm", "Speed"], ["i", "Current"], ["t", "Torque"], ["po", "P out"], ["eff", "Efficiency"], ["pk", "Peak current"]]);
  const R = 0.5, Lm = 1e-3, K = 0.05, J = 1e-4, Bf = 2e-5;
  let w = 0, i = 0, tsim = 0, peak = 0; const buf = [];
  rs.addEventListener("click", () => { w = 0; i = 0; peak = 0; buf.length = 0; tsim = 0; });
  animate(dt => {
    const steps = 400, h_ = dt * 0.25 / steps;
    for (let s = 0; s < steps; s++) {
      let v = V.v;
      if (lim.v) { const vmax = K * w + 20 * R; v = Math.min(v, vmax); }
      i += (v - R * i - K * w) / Lm * h_;
      const T = K * i, tl = w > 0.01 ? TL.v : Math.min(TL.v, Math.max(0, T));
      w += (T - tl - Bf * w) / J * h_; if (w < 0) w = 0;
      tsim += h_; peak = Math.max(peak, i);
      if (s % 40 === 0) buf.push([tsim, w * 60 / TAU, i]);
    }
    while (buf.length && buf[0][0] < tsim - 0.4) buf.shift();
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h, 50, 46), { xmin: -0.4, xmax: 0, ymin: 0, ymax: 5000, C, xlabel: "time (s)", ylabel: "rpm", xfmt: v => v.toFixed(1) });
    plotLine(g.ctx, buf.map(b => b[0] - tsim), buf.map(b => b[1]), ax.X, ax.Y, C.copper, 2);
    const box = pad(g.w, g.h, 50, 46), Yi = v => box.y + box.h - v / 50 * box.h;
    plotLine(g.ctx, buf.map(b => b[0] - tsim), buf.map(b => b[2]), ax.X, Yi, C.b, 2);
    g.ctx.fillStyle = C.b; g.ctx.textAlign = "left"; g.ctx.textBaseline = "middle"; g.ctx.font = "11px ui-monospace, Menlo, monospace";
    [0, 10, 20, 30, 40, 50].forEach(v => g.ctx.fillText(v + " A", box.x + box.w + 4, Yi(v)));
    g = fitCanvas(L.cvs[1]);
    const w0 = V.v / K, Ts = K * V.v / R;
    const a2 = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 5000, ymin: 0, ymax: 2.6, C, xlabel: "speed (rpm)", ylabel: "T (N·m)", yn: 3 });
    plotLine(g.ctx, [0, w0 * 60 / TAU], [Ts, 0], a2.X, a2.Y, C.copper, 2);
    plotLine(g.ctx, [0, 5000], [TL.v, TL.v], a2.X, a2.Y, C.muted, 1, [4, 4]);
    dot(g.ctx, a2.X(w * 60 / TAU), a2.Y(K * i), 5, C.ink);
    const Po = TL.v * w, Pi = V.v * i;
    ro("rpm", (w * 60 / TAU).toFixed(0) + " rpm"); ro("i", i.toFixed(2) + " A", i > 30 ? "bad" : "");
    ro("t", (K * i).toFixed(3) + " N·m"); ro("po", Po.toFixed(1) + " W"); ro("eff", Pi > 0.5 ? (100 * Po / Pi).toFixed(1) + " %" : "–");
    ro("pk", peak.toFixed(1) + " A", peak > 30 ? "bad" : "good");
  });
};

/* ------------------------------------------------ BLDC six-step */
SIMS.sixstep = host => {
  const L = layout(host, [{ label: "BLDC rotor, Hall sensors and the energised stator vector", cls: "tall" }]);
  const Tq = ctl(L.ctrls, { key: "d", label: "Duty (torque)", min: 0, max: 1, step: 0.05, value: 0.5, fmt: v => (v * 100).toFixed(0) + " %" });
  const Ld = ctl(L.ctrls, { key: "l", label: "Load", min: 0, max: 0.8, step: 0.05, value: 0.2, fmt: v => (v * 100).toFixed(0) + " %" });
  const swap = toggle(L.ctrls, "Wrong Hall order (H2 ↔ H3)", false);
  const tbl = h("div", { class: "tablewrap" }); L.ctrls.appendChild(tbl);
  const ro = readouts(L.stage, [["hall", "Hall code H1H2H3"], ["sec", "Sector"], ["ph", "Phases"], ["lead", "Field lead angle"], ["spd", "Speed (elec)"], ["tq", "Torque"]]);
  const VEC = [["A", "C", 30], ["B", "C", 90], ["B", "A", 150], ["C", "A", 210], ["C", "B", 270], ["A", "B", 330]];
  const hallOf = th => [Math.cos(th) > 0, Math.cos(th - TAU / 3) > 0, Math.cos(th - 2 * TAU / 3) > 0].map(Number);
  const codeOf = hb => hb[0] * 4 + hb[1] * 2 + hb[2];
  const sectorOf = th => Math.floor((((th / D2R + 30) % 360) + 360) % 360 / 60);
  const table = {}; for (let s = 0; s < 6; s++) table[codeOf(hallOf((s * 60) * D2R))] = s;
  tbl.innerHTML = `<table class="prog" style="font-size:.78rem"><thead><tr><th>Hall</th><th>High</th><th>Low</th></tr></thead><tbody>${[0, 1, 2, 3, 4, 5].map(s => { const c = codeOf(hallOf(s * 60 * D2R)); const v = VEC[(s + 1) % 6]; return `<tr data-s="${s}"><td class="n">${c.toString(2).padStart(3, "0")}</td><td>${v[0]}</td><td>${v[1]}</td></tr>`; }).join("")}</tbody></table>`;
  let th = 0.2, w = 0; const tqBuf = [];
  animate(dt => {
    let hb = hallOf(th); if (swap.v) hb = [hb[0], hb[2], hb[1]];
    const code = codeOf(hb), s = table[code] !== undefined ? table[code] : 0;
    const v = VEC[(s + 1) % 6], va = v[2] * D2R;
    const T = Tq.v * Math.sin(va - th);
    const J = 0.02, load = Ld.v * 0.5 * Math.sign(w || 1);
    const sub = 10;
    for (let i = 0; i < sub; i++) { w += (T - load * (Math.abs(w) > 0.05 ? 1 : 0) - 0.05 * w) / J * dt / sub; th += w * dt / sub; }
    w = Math.max(-30, Math.min(30, w));
    tqBuf.push(T); if (tqBuf.length > 240) tqBuf.shift();
    tbl.querySelectorAll("tr[data-s]").forEach(r => r.style.background = (+r.dataset.s === s) ? "var(--copper-soft)" : "");
    const C = themeColors(), { ctx, w: W, h: hh } = fitCanvas(L.cvs[0]);
    const half = Math.min(W * 0.5, 380), cx = half / 2 + 10, cy = hh / 2, R = Math.min(half, hh) * 0.4;
    const pc = { A: C.r, B: C.y, C: C.b };
    ctx.strokeStyle = C.line; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    [["A", 0], ["B", 120], ["C", 240]].forEach(([n, a]) => {
      const st = n === v[0] ? "+" : n === v[1] ? "−" : "float";
      const x = cx + Math.cos(-a * D2R) * R, y = cy + Math.sin(-a * D2R) * R;
      ctx.globalAlpha = st === "float" ? 0.3 : 1; dot(ctx, x, y, 14, pc[n]); ctx.globalAlpha = 1;
      ctx.fillStyle = C.paper; ctx.font = "700 13px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n + (st === "float" ? "" : st), x, y);
    });
    for (let k = 0; k < 3; k++) {
      const a = (k * 120 - 90 + 30) * D2R, x = cx + Math.cos(-a) * R * 0.78, y = cy + Math.sin(-a) * R * 0.78;
      ctx.fillStyle = hb[k] ? C.good : C.line; ctx.fillRect(x - 9, y - 7, 18, 14);
      ctx.fillStyle = hb[k] ? C.paper : C.muted; ctx.font = "600 10px ui-monospace, Menlo, monospace"; ctx.fillText("H" + (k + 1), x, y + 1);
    }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-th);
    ctx.fillStyle = C.copper; ctx.fillRect(0, -R * 0.14, R * 0.55, R * 0.28); ctx.globalAlpha = .35; ctx.fillRect(-R * 0.55, -R * 0.14, R * 0.55, R * 0.28); ctx.globalAlpha = 1;
    ctx.fillStyle = C.paper; ctx.font = "700 13px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("N", R * 0.38, 1); ctx.restore();
    arrow(ctx, cx, cy, cx + Math.cos(-va) * R * 0.7, cy + Math.sin(-va) * R * 0.7, C.ink, 3.5);
    const box = { x: half + 60, y: 16, w: W - half - 74, h: hh - 40 };
    const ax = axes(ctx, box, { xmin: -240, xmax: 0, ymin: -1, ymax: 1, C, xlabel: "frames", ylabel: "torque (pu)", yn: 4 });
    plotLine(ctx, tqBuf.map((_, i) => i - tqBuf.length), tqBuf, ax.X, ax.Y, C.copper, 2);
    let lead = ((va - th) / D2R) % 360; lead = ((lead + 540) % 360) - 180;
    ro("hall", code.toString(2).padStart(3, "0"), code === 0 || code === 7 ? "bad" : ""); ro("sec", s + 1);
    ro("ph", `${v[0]}+ ${v[1]}−`); ro("lead", lead.toFixed(0) + "°", Math.abs(lead) > 120 || lead < 0 ? "bad" : Math.abs(lead) < 55 ? "warn" : "good");
    ro("spd", (w / TAU).toFixed(2) + " rev/s", w < -0.1 ? "bad" : ""); ro("tq", T.toFixed(2) + " pu", T < 0 ? "bad" : "");
  });
};

/* ------------------------------------------------ PMSM torque vs current angle */
SIMS.pmsmtorque = host => {
  const L = layout(host, [{ label: "Torque against current angle: magnet, reluctance and total" }, { label: "Current vector in the d-q plane with the MTPA path", cls: "short" }]);
  const Is = ctl(L.ctrls, { key: "is", label: "Current |I|", min: 10, max: 200, step: 5, value: 120, unit: "A" });
  const lam = ctl(L.ctrls, { key: "lam", label: "Magnet flux λm", min: 0.02, max: 0.12, step: 0.005, value: 0.05, unit: "Wb", fmt: v => v.toFixed(3) });
  const Ld = ctl(L.ctrls, { key: "ld", label: "Ld", min: 0.1, max: 1, step: 0.05, value: 0.2, unit: "mH", fmt: v => v.toFixed(2) });
  const Lq = ctl(L.ctrls, { key: "lq", label: "Lq", min: 0.1, max: 1.5, step: 0.05, value: 0.5, unit: "mH", fmt: v => v.toFixed(2) });
  const beta = ctl(L.ctrls, { key: "b", label: "Your current angle β", min: -80, max: 80, step: 1, value: 0, unit: "°" });
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "p = 4 pole pairs. β is measured from the q-axis toward negative d: i<sub>d</sub> = −|I| sin β, i<sub>q</sub> = |I| cos β."));
  legend(L.stage, [["var(--ph-b)", "magnet torque"], ["var(--ph-y)", "reluctance torque"], ["var(--copper)", "total"]]);
  const ro = readouts(L.stage, [["mtpa", "MTPA angle"], ["tmax", "Max torque"], ["t0", "Torque at id = 0"], ["gain", "MTPA gain"], ["you", "Your torque"], ["idq", "Your id / iq"]]);
  animate(() => {
    const p = 4, dL = (Ld.v - Lq.v) * 1e-3, I = Is.v, lm = lam.v;
    const Tm = b => 1.5 * p * lm * I * Math.cos(b * D2R), Tr = b => 1.5 * p * dL * (-I * Math.sin(b * D2R)) * (I * Math.cos(b * D2R)), Tt = b => Tm(b) + Tr(b);
    let bb = 0, tb = -1e9; for (let b = -89; b <= 89; b += 0.25) { const t = Tt(b); if (t > tb) { tb = t; bb = b; } }
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]);
    const ymax = Math.max(5, tb * 1.15), ymin = Math.min(0, -0.3 * ymax);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: -90, xmax: 90, ymin, ymax, C, xlabel: "β (deg)", ylabel: "T (N·m)" });
    plotFn(g.ctx, Tm, -90, 90, ax.X, ax.Y, C.b, 1.5); plotFn(g.ctx, Tr, -90, 90, ax.X, ax.Y, C.y, 1.5); plotFn(g.ctx, Tt, -90, 90, ax.X, ax.Y, C.copper, 2.5);
    g.ctx.strokeStyle = C.copper; g.ctx.setLineDash([3, 3]); g.ctx.beginPath(); g.ctx.moveTo(ax.X(bb), ax.Y(ymin)); g.ctx.lineTo(ax.X(bb), ax.Y(tb)); g.ctx.stroke(); g.ctx.setLineDash([]);
    dot(g.ctx, ax.X(bb), ax.Y(tb), 5, C.copper); dot(g.ctx, ax.X(beta.v), ax.Y(Tt(beta.v)), 5, C.ink);
    g = fitCanvas(L.cvs[1]);
    const box = pad(g.w, g.h), sc = Math.min(box.w / 2, box.h) / 210;
    const cx = box.x + box.w / 2 + box.w * 0.15, cy = box.y + box.h;
    const ctx = g.ctx;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(box.x, cy - 1); ctx.lineTo(box.x + box.w, cy - 1); ctx.moveTo(cx, cy); ctx.lineTo(cx, box.y); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "left"; ctx.fillText("iq", cx + 4, box.y + 8); ctx.fillText("−id", box.x + 2, cy - 8);
    ctx.beginPath(); ctx.arc(cx, cy, I * sc, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = C.copper; ctx.lineWidth = 2; ctx.beginPath();
    for (let ii = 5; ii <= 200; ii += 5) { let b2 = 0, t2 = -1e9; for (let b = -89; b <= 89; b += 0.5) { const t = 1.5 * p * (lm * ii * Math.cos(b * D2R) + dL * (-ii * Math.sin(b * D2R)) * ii * Math.cos(b * D2R)); if (t > t2) { t2 = t; b2 = b; } } const x = cx - ii * Math.sin(b2 * D2R) * sc, y = cy - ii * Math.cos(b2 * D2R) * sc; ii === 5 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    arrow(ctx, cx, cy, cx - I * Math.sin(beta.v * D2R) * sc, cy - I * Math.cos(beta.v * D2R) * sc, C.ink, 2.5);
    ro("mtpa", bb.toFixed(1) + "°"); ro("tmax", tb.toFixed(1) + " N·m"); ro("t0", Tt(0).toFixed(1) + " N·m");
    ro("gain", "+" + ((tb / Math.max(1e-6, Tt(0)) - 1) * 100).toFixed(1) + " %", "good");
    ro("you", Tt(beta.v).toFixed(1) + " N·m", Math.abs(beta.v - bb) < 3 ? "good" : "");
    ro("idq", `${(-I * Math.sin(beta.v * D2R)).toFixed(0)} / ${(I * Math.cos(beta.v * D2R)).toFixed(0)} A`);
  });
};

/* ------------------------------------------------ PWM / buck */
SIMS.pwm = host => {
  const L = layout(host, [{ label: "Switch-node voltage and inductor current" }]);
  const Vin = ctl(L.ctrls, { key: "vin", label: "Vin", min: 12, max: 60, step: 1, value: 48, unit: "V" });
  const Dt = ctl(L.ctrls, { key: "d", label: "Duty D", min: 0.05, max: 0.95, step: 0.01, value: 0.25, fmt: v => (v * 100).toFixed(0) + " %" });
  const F = ctl(L.ctrls, { key: "f", label: "Switching freq", min: 5, max: 200, step: 5, value: 50, unit: "kHz" });
  const Lh = ctl(L.ctrls, { key: "l", label: "Inductance", min: 5, max: 220, step: 1, value: 47, unit: "µH" });
  const Io = ctl(L.ctrls, { key: "io", label: "Load current", min: 0, max: 20, step: 0.5, value: 5, unit: "A" });
  legend(L.stage, [["var(--muted)", "switch node v_sw"], ["var(--copper)", "inductor current i_L"]]);
  const ro = readouts(L.stage, [["vo", "Vout"], ["di", "ΔI p-p"], ["imin", "I min"], ["imax", "I max"], ["rip", "Ripple / Iload"], ["mode", "Mode"]]);
  animate(() => {
    const D = Dt.v, f = F.v * 1e3, Lv = Lh.v * 1e-6, vo = D * Vin.v, dI = (Vin.v - vo) * D / (Lv * f);
    const C = themeColors(), g = fitCanvas(L.cvs[0]), box = pad(g.w, g.h, 50, 50);
    const ax = axes(g.ctx, box, { xmin: 0, xmax: 3, ymin: -2, ymax: 62, C, xlabel: "switching periods", ylabel: "V", yn: 4 });
    const xs = [], ys = [], ys2 = [];
    for (let i = 0; i <= 600; i++) { const x = i / 200, ph = x % 1; xs.push(x); ys.push(ph < D ? Vin.v : 0); ys2.push(ph < D ? Io.v - dI / 2 + dI * ph / D : Io.v + dI / 2 - dI * (ph - D) / (1 - D)); }
    plotLine(g.ctx, xs, ys, ax.X, ax.Y, C.muted, 1.5);
    plotLine(g.ctx, [0, 3], [vo, vo], ax.X, ax.Y, C.muted, 1, [4, 4]);
    const imx = Math.max(25, Io.v + dI), imn = Math.min(-5, Io.v - dI);
    const Yi = v => box.y + box.h - (v - imn) / (imx - imn) * box.h;
    g.ctx.strokeStyle = C.line; g.ctx.setLineDash([2, 3]); g.ctx.beginPath(); g.ctx.moveTo(box.x, Yi(0)); g.ctx.lineTo(box.x + box.w, Yi(0)); g.ctx.stroke(); g.ctx.setLineDash([]);
    plotLine(g.ctx, xs, ys2, ax.X, Yi, C.copper, 2.5);
    g.ctx.fillStyle = C.copper; g.ctx.font = "11px ui-monospace, Menlo, monospace"; g.ctx.textAlign = "left"; g.ctx.textBaseline = "middle";
    for (let v = Math.ceil(imn / 5) * 5; v <= imx; v += 5) g.ctx.fillText(v + " A", box.x + box.w + 4, Yi(v));
    const imin = Io.v - dI / 2;
    ro("vo", vo.toFixed(2) + " V"); ro("di", dI.toFixed(2) + " A"); ro("imin", imin.toFixed(2) + " A", imin < 0 ? "warn" : "");
    ro("imax", (Io.v + dI / 2).toFixed(2) + " A"); ro("rip", Io.v > 0 ? (dI / Io.v * 100).toFixed(0) + " %" : "–", Io.v > 0 && dI / Io.v > 0.4 ? "warn" : "good");
    ro("mode", imin < 0 ? "negative i (sync) / DCM" : "CCM", imin < 0 ? "warn" : "good");
  });
};

/* ------------------------------------------------ MOSFET losses */
SIMS.mosfetloss = host => {
  const L = layout(host, [{ label: "Loss against switching frequency" }, { label: "Junction temperature against switching frequency", cls: "short" }]);
  const I = ctl(L.ctrls, { key: "i", label: "Current (rms)", min: 5, max: 100, step: 1, value: 30, unit: "A" });
  const V = ctl(L.ctrls, { key: "v", label: "Bus voltage", min: 12, max: 800, step: 4, value: 48, unit: "V" });
  const Rds = ctl(L.ctrls, { key: "r", label: "Rds(on) at 25 °C", min: 1, max: 50, step: 0.5, value: 5, unit: "mΩ" });
  const tsw = ctl(L.ctrls, { key: "t", label: "tr + tf", min: 10, max: 500, step: 10, value: 100, unit: "ns" });
  const fsw = ctl(L.ctrls, { key: "f", label: "Your fsw", min: 5, max: 100, step: 1, value: 20, unit: "kHz" });
  const Rth = ctl(L.ctrls, { key: "th", label: "Rθ junction-ambient", min: 0.5, max: 10, step: 0.1, value: 3, unit: "°C/W", fmt: v => v.toFixed(1) });
  const hot = toggle(L.ctrls, "Use hot Rds(on) (×1.6 at 125 °C)", true);
  legend(L.stage, [["var(--ph-b)", "conduction"], ["var(--ph-y)", "switching"], ["var(--copper)", "total"], ["var(--bad)", "Tj limit 150 °C"]]);
  const ro = readouts(L.stage, [["pc", "P conduction"], ["ps", "P switching"], ["pt", "P total"], ["tj", "Tj (Ta = 40 °C)"], ["fx", "fsw where Psw = Pcond"], ["fmax", "Max fsw for Tj < 150"]]);
  animate(() => {
    const r = Rds.v * 1e-3 * (hot.v ? 1.6 : 1), Pc = I.v * I.v * r, k = 0.5 * V.v * I.v * tsw.v * 1e-9;
    const Ps = f => k * f * 1e3, Pt = f => Pc + Ps(f), Tj = f => 40 + Pt(f) * Rth.v;
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]); const ymax = Math.max(Pt(100) * 1.1, 1);
    let ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 100, ymin: 0, ymax, C, xlabel: "fsw (kHz)", ylabel: "W" });
    plotLine(g.ctx, [0, 100], [Pc, Pc], ax.X, ax.Y, C.b, 2); plotFn(g.ctx, Ps, 0, 100, ax.X, ax.Y, C.y, 2); plotFn(g.ctx, Pt, 0, 100, ax.X, ax.Y, C.copper, 2.5);
    dot(g.ctx, ax.X(fsw.v), ax.Y(Pt(fsw.v)), 5, C.ink);
    g = fitCanvas(L.cvs[1]);
    ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 100, ymin: 25, ymax: Math.max(200, Tj(100) * 1.05), C, xlabel: "fsw (kHz)", ylabel: "Tj °C", yn: 3 });
    plotLine(g.ctx, [0, 100], [150, 150], ax.X, ax.Y, C.bad, 1.5, [5, 4]); plotFn(g.ctx, Tj, 0, 100, ax.X, ax.Y, C.copper, 2.5);
    dot(g.ctx, ax.X(fsw.v), ax.Y(Tj(fsw.v)), 5, C.ink);
    const fx = Pc / k / 1e3, fmax = ((110 / Rth.v) - Pc) / k / 1e3;
    ro("pc", Pc.toFixed(2) + " W"); ro("ps", Ps(fsw.v).toFixed(2) + " W"); ro("pt", Pt(fsw.v).toFixed(2) + " W");
    ro("tj", Tj(fsw.v).toFixed(0) + " °C", Tj(fsw.v) > 150 ? "bad" : Tj(fsw.v) > 110 ? "warn" : "good");
    ro("fx", fx > 1000 ? "> 1 MHz" : fx.toFixed(1) + " kHz"); ro("fmax", fmax <= 0 ? "none: too hot" : fmax > 1000 ? "> 1 MHz" : fmax.toFixed(0) + " kHz", fmax <= 0 ? "bad" : "");
  });
};

/* ------------------------------------------------ SVPWM */
SIMS.svpwm = host => {
  const L = layout(host, [{ label: "SVPWM hexagon, reference vector and phase duty cycles", cls: "tall" }]);
  const M = ctl(L.ctrls, { key: "m", label: "Modulation |Vref| / (Vdc/√3)", min: 0, max: 1.15, step: 0.01, value: 0.85, fmt: v => v.toFixed(2) });
  const spd = ctl(L.ctrls, { key: "s", label: "Rotation speed", min: 0, max: 1, step: 0.02, value: 0.15, fmt: v => v.toFixed(2) + "×" });
  const ang = ctl(L.ctrls, { key: "a", label: "Angle (when speed = 0)", min: 0, max: 359, step: 1, value: 20, unit: "°" });
  legend(L.stage, [["var(--ph-r)", "duty A"], ["var(--ph-y)", "duty B"], ["var(--ph-b)", "duty C"]]);
  const ro = readouts(L.stage, [["sec", "Sector"], ["t1", "T1 / Ts"], ["t2", "T2 / Ts"], ["t0", "T0 / Ts"], ["mode", "Mode"], ["vmax", "|Vref| at 48 V"]]);
  let th = 20 * D2R;
  const VN = ["100", "110", "010", "011", "001", "101"];
  const duty = (m, t) => { const a = m / Math.sqrt(3), v = [0, 1, 2].map(k => a * Math.cos(t - k * TAU / 3)); const off = -(Math.max(...v) + Math.min(...v)) / 2; return v.map(x => Math.max(0, Math.min(1, 0.5 + x + off))); };
  animate(dt => {
    if (spd.v > 0) { th = (th + dt * spd.v * TAU) % TAU; ang.set(Math.round(th / D2R) % 360); } else th = ang.v * D2R;
    const C = themeColors(), { ctx, w: W, h: hh } = fitCanvas(L.cvs[0]);
    const half = Math.min(W * 0.48, 400), cx = half / 2 + 10, cy = hh / 2, R = Math.min(half, hh) * 0.42; // R = 2/3 Vdc
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k <= 6; k++) { const a = k * 60 * D2R, x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    const rc = R * Math.sqrt(3) / 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, rc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let k = 0; k < 6; k++) { const a = k * 60 * D2R; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy - R * Math.sin(a)); ctx.stroke(); ctx.fillText(`V${k + 1} ${VN[k]}`, cx + R * 1.14 * Math.cos(a), cy - R * 1.12 * Math.sin(a)); }
    ctx.fillText("000 / 111", cx, cy + 14);
    const m = M.v, mag = m * rc, sec = Math.floor(th / (60 * D2R)) % 6, ts = th - sec * 60 * D2R;
    const T1 = m * Math.sin(60 * D2R - ts), T2 = m * Math.sin(ts), T0 = 1 - T1 - T2;
    const a1 = sec * 60 * D2R, a2 = (sec + 1) * 60 * D2R;
    const p1x = cx + T1 * R * Math.cos(a1), p1y = cy - T1 * R * Math.sin(a1);
    arrow(ctx, cx, cy, p1x, p1y, C.r, 2); arrow(ctx, p1x, p1y, p1x + T2 * R * Math.cos(a2), p1y - T2 * R * Math.sin(a2), C.b, 2);
    arrow(ctx, cx, cy, cx + mag * Math.cos(th), cy - mag * Math.sin(th), C.copper, 3.5);
    // duty plot
    const box = { x: half + 60, y: 16, w: W - half - 74, h: (hh - 60) * 0.62 };
    const ax = axes(ctx, box, { xmin: 0, xmax: 360, ymin: 0, ymax: 1, C, xlabel: "θ (deg)", ylabel: "duty", xn: 6, yn: 4 });
    [C.r, C.y, C.b].forEach((c, k) => plotFn(ctx, x => duty(m, x * D2R)[k], 0, 360, ax.X, ax.Y, c, 2));
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax.X(th / D2R), box.y); ctx.lineTo(ax.X(th / D2R), box.y + box.h); ctx.stroke();
    // one PWM period pattern (center aligned)
    const d = duty(m, th), py = box.y + box.h + 30, ph = (hh - py - 8) / 3;
    [C.r, C.y, C.b].forEach((c, k) => {
      const y = py + k * ph; ctx.fillStyle = C.line; ctx.fillRect(box.x, y + ph * 0.25, box.w, ph * 0.5);
      ctx.fillStyle = c; const wd = d[k] * box.w; ctx.fillRect(box.x + (box.w - wd) / 2, y + ph * 0.15, wd, ph * 0.7);
      ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText("ABC"[k], box.x - 6, y + ph / 2);
    });
    ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.fillText("one PWM period (center-aligned)", box.x, py - 10);
    ro("sec", sec + 1); ro("t1", T1.toFixed(3)); ro("t2", T2.toFixed(3)); ro("t0", T0.toFixed(3), T0 < 0 ? "bad" : "");
    ro("mode", T0 < 0 ? "overmodulation" : "linear", T0 < 0 ? "bad" : "good"); ro("vmax", (m * 48 / Math.sqrt(3)).toFixed(1) + " V peak");
  });
};

/* ------------------------------------------------ PI step response */
SIMS.pi = host => {
  const L = layout(host, [{ label: "PI loop step response" }]);
  const Kp = ctl(L.ctrls, { key: "kp", label: "Kp", min: 0, max: 20, step: 0.1, value: 2, fmt: v => v.toFixed(1) });
  const Ki = ctl(L.ctrls, { key: "ki", label: "Ki", min: 0, max: 400, step: 1, value: 40 });
  const tau = ctl(L.ctrls, { key: "tau", label: "Plant time constant τ", min: 5, max: 200, step: 1, value: 50, unit: "ms" });
  const Td = ctl(L.ctrls, { key: "td", label: "Loop delay", min: 0, max: 30, step: 0.5, value: 2, unit: "ms" });
  const sat = toggle(L.ctrls, "Actuator limit |u| ≤ 1.5", true);
  const aw = toggle(L.ctrls, "Anti-windup (clamp integrator)", false);
  const pc = h("button", { class: "btn small", type: "button" }, "Pole-cancel: set Ki = Kp/τ"); L.ctrls.appendChild(pc);
  pc.addEventListener("click", () => { Ki.set(Math.min(400, Kp.v / (tau.v / 1000))); });
  legend(L.stage, [["var(--muted)", "setpoint r"], ["var(--copper)", "output y"], ["var(--ph-b)", "control u"]]);
  const ro = readouts(L.stage, [["os", "Overshoot"], ["ts", "Settling (2%)"], ["sse", "Final error"], ["up", "Peak |u|"], ["bw", "Approx. bandwidth"]]);
  animate(() => {
    const T = 0.6, dt = 2e-4, n = Math.round(T / dt), K = 1, ta = tau.v / 1000, dn = Math.round(Td.v / 1000 / dt);
    const ys = [], us = [], ts = [], rs = []; let y = 0, I = 0; const hist = new Array(dn + 1).fill(0);
    let peakU = 0;
    for (let k = 0; k < n; k++) {
      const t = k * dt, r = t < 0.02 ? 0 : t < 0.35 ? 1 : 0.4;
      const ym = hist.length > 1 ? hist[0] : y, e = r - ym;
      let u = Kp.v * e + I + Ki.v * e * dt, us_ = u;
      if (sat.v) us_ = Math.max(-1.5, Math.min(1.5, u));
      if (!(aw.v && sat.v && us_ !== u)) I += Ki.v * e * dt;
      if (aw.v && sat.v) I = Math.max(-1.5, Math.min(1.5, I));
      y += (K * us_ - y) / ta * dt;
      hist.push(y); hist.shift();
      peakU = Math.max(peakU, Math.abs(us_));
      if (k % 10 === 0) { ts.push(t); ys.push(y); us.push(us_); rs.push(r); }
    }
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: T, ymin: -0.5, ymax: 2, C, xlabel: "time (s)", xfmt: v => v.toFixed(1) });
    plotLine(g.ctx, ts, rs, ax.X, ax.Y, C.muted, 1.5, [4, 4]); plotLine(g.ctx, ts, us, ax.X, ax.Y, C.b, 1.5); plotLine(g.ctx, ts, ys, ax.X, ax.Y, C.copper, 2.5);
    // metrics on first step 0.02..0.35
    let ymax = 0, tset = null; const i0 = ts.findIndex(t => t >= 0.02), i1 = ts.findIndex(t => t >= 0.35);
    for (let i = i0; i < i1; i++) ymax = Math.max(ymax, ys[i]);
    for (let i = i1 - 1; i >= i0; i--) if (Math.abs(ys[i] - 1) > 0.02) { tset = ts[i + 1] - 0.02; break; }
    const os = Math.max(0, (ymax - 1) * 100), sse = 1 - ys[i1 - 1];
    ro("os", os.toFixed(1) + " %", os > 25 ? "bad" : os > 10 ? "warn" : "good");
    ro("ts", tset === null || tset > 0.32 ? "not settled" : (tset * 1000).toFixed(0) + " ms", tset === null || tset > 0.32 ? "bad" : "");
    ro("sse", sse.toFixed(3), Math.abs(sse) > 0.02 ? "warn" : "good"); ro("up", peakU.toFixed(2), sat.v && peakU >= 1.499 ? "warn" : "");
    ro("bw", (Kp.v / ta / TAU).toFixed(1) + " Hz");
  });
};

/* ------------------------------------------------ Clarke / Park */
SIMS.clarkepark = host => {
  const L = layout(host, [{ label: "Phase currents a, b, c", cls: "short" }, { label: "Alpha-beta plane with rotating d-q axes, and the d and q currents over time" }]);
  const idT = ctl(L.ctrls, { key: "id", label: "True id", min: -10, max: 10, step: 0.5, value: 0, unit: "A" });
  const iqT = ctl(L.ctrls, { key: "iq", label: "True iq", min: -10, max: 10, step: 0.5, value: 8, unit: "A" });
  const err = ctl(L.ctrls, { key: "e", label: "Angle error Δθ", min: -90, max: 90, step: 1, value: 0, unit: "°" });
  const off = ctl(L.ctrls, { key: "o", label: "Offset on phase a", min: -3, max: 3, step: 0.1, value: 0, unit: "A", fmt: v => v.toFixed(1) });
  const gb = ctl(L.ctrls, { key: "g", label: "Gain on phase b", min: 0.7, max: 1.3, step: 0.01, value: 1, fmt: v => v.toFixed(2) + "×" });
  const spd = ctl(L.ctrls, { key: "s", label: "Electrical speed", min: 0.05, max: 1.5, step: 0.05, value: 0.4, unit: "Hz (slow-mo)", fmt: v => v.toFixed(2) });
  legend(L.stage, [["var(--ph-r)", "a"], ["var(--ph-y)", "b"], ["var(--ph-b)", "c"], ["var(--copper)", "id measured"], ["var(--good)", "iq measured"]]);
  const ro = readouts(L.stage, [["ab", "iα / iβ"], ["dq", "id / iq measured"], ["rip", "dq ripple p-p"], ["th", "θe"]]);
  let th = 0; const hist = [];
  animate(dt => {
    th = (th + dt * TAU * spd.v) % TAU;
    const abc = t => { const ia = idT.v * Math.cos(t) - iqT.v * Math.sin(t), ib_ = idT.v * Math.sin(t) + iqT.v * Math.cos(t); return [ia, -ia / 2 + Math.sqrt(3) / 2 * ib_, -ia / 2 - Math.sqrt(3) / 2 * ib_]; };
    const meas = t => { const [a, b] = abc(t); const am = a + off.v, bm = b * gb.v; const al = am, be = (am + 2 * bm) / Math.sqrt(3); const te = t + err.v * D2R; return [al, be, al * Math.cos(te) + be * Math.sin(te), -al * Math.sin(te) + be * Math.cos(te)]; };
    const m = meas(th); hist.push([m[2], m[3]]); if (hist.length > 360) hist.shift();
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]);
    let ax = axes(g.ctx, pad(g.w, g.h), { xmin: -2, xmax: 0, ymin: -14, ymax: 14, C, xlabel: "cycles (past → now)", yn: 4 });
    [C.r, C.y, C.b].forEach((c, k) => plotFn(g.ctx, x => abc(th + TAU * x)[k], -2, 0, ax.X, ax.Y, c, 2));
    g = fitCanvas(L.cvs[1]); const ctx = g.ctx;
    const sq = Math.min(g.h - 20, g.w * 0.42), R = sq * 0.45, cx = 10 + sq / 2, cy = g.h / 2, sc = R / 14;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.fillText("α", cx + R - 8, cy - 6); ctx.fillText("β", cx + 4, cy - R + 8);
    ctx.strokeStyle = C.copper; ctx.globalAlpha = .5; ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const mm = meas(th - TAU * i / 120); const x = cx + mm[0] * sc, y = cy - mm[1] * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.globalAlpha = 1;
    const te = th + err.v * D2R;
    ctx.setLineDash([4, 3]); ctx.strokeStyle = C.copper; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(te) * R, cy - Math.sin(te) * R); ctx.stroke();
    ctx.strokeStyle = C.good; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - Math.sin(te) * R, cy - Math.cos(te) * R); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.copper; ctx.fillText("d", cx + Math.cos(te) * R * 1.05, cy - Math.sin(te) * R * 1.05); ctx.fillStyle = C.good; ctx.fillText("q", cx - Math.sin(te) * R * 1.05, cy - Math.cos(te) * R * 1.05);
    arrow(ctx, cx, cy, cx + m[0] * sc, cy - m[1] * sc, C.ink, 2.5);
    const box = { x: sq + 60, y: 14, w: g.w - sq - 72, h: g.h - 36 };
    ax = axes(ctx, box, { xmin: -360, xmax: 0, ymin: -14, ymax: 14, C, xlabel: "frames", ylabel: "A", yn: 4 });
    plotLine(ctx, hist.map((_, i) => i - hist.length), hist.map(x => x[0]), ax.X, ax.Y, C.copper, 2);
    plotLine(ctx, hist.map((_, i) => i - hist.length), hist.map(x => x[1]), ax.X, ax.Y, C.good, 2);
    let mn = 1e9, mx = -1e9; for (let i = 0; i < 60; i++) { const mm = meas(TAU * i / 60); mn = Math.min(mn, mm[3]); mx = Math.max(mx, mm[3]); }
    ro("ab", `${m[0].toFixed(1)} / ${m[1].toFixed(1)} A`); ro("dq", `${m[2].toFixed(2)} / ${m[3].toFixed(2)} A`, Math.abs(m[2] - idT.v) > 0.5 ? "warn" : "");
    ro("rip", (mx - mn).toFixed(2) + " A", mx - mn > 0.1 ? "bad" : "good"); ro("th", (th / D2R).toFixed(0) + "°");
  });
};

/* ------------------------------------------------ FOC lab (embedded) */
SIMS.foc = host => mountLab(host, { compact: true });
SIMS.focfaults = host => mountLab(host, { compact: true, learning: true });

/* ------------------------------------------------ ADC sampling */
SIMS.adc = host => {
  const L = layout(host, [{ label: "PWM carrier, gate signal, phase current and ADC sample point", cls: "tall" }]);
  const sp = ctl(L.ctrls, { key: "sp", label: "ADC trigger point", min: 0, max: 1, step: 0.005, value: 0.5, fmt: v => (v * 100).toFixed(1) + " % of period" });
  const Dt = ctl(L.ctrls, { key: "d", label: "High-side duty", min: 0.1, max: 0.9, step: 0.01, value: 0.4, fmt: v => (v * 100).toFixed(0) + " %" });
  const rip = ctl(L.ctrls, { key: "r", label: "Ripple p-p", min: 0, max: 8, step: 0.1, value: 3, unit: "A", fmt: v => v.toFixed(1) });
  const ring = ctl(L.ctrls, { key: "g", label: "Edge ringing", min: 0, max: 6, step: 0.1, value: 3, unit: "A", fmt: v => v.toFixed(1) });
  const low = toggle(L.ctrls, "Low-side shunt (sees current only while low FET is on)", true);
  const ro = readouts(L.stage, [["avg", "True average"], ["meas", "ADC reads"], ["err", "Error"], ["win", "Shunt window"]]);
  animate(() => {
    const I0 = 10, D = Dt.v, dI = rip.v;
    const curr = ph => { // high-side on centred at 0 (ph in [0,1)); |ph-0| < D/2
      const p = ((ph % 1) + 1) % 1;
      // rises while the high FET is on (around p = 0), falls while the low FET is on; crosses I0 at both window centres
      let base;
      if (p >= D / 2 && p <= 1 - D / 2) base = I0 + dI / 2 - dI * (p - D / 2) / (1 - D);
      else { const q = p < 0.5 ? p + 1 : p; base = I0 - dI / 2 + dI * (q - (1 - D / 2)) / D; }
      const e1 = Math.abs(p - D / 2), e2 = Math.abs(p - (1 - D / 2));
      const rg = (e, s) => e < 0.12 && s >= 0 ? ring.v * Math.exp(-s * 40) * Math.sin(s * 160) : 0;
      return base + rg(e1, p - D / 2) + rg(e2, p - (1 - D / 2));
    };
    const lowOn = ph => { const p = ((ph % 1) + 1) % 1; return Math.min(p, 1 - p) >= D / 2; };
    const C = themeColors(), g = fitCanvas(L.cvs[0]), ctx = g.ctx;
    const x0 = 50, w = g.w - 62, H1 = g.h * 0.22, H2 = g.h * 0.12, top = 14;
    const X = ph => x0 + ph / 2 * w;
    // carrier: triangle peak at ph=0.5
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const ph = i / 200, p = ph % 1, tri = 1 - Math.abs(1 - 2 * p); const y = top + H1 - tri * H1; i ? ctx.lineTo(X(ph), y) : ctx.moveTo(X(ph), y); } ctx.stroke();
    const cmpY = top + H1 - (D) * H1; ctx.setLineDash([4, 3]); ctx.strokeStyle = C.copper; ctx.beginPath(); ctx.moveTo(x0, cmpY); ctx.lineTo(x0 + w, cmpY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.muted; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "right"; ctx.fillText("carrier", x0 - 4, top + 8);
    const gy = top + H1 + 14;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 800; i++) { const ph = i / 400, on = !lowOn(ph); const y = gy + (on ? 0 : H2); i ? ctx.lineTo(X(ph), y) : ctx.moveTo(X(ph), y); } ctx.stroke();
    ctx.fillText("high FET", x0 - 4, gy + 6);
    const box = { x: x0, y: gy + H2 + 20, w, h: g.h - (gy + H2 + 20) - 24 };
    const ax = axes(ctx, box, { xmin: 0, xmax: 2, ymin: 0, ymax: 22, C, xlabel: "PWM periods", ylabel: "A", yn: 4, xn: 4 });
    plotLine(ctx, [0, 2], [I0, I0], ax.X, ax.Y, C.muted, 1, [4, 4]);
    plotFn(ctx, ph => low.v && !lowOn(ph) ? 0 : curr(ph), 0, 2, ax.X, ax.Y, C.copper, 2, 1200);
    const s1 = sp.v, s2 = sp.v + 1;
    [s1, s2].forEach(s => { const val = low.v && !lowOn(s) ? 0 : curr(s); ctx.strokeStyle = C.b; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(s), top); ctx.lineTo(X(s), box.y + box.h); ctx.stroke(); dot(ctx, ax.X(s), ax.Y(val), 6, C.b); });
    const val = low.v && !lowOn(s1) ? 0 : curr(s1), e = val - I0;
    ro("avg", I0.toFixed(2) + " A"); ro("meas", val.toFixed(2) + " A"); ro("err", (e >= 0 ? "+" : "") + e.toFixed(2) + " A", Math.abs(e) > 1 ? "bad" : Math.abs(e) > 0.2 ? "warn" : "good");
    ro("win", low.v ? (lowOn(s1) ? "low FET on: valid" : "low FET off: invalid") : "inline sensor", low.v && !lowOn(s1) ? "bad" : "good");
  });
};

/* ------------------------------------------------ ISR timing */
SIMS.timing = host => {
  const L = layout(host, [{ label: "CPU timeline: PWM interrupts, ISR execution and background time" }]);
  const F = ctl(L.ctrls, { key: "f", label: "PWM / ISR rate", min: 5, max: 40, step: 1, value: 20, unit: "kHz" });
  const T = ctl(L.ctrls, { key: "t", label: "FOC ISR time", min: 5, max: 80, step: 1, value: 22, unit: "µs" });
  const J = ctl(L.ctrls, { key: "j", label: "Jitter (±)", min: 0, max: 15, step: 0.5, value: 2, unit: "µs" });
  const pf = toggle(L.ctrls, "printf() in ISR (about 1 ms UART at 115200 every 50th call)", false);
  const sl = toggle(L.ctrls, "Speed loop every 20th ISR (+8 µs)", true);
  legend(L.stage, [["var(--copper)", "ISR"], ["var(--bad)", "overrun / missed tick"], ["var(--line)", "background (comms, telemetry)"]]);
  const ro = readouts(L.stage, [["per", "Period"], ["load", "CPU load"], ["miss", "Missed ticks / s"], ["bg", "Background left"]]);
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let acc = 0, run = null;
  const simulate = () => {
    const per = 1e3 / F.v; // µs
    const N = 400; let t = 0, busy = 0, miss = 0; const blocks = [];
    let end = 0;
    for (let k = 0; k < N; k++) {
      const tick = k * per;
      if (end > tick + per) { miss++; continue; }
      const start = Math.max(tick, end);
      let c = T.v + (rnd() * 2 - 1) * J.v + (sl.v && k % 20 === 0 ? 8 : 0) + (pf.v && k % 50 === 7 ? 1000 : 0);
      end = start + c; busy += c; blocks.push([start, end, end > tick + per, tick]);
    }
    const total = N * per;
    return { per, blocks, miss, load: Math.min(1, busy / total), missPerS: miss / (total * 1e-6) };
  };
  animate(dt => {
    acc += dt; if (!run || acc > 0.6) { run = simulate(); acc = 0; }
    const C = themeColors(), g = fitCanvas(L.cvs[0]), ctx = g.ctx;
    const win = Math.max(run.per * 8, 300), x0 = 50, w = g.w - 62, X = t => x0 + t / win * w;
    const yI = 40, hI = 70, yB = yI + hI + 30, hB = 30;
    ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText("ISR", x0 - 6, yI + hI / 2); ctx.fillText("bkgd", x0 - 6, yB + hB / 2);
    ctx.fillStyle = C.line; ctx.fillRect(x0, yB, w, hB);
    for (let t = 0; t <= win; t += run.per) { ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(t), yI - 14); ctx.lineTo(X(t), yB + hB); ctx.stroke(); arrow(ctx, X(t), yI - 22, X(t), yI - 4, C.muted, 1); }
    // pick window starting at a printf burst if any, else at 0
    let off = 0; if (pf.v) { const b = run.blocks.find(b => b[1] - b[0] > 500); if (b) off = Math.max(0, b[3] - run.per * 2); }
    off = Math.floor(off / run.per) * run.per;
    run.blocks.forEach(([s, e, over, tick]) => {
      if (e < off || s > off + win) return;
      const a = Math.max(s, off) - off, b = Math.min(e, off + win) - off;
      ctx.fillStyle = over ? C.bad : C.copper; ctx.fillRect(X(a), yI, Math.max(1, X(b) - X(a)), hI);
      ctx.fillStyle = C.paper; ctx.fillRect(X(a), yB, Math.max(1, X(b) - X(a)), hB);
    });
    ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let t = 0; t <= win; t += run.per * 2) ctx.fillText(Math.round(t + off) + " µs", X(t), yB + hB + 8);
    ro("per", run.per.toFixed(1) + " µs"); ro("load", (run.load * 100).toFixed(0) + " %", run.load > 0.85 ? "bad" : run.load > 0.7 ? "warn" : "good");
    ro("miss", run.missPerS.toFixed(0), run.miss > 0 ? "bad" : "good"); ro("bg", ((1 - run.load) * 100).toFixed(0) + " %", run.load > 0.85 ? "bad" : "");
  });
};

/* ------------------------------------------------ Thrust / hover power */
const hoverPower = (mass, n, dIn, FM, eta) => { const T = mass * 9.81, A = n * Math.PI * Math.pow(dIn * 0.0254 / 2, 2); const Pi = Math.pow(T, 1.5) / Math.sqrt(2 * 1.225 * A); return { T, A, Pi, Pe: Pi / FM / eta }; };
SIMS.thrust = host => {
  const L = layout(host, [{ label: "Electrical hover power against propeller diameter" }]);
  const m = ctl(L.ctrls, { key: "m", label: "All-up mass", min: 1, max: 200, step: 1, value: 120, unit: "kg" });
  const n = ctl(L.ctrls, { key: "n", label: "Number of rotors", min: 4, max: 16, step: 1, value: 8 });
  const d = ctl(L.ctrls, { key: "d", label: "Rotor diameter", min: 5, max: 40, step: 0.5, value: 30, unit: "in" });
  const FM = ctl(L.ctrls, { key: "fm", label: "Figure of merit", min: 0.5, max: 0.8, step: 0.01, value: 0.7, fmt: v => v.toFixed(2) });
  const eta = ctl(L.ctrls, { key: "e", label: "Motor × ESC efficiency", min: 0.7, max: 0.95, step: 0.01, value: 0.85, fmt: v => v.toFixed(2) });
  const tw = ctl(L.ctrls, { key: "tw", label: "Design T/W", min: 1.3, max: 2.5, step: 0.1, value: 2, fmt: v => v.toFixed(1) });
  const ro = readouts(L.stage, [["dl", "Disc loading"], ["pe", "Hover power (elec)"], ["gw", "Efficiency"], ["pm", "Per rotor (hover)"], ["tmax", "Max thrust / rotor"], ["pmax", "Max power (est.)"]]);
  animate(() => {
    const r = hoverPower(m.v, n.v, d.v, FM.v, eta.v), C = themeColors(), g = fitCanvas(L.cvs[0]);
    const f = dd => hoverPower(m.v, n.v, dd, FM.v, eta.v).Pe / 1000;
    const ymax = Math.min(f(5) * 1.05, Math.max(f(12) * 1.2, r.Pe / 1000 * 1.5));
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 5, xmax: 40, ymin: 0, ymax, C, xlabel: "rotor diameter (in)", ylabel: "kW" });
    plotFn(g.ctx, dd => Math.min(f(dd), ymax), 5, 40, ax.X, ax.Y, C.copper, 2.5);
    dot(g.ctx, ax.X(d.v), ax.Y(Math.min(r.Pe / 1000, ymax)), 6, C.ink);
    const pmax = r.Pe * Math.pow(tw.v, 1.5);
    ro("dl", (r.T / r.A).toFixed(0) + " N/m²", r.T / r.A > 600 ? "warn" : ""); ro("pe", (r.Pe / 1000).toFixed(2) + " kW", r.Pe > 30000 ? "bad" : "");
    ro("gw", (m.v * 1000 / r.Pe).toFixed(2) + " g/W"); ro("pm", (r.Pe / n.v / 1000).toFixed(2) + " kW");
    ro("tmax", (m.v * tw.v / n.v).toFixed(1) + " kgf"); ro("pmax", (pmax / 1000).toFixed(1) + " kW");
  });
};

/* ------------------------------------------------ Sizing loop */
SIMS.sizing = host => {
  const L = layout(host, [{ label: "Sizing iterations: total mass by iteration", cls: "short" }]);
  const rider = ctl(L.ctrls, { key: "r", label: "Rider", min: 50, max: 110, step: 1, value: 80, unit: "kg" });
  const st = ctl(L.ctrls, { key: "s", label: "Structure + wiring", min: 5, max: 60, step: 1, value: 20, unit: "kg" });
  const n = ctl(L.ctrls, { key: "n", label: "Rotors", min: 4, max: 16, step: 1, value: 8 });
  const mm = ctl(L.ctrls, { key: "mm", label: "Motor + ESC + prop each", min: 0.5, max: 6, step: 0.1, value: 2.5, unit: "kg", fmt: v => v.toFixed(1) });
  const d = ctl(L.ctrls, { key: "d", label: "Rotor diameter", min: 10, max: 40, step: 1, value: 30, unit: "in" });
  const tf = ctl(L.ctrls, { key: "t", label: "Flight time", min: 1, max: 30, step: 0.5, value: 8, unit: "min" });
  const ed = ctl(L.ctrls, { key: "e", label: "Pack energy density", min: 100, max: 300, step: 5, value: 170, unit: "Wh/kg" });
  const vb = ctl(L.ctrls, { key: "v", label: "Bus voltage", min: 24, max: 400, step: 4, value: 100, unit: "V" });
  const tblHost = h("div", { class: "tablewrap" }); L.stage.appendChild(tblHost);
  const ro = readouts(L.stage, [["m", "Total mass"], ["bat", "Battery"], ["e", "Pack energy"], ["p", "Hover power"], ["i", "Bus current"], ["im", "Per-rotor current"], ["c", "C-rate"], ["st", "Design closes?"]]);
  animate(() => {
    const base = rider.v + st.v + n.v * mm.v; let m = base; const it = []; let ok = true, P = 0, E = 0, mb = 0;
    for (let k = 0; k < 40; k++) {
      P = hoverPower(m, n.v, d.v, 0.7, 0.85).Pe * 1.15; // +15% control margin
      E = P * tf.v / 60 / 0.8; mb = E / ed.v; const mn = base + mb;
      it.push([k + 1, m, P, E, mb, mn]);
      if (mn > 2000 || !isFinite(mn)) { ok = false; break; }
      if (Math.abs(mn - m) < 0.01) { m = mn; break; }
      m = mn;
    }
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const mx = Math.min(1000, Math.max(...it.map(r => r[5])) * 1.1);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 1, xmax: Math.max(5, it.length), ymin: 0, ymax: mx, C, xlabel: "iteration", ylabel: "kg", yn: 3 });
    plotLine(g.ctx, it.map(r => r[0]), it.map(r => Math.min(r[5], mx)), ax.X, ax.Y, ok ? C.copper : C.bad, 2.5);
    it.forEach(r => dot(g.ctx, ax.X(r[0]), ax.Y(Math.min(r[5], mx)), 3, ok ? C.copper : C.bad));
    tblHost.innerHTML = `<table class="prog"><thead><tr><th>#</th><th>Mass in</th><th>Hover P</th><th>Energy</th><th>Battery</th><th>Mass out</th></tr></thead><tbody>${it.slice(0, 6).map(r => `<tr><td class="n">${r[0]}</td><td class="n">${r[1].toFixed(1)} kg</td><td class="n">${(r[2] / 1000).toFixed(1)} kW</td><td class="n">${(r[3] / 1000).toFixed(2)} kWh</td><td class="n">${r[4].toFixed(1)} kg</td><td class="n">${r[5].toFixed(1)} kg</td></tr>`).join("")}</tbody></table>`;
    ro("m", ok ? m.toFixed(1) + " kg" : "diverges", ok ? "" : "bad"); ro("bat", ok ? mb.toFixed(1) + " kg" : "–"); ro("e", ok ? (E / 1000).toFixed(2) + " kWh" : "–");
    ro("p", ok ? (P / 1000).toFixed(1) + " kW" : "–"); ro("i", ok ? (P / vb.v).toFixed(0) + " A" : "–", ok && P / vb.v > 400 ? "warn" : "");
    ro("im", ok ? (P / vb.v / n.v).toFixed(1) + " A" : "–"); ro("c", ok ? (P / E * 0.8).toFixed(1) + " C" : "–", ok && P / E * 0.8 > 8 ? "bad" : ok && P / E * 0.8 > 5 ? "warn" : "");
    ro("st", ok ? "yes" : "no: mass spiral", ok ? "good" : "bad");
  });
};

/* ------------------------------------------------ Attitude & motor-out */
SIMS.attitude = host => {
  const L = layout(host, [{ label: "Board roll angle against time" }, { label: "Motor thrust commands", cls: "short" }]);
  const cfg = selectCtl(L.ctrls, "Configuration", [["4", "Quad (2 per side)"], ["8", "Octo (4 per side)"]], "8", () => reset());
  const tw = ctl(L.ctrls, { key: "tw", label: "Thrust / weight", min: 1.1, max: 2.5, step: 0.05, value: 1.8, fmt: v => v.toFixed(2) });
  const Kp = ctl(L.ctrls, { key: "kp", label: "Kp (N·m/rad)", min: 0, max: 800, step: 10, value: 300 });
  const Kd = ctl(L.ctrls, { key: "kd", label: "Kd (N·m·s/rad)", min: 0, max: 200, step: 5, value: 80 });
  const dly = ctl(L.ctrls, { key: "dl", label: "Sensor + filter delay", min: 0, max: 120, step: 2, value: 10, unit: "ms" });
  const tm = ctl(L.ctrls, { key: "tm", label: "Motor spin-up τ", min: 10, max: 200, step: 5, value: 60, unit: "ms" });
  const row = h("div", { style: "display:flex;gap:6px;flex-wrap:wrap" });
  const bG = h("button", { class: "btn small", type: "button" }, "Gust"), bF = h("button", { class: "btn small", type: "button" }, "Fail left motor"), bR = h("button", { class: "btn small", type: "button" }, "Reset");
  row.append(bG, bF, bR); L.ctrls.appendChild(row);
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Full-scale model: 120 kg, J = 12 kg·m², arm 0.6 m. One roll axis only."));
  const ro = readouts(L.stage, [["ang", "Roll angle"], ["max", "Peak motor cmd"], ["sat", "Saturated"], ["st", "Status"]]);
  const M = 120, g0 = 9.81, Jr = 12, r = 0.6;
  let s;
  function reset() { const n = +cfg.v; s = { th: 0.02, w: 0, T: new Array(n).fill(M * g0 / n), alive: new Array(n).fill(true), hist: [], buf: [], t: 0, crashed: false, gust: 0 }; }
  reset();
  bR.addEventListener("click", reset);
  bG.addEventListener("click", () => { s.gust = 0.3; });
  bF.addEventListener("click", () => { const i = s.alive.findIndex((a, k) => a && k < s.alive.length / 2); if (i >= 0) s.alive[i] = false; });
  animate(dt => {
    const n = s.T.length, half = n / 2, Tmax = M * g0 * tw.v / n, dtS = 0.0005, steps = Math.round(dt / dtS);
    let satN = 0, cmd = [];
    for (let k = 0; k < steps && !s.crashed; k++) {
      s.buf.push([s.th, s.w]); const dn = Math.max(0, Math.round(dly.v / 1000 / dtS));
      while (s.buf.length > dn + 1) s.buf.shift();
      const [thm, wm] = s.buf[0];
      const tau = -Kp.v * thm - Kd.v * wm;
      const nAlive = s.alive.filter(Boolean).length, base = M * g0 / nAlive;
      const dT = tau / (r * n); satN = 0; cmd = [];
      for (let i = 0; i < n; i++) {
        const sign = i < half ? -1 : 1; // left motors make negative roll torque... right positive
        let c = s.alive[i] ? base + sign * dT : 0;
        if (c > Tmax) { c = Tmax; satN++; } if (c < 0) c = 0; cmd.push(c);
        s.T[i] += (c - s.T[i]) / (tm.v / 1000) * dtS;
      }
      let torque = 0; for (let i = 0; i < n; i++) torque += (i < half ? -1 : 1) * s.T[i] * r;
      if (s.gust > 0) { torque += 400; s.gust -= dtS; }
      s.w += (torque - 2 * s.w) / Jr * dtS; s.th += s.w * dtS; s.t += dtS;
      if (Math.abs(s.th) > 45 * D2R) s.crashed = true;
      if (k % 20 === 0) s.hist.push([s.t, s.th / D2R]);
    }
    while (s.hist.length && s.hist[0][0] < s.t - 6) s.hist.shift();
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: -6, xmax: 0, ymin: -45, ymax: 45, C, xlabel: "time (s)", ylabel: "roll (deg)" });
    plotLine(g.ctx, s.hist.map(p => p[0] - s.t), s.hist.map(p => p[1]), ax.X, ax.Y, s.crashed ? C.bad : C.copper, 2.5);
    g = fitCanvas(L.cvs[1]); const ctx = g.ctx, bw = (g.w - 80) / n;
    ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = 0; i < n; i++) {
      const x = 50 + i * bw, frac = s.T[i] / Tmax, hh = (g.h - 40) * Math.min(1, frac);
      ctx.fillStyle = C.line; ctx.fillRect(x + 4, 10, bw - 8, g.h - 40);
      ctx.fillStyle = !s.alive[i] ? C.bad : frac > 0.98 ? C.warn : C.copper; ctx.fillRect(x + 4, 10 + (g.h - 40) - hh, bw - 8, hh);
      ctx.fillStyle = C.muted; ctx.fillText((i < half ? "L" : "R") + ((i % half) + 1) + (s.alive[i] ? "" : " ✕"), x + bw / 2, g.h - 26);
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText("100%", 46, 10); ctx.fillText("0", 46, g.h - 30);
    const peak = Math.max(...s.T) / Tmax;
    ro("ang", (s.th / D2R).toFixed(1) + "°", Math.abs(s.th / D2R) > 10 ? "bad" : Math.abs(s.th / D2R) > 3 ? "warn" : "good");
    ro("max", (peak * 100).toFixed(0) + " %", peak > 0.98 ? "warn" : ""); ro("sat", satN + " / " + n, satN ? "warn" : "good");
    ro("st", s.crashed ? "LOST CONTROL" : Math.abs(s.w) > 1.5 ? "oscillating" : "stable", s.crashed ? "bad" : Math.abs(s.w) > 1.5 ? "warn" : "good");
  });
};

