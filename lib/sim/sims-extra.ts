// @ts-nocheck
import { h, TAU, D2R, animate, themeColors, fitCanvas, axes, plotLine, plotFn, dot, arrow, ctl, toggle, selectCtl, readouts, legend } from "./runtime";
import { layout, pad, SIMS } from "./sims";

/* Simulations for the additional lessons. */

/* ------------------------------------------------ RL step */
SIMS.rl = host => {
  const L = layout(host, [{ label: "RL step response: current against time" }]);
  const V = ctl(L.ctrls, { key: "v", label: "Step voltage", min: 1, max: 48, step: 1, value: 24, unit: "V" });
  const R = ctl(L.ctrls, { key: "r", label: "Resistance", min: 0.05, max: 2, step: 0.05, value: 0.5, unit: "Ω", fmt: v => v.toFixed(2) });
  const Lm = ctl(L.ctrls, { key: "l", label: "Inductance", min: 0.1, max: 5, step: 0.1, value: 1, unit: "mH", fmt: v => v.toFixed(1) });
  legend(L.stage, [["var(--accent)", "i(t)"], ["var(--muted)", "final value, 63% and τ marks"]]);
  const ro = readouts(L.stage, [["tau", "τ = L/R"], ["If", "Final current"], ["t63", "Time to 63%"], ["t90", "Time to 90%"], ["slope", "di/dt at t = 0"], ["E", "Stored energy"]]);
  animate((dt, now) => {
    const tau = Lm.v * 1e-3 / R.v, If = V.v / R.v, T = 6 * tau;
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: T * 1000, ymin: 0, ymax: If * 1.1, C, xlabel: "time (ms)", ylabel: "A", xfmt: v => v.toFixed(v < 10 ? 1 : 0) });
    const f = t => If * (1 - Math.exp(-t / tau));
    plotLine(g.ctx, [0, T * 1000], [If, If], ax.X, ax.Y, C.muted, 1, [4, 4]);
    plotLine(g.ctx, [0, tau * 1000, tau * 1000], [0.632 * If, 0.632 * If, 0], ax.X, ax.Y, C.muted, 1, [3, 3]);
    plotFn(g.ctx, t => f(t / 1000), 0, T * 1000, ax.X, ax.Y, C.accent, 2.5);
    const tm = ((now * 0.35) % 1) * T;
    dot(g.ctx, ax.X(tm * 1000), ax.Y(f(tm)), 5, C.ink);
    g.ctx.fillStyle = C.muted; g.ctx.font = "11px ui-monospace, Menlo, monospace"; g.ctx.textAlign = "left"; g.ctx.fillText("τ", ax.X(tau * 1000) + 4, ax.Y(0) - 8);
    ro("tau", (tau * 1000).toFixed(2) + " ms"); ro("If", If.toFixed(1) + " A"); ro("t63", (tau * 1000).toFixed(2) + " ms");
    ro("t90", (tau * Math.LN10 * 1000).toFixed(2) + " ms"); ro("slope", (V.v / (Lm.v * 1e-3) / 1000).toFixed(1) + " kA/s");
    ro("E", (0.5 * Lm.v * 1e-3 * If * If).toFixed(2) + " J", 0.5 * Lm.v * 1e-3 * If * If > 5 ? "warn" : "");
  });
};

/* ------------------------------------------------ B-H curve and gap */
SIMS.bh = host => {
  const L = layout(host, [{ label: "Flux density against current for a gapped steel core" }]);
  const N = ctl(L.ctrls, { key: "n", label: "Turns N", min: 10, max: 200, step: 5, value: 100 });
  const I = ctl(L.ctrls, { key: "i", label: "Current I", min: 0, max: 40, step: 0.5, value: 12, unit: "A" });
  const G = ctl(L.ctrls, { key: "g", label: "Airgap g", min: 0.1, max: 3, step: 0.05, value: 0.5, unit: "mm", fmt: v => v.toFixed(2) });
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Core: path 200 mm, area 10 cm², μr(initial) 4000, saturation 1.8 T."));
  legend(L.stage, [["var(--accent)", "with saturation"], ["var(--muted)", "linear steel"]]);
  const ro = readouts(L.stage, [["B", "Flux density B"], ["gapshare", "mmf in the gap"], ["mu", "Steel μr (effective)"], ["Lh", "Inductance"], ["sat", "State"]]);
  const mu0 = 4e-7 * Math.PI, Bs = 1.8, mui = 4000, lc = 0.2, A = 1e-3;
  const Hof = B => Bs / (mui * mu0) * Math.atanh(Math.min(B / Bs, 0.99999));
  const solve = (NI, g) => { let lo = 0, hi = Bs * 0.99999; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; (Hof(m) * lc + m * g / mu0 > NI) ? hi = m : lo = m; } return (lo + hi) / 2; };
  animate(() => {
    const g = G.v * 1e-3, C = themeColors(), c = fitCanvas(L.cvs[0]);
    const ax = axes(c.ctx, pad(c.w, c.h), { xmin: 0, xmax: 40, ymin: 0, ymax: 2, C, xlabel: "current (A)", ylabel: "B (T)" });
    plotLine(c.ctx, [0, 40], [Bs, Bs], ax.X, ax.Y, C.line, 1, [4, 4]);
    plotFn(c.ctx, i => Math.min(2, mu0 * N.v * i / (g + lc / mui)), 0, 40, ax.X, ax.Y, C.muted, 1.5, 100, [5, 4]);
    plotFn(c.ctx, i => solve(N.v * i, g), 0, 40, ax.X, ax.Y, C.accent, 2.5, 120);
    const B = solve(N.v * I.v, g);
    dot(c.ctx, ax.X(I.v), ax.Y(B), 6, C.ink);
    const Hc = Hof(B), gapMmf = B * g / mu0, tot = Hc * lc + gapMmf;
    ro("B", B.toFixed(2) + " T", B > 1.6 ? "bad" : B > 1.4 ? "warn" : "good");
    ro("gapshare", (100 * gapMmf / Math.max(1e-9, tot)).toFixed(0) + " %"); ro("mu", (B / (mu0 * Math.max(Hc, 1e-9))).toFixed(0), B > 1.5 ? "warn" : "");
    ro("Lh", I.v > 0.1 ? (N.v * B * A / I.v * 1000).toFixed(2) + " mH" : "–"); ro("sat", B > 1.6 ? "saturated" : B > 1.4 ? "knee" : "linear", B > 1.6 ? "bad" : B > 1.4 ? "warn" : "good");
  });
};

/* ------------------------------------------------ Kv, Kt, efficiency */
SIMS.kv = host => {
  const L = layout(host, [{ label: "Efficiency and output power against current" }]);
  const Kv = ctl(L.ctrls, { key: "kv", label: "Kv", min: 50, max: 1500, step: 10, value: 190, unit: "rpm/V" });
  const V = ctl(L.ctrls, { key: "v", label: "Supply voltage", min: 12, max: 60, step: 1, value: 24, unit: "V" });
  const R = ctl(L.ctrls, { key: "r", label: "Winding resistance", min: 20, max: 500, step: 5, value: 100, unit: "mΩ" });
  const I0 = ctl(L.ctrls, { key: "i0", label: "No-load current I₀", min: 0.2, max: 5, step: 0.1, value: 1, unit: "A", fmt: v => v.toFixed(1) });
  const Iop = ctl(L.ctrls, { key: "iop", label: "Your operating current", min: 1, max: 100, step: 1, value: 20, unit: "A" });
  legend(L.stage, [["var(--accent)", "efficiency (%)"], ["var(--ph-b)", "output power (% of peak)"]]);
  const ro = readouts(L.stage, [["kt", "Kt"], ["nl", "No-load speed"], ["is", "Stall current"], ["io", "Best-η current"], ["em", "Peak efficiency"], ["you", "η at your current"]]);
  animate(() => {
    const kt = 60 / (TAU * Kv.v), r = R.v / 1000, Ist = V.v / r, Io = Math.sqrt(I0.v * V.v / r);
    const eta = i => i <= I0.v ? 0 : (1 - i * r / V.v) * (1 - I0.v / i) * 100;
    const pout = i => Math.max(0, kt * (i - I0.v) * (Kv.v * (V.v - i * r)) * TAU / 60);
    const xmax = Math.min(Ist * 0.98, Math.max(3 * Io, 20)), pmax = Math.max(1, ...Array.from({ length: 80 }, (_, k) => pout(xmax * k / 79)));
    const C = themeColors(), c = fitCanvas(L.cvs[0]);
    const ax = axes(c.ctx, pad(c.w, c.h), { xmin: 0, xmax: xmax, ymin: 0, ymax: 100, C, xlabel: "current (A)", ylabel: "%" });
    plotFn(c.ctx, i => pout(i) / pmax * 100, 0, xmax, ax.X, ax.Y, C.b, 1.8, 160);
    plotFn(c.ctx, eta, 0, xmax, ax.X, ax.Y, C.accent, 2.5, 200);
    c.ctx.strokeStyle = C.muted; c.ctx.setLineDash([3, 3]); c.ctx.beginPath(); c.ctx.moveTo(ax.X(Io), ax.Y(0)); c.ctx.lineTo(ax.X(Io), ax.Y(eta(Io))); c.ctx.stroke(); c.ctx.setLineDash([]);
    dot(c.ctx, ax.X(Io), ax.Y(eta(Io)), 5, C.accent);
    const io = Math.min(Iop.v, xmax); dot(c.ctx, ax.X(io), ax.Y(eta(io)), 5, C.ink);
    const em = (1 - Math.sqrt(I0.v * r / V.v)) ** 2 * 100;
    ro("kt", kt.toFixed(4) + " N·m/A"); ro("nl", (Kv.v * V.v).toFixed(0) + " rpm"); ro("is", Ist.toFixed(0) + " A", Ist > 300 ? "warn" : "");
    ro("io", Io.toFixed(1) + " A"); ro("em", em.toFixed(1) + " %", em > 85 ? "good" : em < 70 ? "warn" : ""); ro("you", Iop.v > xmax ? "off scale" : eta(Iop.v).toFixed(1) + " %");
  });
};

/* ------------------------------------------------ Induction motor torque-slip */
SIMS.induction = host => {
  const L = layout(host, [{ label: "Torque against speed" }]);
  const Fq = ctl(L.ctrls, { key: "f", label: "Supply frequency", min: 5, max: 60, step: 1, value: 50, unit: "Hz" });
  const Vl = ctl(L.ctrls, { key: "v", label: "Line voltage at 50 Hz", min: 100, max: 460, step: 5, value: 400, unit: "V" });
  const R2 = ctl(L.ctrls, { key: "r2", label: "Rotor resistance R₂", min: 0.1, max: 2, step: 0.05, value: 0.5, unit: "Ω", fmt: v => v.toFixed(2) });
  const TL = ctl(L.ctrls, { key: "tl", label: "Load torque", min: 0, max: 220, step: 5, value: 80, unit: "N·m" });
  const vf = toggle(L.ctrls, "Constant V/f (scale voltage with frequency)", true);
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "4-pole (p = 2). Stator R₁ = 0.5 Ω, leakage X = 2 Ω at 50 Hz. Magnetising branch ignored."));
  legend(L.stage, [["var(--accent)", "motor torque"], ["var(--muted)", "load torque"]]);
  const ro = readouts(L.stage, [["ns", "Synchronous speed"], ["tmax", "Pull-out torque"], ["sm", "Slip at pull-out"], ["op", "Operating speed"], ["slip", "Slip"], ["fr", "Rotor frequency"], ["i", "Phase current"]]);
  animate(() => {
    const f = Fq.v, p = 2, V = vf.v ? Vl.v * f / 50 : Vl.v, Vph = V / Math.sqrt(3), ws = TAU * f / p, ns = 60 * f / p;
    const R1 = 0.5, X = 2 * f / 50, r2 = R2.v;
    const T = s => 3 / ws * Vph * Vph * (r2 / s) / ((R1 + r2 / s) ** 2 + X * X);
    const sm = r2 / Math.sqrt(R1 * R1 + X * X), Tm = T(sm);
    const C = themeColors(), c = fitCanvas(L.cvs[0]);
    const tmaxPlot = Math.max(250, Tm * 1.15), ax = axes(c.ctx, pad(c.w, c.h), { xmin: 0, xmax: 1800, ymin: 0, ymax: tmaxPlot, C, xlabel: "speed (rpm)", ylabel: "N·m" });
    plotFn(c.ctx, n => T(Math.max(1e-4, 1 - n / ns)), 0, ns, ax.X, ax.Y, C.accent, 2.5, 240);
    plotLine(c.ctx, [0, 1800], [TL.v, TL.v], ax.X, ax.Y, C.muted, 1.5, [5, 4]);
    let op = null;
    if (TL.v < Tm) { let lo = 1e-4, hi = sm; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; T(m) > TL.v ? hi = m : lo = m; } op = (lo + hi) / 2; }
    if (op) dot(c.ctx, ax.X(ns * (1 - op)), ax.Y(TL.v), 6, C.ink);
    ro("ns", ns.toFixed(0) + " rpm"); ro("tmax", Tm.toFixed(0) + " N·m"); ro("sm", (sm * 100).toFixed(1) + " %");
    if (op) {
      const Iph = Vph / Math.sqrt((R1 + r2 / op) ** 2 + X * X);
      ro("op", (ns * (1 - op)).toFixed(0) + " rpm", "good"); ro("slip", (op * 100).toFixed(2) + " %"); ro("fr", (op * f).toFixed(2) + " Hz"); ro("i", Iph.toFixed(1) + " A", Iph > 40 ? "warn" : "");
    } else { ro("op", "stalls", "bad"); ro("slip", "–"); ro("fr", "–"); ro("i", "–"); }
  });
};

/* ------------------------------------------------ Boost converter */
SIMS.boost = host => {
  const L = layout(host, [{ label: "Boost converter: switch node and inductor current" }]);
  const Vin = ctl(L.ctrls, { key: "vin", label: "Vin", min: 12, max: 60, step: 1, value: 36, unit: "V" });
  const D = ctl(L.ctrls, { key: "d", label: "Duty D", min: 0.05, max: 0.9, step: 0.01, value: 0.4, fmt: v => (v * 100).toFixed(0) + " %" });
  const F = ctl(L.ctrls, { key: "f", label: "Switching frequency", min: 10, max: 200, step: 5, value: 40, unit: "kHz" });
  const Lh = ctl(L.ctrls, { key: "l", label: "Inductance", min: 5, max: 220, step: 1, value: 22, unit: "µH" });
  const Io = ctl(L.ctrls, { key: "io", label: "Output current", min: 0, max: 20, step: 0.5, value: 5, unit: "A" });
  legend(L.stage, [["var(--muted)", "switch node"], ["var(--accent)", "inductor current"]]);
  const ro = readouts(L.stage, [["vo", "Vout"], ["il", "Average inductor current"], ["di", "ΔI p-p"], ["imin", "I min"], ["pin", "Power"], ["mode", "Mode"]]);
  animate(() => {
    const d = D.v, vo = Vin.v / (1 - d), il = Io.v / (1 - d), di = Vin.v * d / (Lh.v * 1e-6 * F.v * 1e3);
    const C = themeColors(), g = fitCanvas(L.cvs[0]), box = pad(g.w, g.h, 50, 50);
    const vmax = Math.max(vo * 1.15, 20), ax = axes(g.ctx, box, { xmin: 0, xmax: 3, ymin: 0, ymax: vmax, C, xlabel: "switching periods", ylabel: "V", yn: 4 });
    const xs = [], vs = [], is = [];
    for (let k = 0; k <= 600; k++) { const x = k / 200, p = x % 1; xs.push(x); vs.push(p < d ? 0 : vo); is.push(p < d ? il - di / 2 + di * p / d : il + di / 2 - di * (p - d) / (1 - d)); }
    plotLine(g.ctx, xs, vs, ax.X, ax.Y, C.muted, 1.5);
    const imx = Math.max(10, il + di), Yi = v => box.y + box.h - v / imx * box.h;
    plotLine(g.ctx, xs, is, ax.X, Yi, C.accent, 2.5);
    g.ctx.fillStyle = C.accent; g.ctx.font = "11px ui-monospace, Menlo, monospace"; g.ctx.textAlign = "left"; g.ctx.textBaseline = "middle";
    for (let v = 0; v <= imx; v += imx > 40 ? 20 : 10) g.ctx.fillText(v + " A", box.x + box.w + 4, Yi(v));
    const imin = il - di / 2;
    ro("vo", vo.toFixed(1) + " V", vo > 100 ? "warn" : ""); ro("il", il.toFixed(2) + " A"); ro("di", di.toFixed(2) + " A", di / il > 0.5 ? "warn" : "");
    ro("imin", imin.toFixed(2) + " A", imin < 0 ? "warn" : ""); ro("pin", (Vin.v * il).toFixed(0) + " W"); ro("mode", imin < 0 ? "discontinuous" : "continuous", imin < 0 ? "warn" : "good");
  });
};

/* ------------------------------------------------ DC link */
SIMS.dclink = host => {
  const L = layout(host, [{ label: "DC-link voltage ripple against capacitance" }]);
  const Ip = ctl(L.ctrls, { key: "ip", label: "Phase current (rms)", min: 5, max: 150, step: 5, value: 50, unit: "A" });
  const Vb = ctl(L.ctrls, { key: "vb", label: "Bus voltage", min: 24, max: 800, step: 4, value: 48, unit: "V" });
  const F = ctl(L.ctrls, { key: "f", label: "Switching frequency", min: 5, max: 50, step: 1, value: 20, unit: "kHz" });
  const ESR = ctl(L.ctrls, { key: "esr", label: "Capacitor ESR", min: 1, max: 50, step: 1, value: 10, unit: "mΩ" });
  const Cc = ctl(L.ctrls, { key: "c", label: "Capacitance", min: 100, max: 5000, step: 50, value: 1000, unit: "µF" });
  legend(L.stage, [["var(--ph-b)", "capacitive ripple"], ["var(--ph-y)", "ESR ripple"], ["var(--accent)", "total"]]);
  const ro = readouts(L.stage, [["idc", "I dc (≈0.9·Iphase)"], ["icap", "Cap ripple (rms)"], ["dvc", "ΔV capacitive"], ["dve", "ΔV from ESR"], ["tot", "Total ripple p-p"], ["pct", "% of bus"], ["pl", "Cap heating"]]);
  animate(() => {
    const idc = 0.9 * Ip.v, ipk = Math.SQRT2 * Ip.v, icap = 0.6 * Ip.v, esr = ESR.v / 1000;
    const dvc = c => idc * 0.25 / (c * 1e-6 * F.v * 1e3), dve = esr * ipk, tot = c => dvc(c) + dve;
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const ymax = Math.max(tot(100) * 1.05, dve * 2, 0.5);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 100, xmax: 5000, ymin: 0, ymax, C, xlabel: "C (µF)", ylabel: "V p-p" });
    plotFn(g.ctx, dvc, 100, 5000, ax.X, ax.Y, C.b, 1.8, 150); plotLine(g.ctx, [100, 5000], [dve, dve], ax.X, ax.Y, C.y, 1.8);
    plotFn(g.ctx, tot, 100, 5000, ax.X, ax.Y, C.accent, 2.5, 150);
    dot(g.ctx, ax.X(Cc.v), ax.Y(tot(Cc.v)), 6, C.ink);
    const pct = 100 * tot(Cc.v) / Vb.v;
    ro("idc", idc.toFixed(1) + " A"); ro("icap", icap.toFixed(1) + " A"); ro("dvc", dvc(Cc.v).toFixed(2) + " V"); ro("dve", dve.toFixed(2) + " V");
    ro("tot", tot(Cc.v).toFixed(2) + " V", pct > 5 ? "bad" : pct > 2 ? "warn" : "good"); ro("pct", pct.toFixed(1) + " %"); ro("pl", (icap * icap * esr).toFixed(1) + " W", icap * icap * esr > 15 ? "warn" : "");
  });
};

/* ------------------------------------------------ current loop with delay */
SIMS.curloop = host => {
  const L = layout(host, [{ label: "Current-loop step response with sampling delay" }]);
  const Fs = ctl(L.ctrls, { key: "fs", label: "Switching frequency", min: 5, max: 40, step: 1, value: 20, unit: "kHz" });
  const Fc = ctl(L.ctrls, { key: "fc", label: "Target bandwidth fc", min: 50, max: 5000, step: 50, value: 1000, unit: "Hz" });
  const Dl = ctl(L.ctrls, { key: "d", label: "Total delay", min: 0.5, max: 3, step: 0.1, value: 1.5, unit: "× Ts", fmt: v => v.toFixed(1) });
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Plant: L = 0.15 mH, R = 0.08 Ω. PI by pole cancellation, sampled once per switching period, with a zero-order hold."));
  legend(L.stage, [["var(--muted)", "reference 1 A"], ["var(--accent)", "measured current"]]);
  const ro = readouts(L.stage, [["kp", "Kp"], ["ki", "Ki"], ["pm", "Phase margin"], ["os", "Overshoot"], ["tr", "Rise time 10–90%"], ["st", "Verdict"]]);
  const Lp = 0.15e-3, Rp = 0.08;
  animate(() => {
    const Ts = 1 / (Fs.v * 1e3), wc = TAU * Fc.v, kp = Lp * wc, ki = Rp * wc, extra = Math.max(0, Dl.v - 0.5) * Ts;
    const sub = 20, dt = Ts / sub, win = Math.min(0.04, Math.max(10 * Ts, 12 / wc)), n = Math.round(win / dt);
    const dly = Math.round(extra / dt), buf = new Array(dly + 1).fill(0);
    let i = 0, I = 0, u = 0; const ts = [], ys = [];
    let ymax = 0, t10 = null, t90 = null;
    for (let k = 0; k < n; k++) {
      if (k % sub === 0) { const e = 1 - i; I += ki * e * Ts; u = kp * e + I; if (Math.abs(u) > 1e4) u = Math.sign(u) * 1e4; }
      buf.push(u); const ua = buf.shift();
      i += (ua - Rp * i) / Lp * dt; if (!isFinite(i) || Math.abs(i) > 50) i = Math.sign(i) * 50;
      if (k % 4 === 0) { ts.push(k * dt * 1000); ys.push(i); }
      ymax = Math.max(ymax, i); if (t10 === null && i >= 0.1) t10 = k * dt; if (t90 === null && i >= 0.9) t90 = k * dt;
    }
    const pm = 90 - Fc.v * (Dl.v / (Fs.v * 1e3)) * 360, os = Math.max(0, (ymax - 1) * 100);
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: win * 1000, ymin: 0, ymax: Math.max(1.6, Math.min(4, ymax * 1.1)), C, xlabel: "time (ms)", ylabel: "A", xfmt: v => v.toFixed(v < 10 ? 1 : 0) });
    plotLine(g.ctx, [0, win * 1000], [1, 1], ax.X, ax.Y, C.muted, 1.2, [4, 4]); plotLine(g.ctx, ts, ys, ax.X, ax.Y, C.accent, 2.5);
    ro("kp", kp.toFixed(3) + " V/A"); ro("ki", ki.toFixed(0)); ro("pm", pm.toFixed(0) + "°", pm < 30 ? "bad" : pm < 50 ? "warn" : "good");
    ro("os", os.toFixed(0) + " %", os > 40 ? "bad" : os > 15 ? "warn" : "good"); ro("tr", t10 !== null && t90 !== null ? ((t90 - t10) * 1e6).toFixed(0) + " µs" : "–");
    ro("st", pm <= 0 ? "unstable" : pm < 30 ? "rings" : pm < 50 ? "marginal" : "clean", pm <= 0 ? "bad" : pm < 30 ? "bad" : pm < 50 ? "warn" : "good");
  });
};

/* ------------------------------------------------ sensorless PLL */
SIMS.sensorless = host => {
  const L = layout(host, [{ label: "Estimated minus true rotor angle", cls: "short" }, { label: "Back-EMF magnitude against noise level", cls: "short" }]);
  const Sp = ctl(L.ctrls, { key: "sp", label: "Speed", min: 20, max: 3000, step: 10, value: 600, unit: "rpm" });
  const Nz = ctl(L.ctrls, { key: "nz", label: "Measurement noise (rms)", min: 0, max: 1, step: 0.02, value: 0.15, unit: "V", fmt: v => v.toFixed(2) });
  const Bw = ctl(L.ctrls, { key: "bw", label: "PLL bandwidth", min: 5, max: 200, step: 5, value: 40, unit: "Hz" });
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Motor: λ = 0.006 Wb, 7 pole pairs. Real drives also carry dead-time voltage error that acts like extra noise at low speed."));
  legend(L.stage, [["var(--accent)", "angle error (deg)"], ["var(--muted)", "back-EMF peak vs noise rms"]]);
  const ro = readouts(L.stage, [["e", "Back-EMF peak"], ["snr", "EMF / noise"], ["err", "Mean |error|"], ["tl", "Torque lost"], ["st", "Estimator"]]);
  const lam = 0.006, p = 7, dtS = 1e-4;
  let th = 0, thh = 0, wh = TAU * 7 * 600 / 60, hist = [], t = 0;
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.73;
  animate(dt => {
    const wm = Sp.v * TAU / 60, we = p * wm, zeta = 0.7, wn = TAU * Bw.v, kp = 2 * zeta * wn, ki = wn * wn;
    const steps = Math.min(500, Math.round(dt / dtS));
    for (let k = 0; k < steps; k++) {
      th += we * dtS; const e = lam * we;
      const ea = -e * Math.sin(th) + Nz.v * gauss(), eb = e * Math.cos(th) + Nz.v * gauss();
      const en = Math.max(lam * Math.abs(wh), 0.3), eps = (-ea * Math.cos(thh) - eb * Math.sin(thh)) / en;
      wh += ki * eps * dtS; thh += (wh + kp * eps) * dtS; t += dtS;
      if (k % 20 === 0) { let er = ((thh - th) % TAU + TAU * 1.5) % TAU - Math.PI; hist.push([t, er / D2R]); }
    }
    while (hist.length && hist[0][0] < t - 1.5) hist.shift();
    const C = themeColors();
    let g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: -1.5, xmax: 0, ymin: -90, ymax: 90, C, xlabel: "time (s)", ylabel: "deg", yn: 4, xfmt: v => v.toFixed(1) });
    plotLine(g.ctx, hist.map(r => r[0] - t), hist.map(r => r[1]), ax.X, ax.Y, C.accent, 1.8);
    g = fitCanvas(L.cvs[1]);
    const a2 = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 3000, ymin: 0, ymax: 12, C, xlabel: "speed (rpm)", ylabel: "V", yn: 3 });
    plotFn(g.ctx, r => lam * p * r * TAU / 60, 0, 3000, a2.X, a2.Y, C.accent, 2);
    plotLine(g.ctx, [0, 3000], [Nz.v, Nz.v], a2.X, a2.Y, C.muted, 1.5, [4, 4]);
    dot(g.ctx, a2.X(Sp.v), a2.Y(lam * p * Sp.v * TAU / 60), 5, C.ink);
    const rec = hist.slice(-Math.max(5, hist.length)).map(r => Math.abs(r[1])), mean = rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : 0;
    const e = lam * we, snr = Nz.v > 0 ? e / Nz.v : 999;
    ro("e", e.toFixed(2) + " V"); ro("snr", snr > 500 ? "∞" : snr.toFixed(1), snr < 4 ? "bad" : snr < 10 ? "warn" : "good");
    ro("err", mean.toFixed(1) + "°", mean > 20 ? "bad" : mean > 8 ? "warn" : "good");
    ro("tl", ((1 - Math.cos(Math.min(mean, 90) * D2R)) * 100).toFixed(1) + " %"); ro("st", mean > 45 ? "lost lock" : mean > 15 ? "noisy" : "locked", mean > 45 ? "bad" : mean > 15 ? "warn" : "good");
  });
};

/* ------------------------------------------------ quadrature encoder */
SIMS.quadrature = host => {
  const L = layout(host, [{ label: "Channels A and B around the current position", cls: "short" }, { label: "Speed measured with the M-method against true speed", cls: "short" }]);
  const Sp = ctl(L.ctrls, { key: "sp", label: "True speed", min: -600, max: 600, step: 10, value: 120, unit: "rpm" });
  const Pr = ctl(L.ctrls, { key: "ppr", label: "Encoder lines (PPR)", min: 100, max: 2500, step: 50, value: 1024 });
  const Tw = ctl(L.ctrls, { key: "tw", label: "Speed window", min: 0.2, max: 10, step: 0.1, value: 1, unit: "ms", fmt: v => v.toFixed(1) });
  legend(L.stage, [["var(--ph-r)", "A"], ["var(--ph-b)", "B"], ["var(--accent)", "measured speed"], ["var(--muted)", "true speed"]]);
  const ro = readouts(L.stage, [["cpr", "Counts per rev"], ["res", "Resolution"], ["q", "Speed quantum"], ["dir", "Direction"], ["cnt", "Count"], ["meas", "Measured speed"]]);
  let theta = 0, lastCount = 0, acc = 0, meas = 0, t = 0; const hist = [];
  animate(dt => {
    const w = Sp.v * TAU / 60, cpr = 4 * Pr.v, step = 1e-4;
    const n = Math.min(300, Math.round(dt / step));
    for (let k = 0; k < n; k++) {
      theta += w * step; acc += step; t += step;
      if (acc >= Tw.v / 1000) { const c = Math.floor(theta / TAU * cpr); meas = (c - lastCount) / cpr / acc * 60; lastCount = c; acc = 0; hist.push([t, meas, Sp.v]); }
    }
    while (hist.length && hist[0][0] < t - 3) hist.shift();
    const C = themeColors(), cf = theta / TAU * cpr;
    let g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: -4, xmax: 4, ymin: -0.2, ymax: 3.4, C, xlabel: "counts", noXLabels: false, yn: 2, yfmt: () => "" });
    const stateOf = (x, ch) => { const k = Math.floor(x + cf), m = ((k % 4) + 4) % 4; return ch === 0 ? [0, 0, 1, 1][m] : [0, 1, 1, 0][m]; };
    const xs = Array.from({ length: 801 }, (_, k) => -4 + 8 * k / 800);
    plotLine(g.ctx, xs, xs.map(x => stateOf(x, 0) + 1.9), ax.X, ax.Y, C.r, 2.2); plotLine(g.ctx, xs, xs.map(x => stateOf(x, 1) + 0.1), ax.X, ax.Y, C.b, 2.2);
    g.ctx.strokeStyle = C.ink; g.ctx.lineWidth = 1; g.ctx.beginPath(); g.ctx.moveTo(ax.X(0), ax.Y(-0.2)); g.ctx.lineTo(ax.X(0), ax.Y(3.4)); g.ctx.stroke();
    g = fitCanvas(L.cvs[1]);
    const lim = Math.max(100, Math.abs(Sp.v) * 1.6), a2 = axes(g.ctx, pad(g.w, g.h), { xmin: -3, xmax: 0, ymin: -lim, ymax: lim, C, xlabel: "time (s)", ylabel: "rpm", yn: 4, xfmt: v => v.toFixed(0) });
    plotLine(g.ctx, [-3, 0], [Sp.v, Sp.v], a2.X, a2.Y, C.muted, 1.5, [4, 4]);
    plotLine(g.ctx, hist.map(r => r[0] - t), hist.map(r => Math.max(-lim, Math.min(lim, r[1]))), a2.X, a2.Y, C.accent, 1.5);
    const q = 60 / (cpr * Tw.v / 1000);
    ro("cpr", cpr); ro("res", (360 / cpr).toFixed(3) + "°"); ro("q", q.toFixed(2) + " rpm", q > 10 ? "warn" : "good");
    ro("dir", Sp.v > 0 ? "A leads B" : Sp.v < 0 ? "B leads A" : "stopped"); ro("cnt", Math.floor(cf)); ro("meas", meas.toFixed(1) + " rpm", Math.abs(meas - Sp.v) > q * 1.5 ? "warn" : "");
  });
};

/* ------------------------------------------------ CAN bus load */
SIMS.canload = host => {
  const L = layout(host, [{ label: "Bus load against message rate per node" }]);
  const Br = selectCtl(L.ctrls, "Bit rate", [["125000", "125 kbit/s"], ["250000", "250 kbit/s"], ["500000", "500 kbit/s"], ["1000000", "1 Mbit/s"]], "500000");
  const Nn = ctl(L.ctrls, { key: "n", label: "Nodes sending", min: 1, max: 12, step: 1, value: 4 });
  const Rt = ctl(L.ctrls, { key: "r", label: "Messages per node", min: 10, max: 1000, step: 10, value: 200, unit: "Hz" });
  const By = ctl(L.ctrls, { key: "b", label: "Payload bytes", min: 1, max: 8, step: 1, value: 8 });
  legend(L.stage, [["var(--accent)", "bus load"], ["var(--good)", "comfortable (≤ 30%)"], ["var(--bad)", "limit (70%)"]]);
  const ro = readouts(L.stage, [["bits", "Bits per frame (worst)"], ["ft", "Frame time"], ["load", "Bus load"], ["max", "Max frames/s"], ["wait", "Worst wait (lowest priority)"], ["st", "Verdict"]]);
  animate(() => {
    const n = By.v, bits = 8 * n + 47 + Math.floor((34 + 8 * n - 1) / 4), br = +Br.v, ft = bits / br;
    const load = r => Nn.v * r * bits / br * 100;
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 10, xmax: 1000, ymin: 0, ymax: 120, C, xlabel: "messages per node (Hz)", ylabel: "% load" });
    plotLine(g.ctx, [10, 1000], [30, 30], ax.X, ax.Y, C.good, 1.2, [4, 4]); plotLine(g.ctx, [10, 1000], [70, 70], ax.X, ax.Y, C.bad, 1.2, [4, 4]);
    plotFn(g.ctx, r => Math.min(120, load(r)), 10, 1000, ax.X, ax.Y, C.accent, 2.5, 120);
    dot(g.ctx, ax.X(Rt.v), ax.Y(Math.min(120, load(Rt.v))), 6, C.ink);
    const ld = load(Rt.v);
    ro("bits", bits); ro("ft", (ft * 1e6).toFixed(0) + " µs"); ro("load", ld.toFixed(1) + " %", ld > 70 ? "bad" : ld > 40 ? "warn" : "good");
    ro("max", Math.floor(br / bits).toLocaleString()); ro("wait", ((Nn.v) * ft * 1000).toFixed(2) + " ms", Nn.v * ft > 0.005 ? "warn" : "");
    ro("st", ld > 100 ? "overloaded" : ld > 70 ? "too high" : ld > 40 ? "tight" : "healthy", ld > 70 ? "bad" : ld > 40 ? "warn" : "good");
  });
};

/* ------------------------------------------------ battery pack sag */
SIMS.battery = host => {
  const L = layout(host, [{ label: "Pack voltage under constant-power hover load" }]);
  const Ns = ctl(L.ctrls, { key: "ns", label: "Cells in series", min: 12, max: 28, step: 1, value: 24, fmt: v => v + "S" });
  const Np = ctl(L.ctrls, { key: "np", label: "Strings in parallel", min: 1, max: 20, step: 1, value: 10, fmt: v => v + "P" });
  const Ah = ctl(L.ctrls, { key: "ah", label: "Cell capacity", min: 2, max: 5, step: 0.1, value: 5, unit: "Ah", fmt: v => v.toFixed(1) });
  const Rc = ctl(L.ctrls, { key: "rc", label: "Cell resistance", min: 10, max: 40, step: 1, value: 20, unit: "mΩ" });
  const P = ctl(L.ctrls, { key: "p", label: "Hover power", min: 5, max: 35, step: 0.5, value: 24, unit: "kW", fmt: v => v.toFixed(1) });
  L.ctrls.appendChild(h("p", { class: "muted", style: "font-size:.82rem" }, "Flight ends when a cell, under load, falls to 3.2 V."));
  legend(L.stage, [["var(--accent)", "pack voltage"], ["var(--bad)", "cutoff (3.2 V per cell)"]]);
  const ro = readouts(L.stage, [["v0", "Start voltage"], ["i0", "Start current"], ["c0", "Start C-rate"], ["sag", "Sag at start"], ["heat", "Pack heating"], ["tf", "Flight time"], ["soc", "Charge left at cutoff"]]);
  const voc = s => 3.0 + 1.2 * Math.pow(Math.max(0, s), 0.8);
  animate(() => {
    const ns = Ns.v, np = Np.v, cap = Ah.v, rc = Rc.v / 1000, pw = P.v * 1000, rp = ns * rc / np, cut = 3.2 * ns;
    let soc = 1, t = 0; const ts = [0], vs = []; let v0 = 0, i0 = 0, end = null, E = 0;
    for (let k = 0; k < 1800; k++) {
      let vp = ns * voc(soc);
      for (let it = 0; it < 6; it++) { const I = pw / vp; vp = ns * voc(soc) - I * rp; if (vp < 5) { vp = 5; break; } }
      const I = pw / vp; if (k === 0) { v0 = vp; i0 = I; }
      vs.push(vp); if (k > 0) ts.push(k);
      if (vp <= cut || soc <= 0.01) { end = k; break; }
      soc -= (I / np) / (cap * 3600); E += pw / 3.6e6; t = k;
    }
    const tf = end === null ? 1800 : end, C = themeColors(), g = fitCanvas(L.cvs[0]);
    const vmax = ns * 4.3, ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: 20, ymin: ns * 2.8, ymax: vmax, C, xlabel: "time (min)", ylabel: "V" });
    plotLine(g.ctx, [0, 20], [cut, cut], ax.X, ax.Y, C.bad, 1.2, [4, 4]);
    plotLine(g.ctx, ts.slice(0, vs.length).map(s => s / 60), vs.map(v => Math.max(v, ns * 2.8)), ax.X, ax.Y, C.accent, 2.5);
    if (end !== null) dot(g.ctx, ax.X(end / 60), ax.Y(Math.max(vs[vs.length - 1], ns * 2.8)), 5, C.ink);
    const crate = i0 / (np * cap);
    ro("v0", v0.toFixed(1) + " V"); ro("i0", i0.toFixed(0) + " A"); ro("c0", crate.toFixed(1) + " C", crate > 8 ? "bad" : crate > 5 ? "warn" : "good");
    ro("sag", (ns * voc(1) - v0).toFixed(1) + " V", (ns * voc(1) - v0) / (ns * voc(1)) > 0.12 ? "warn" : ""); ro("heat", (i0 * i0 * rp).toFixed(0) + " W", i0 * i0 * rp > 1500 ? "warn" : "");
    ro("tf", end === null ? "> 30 min" : (end / 60).toFixed(1) + " min", end !== null && end < 300 ? "warn" : "good");
    const socEnd = Math.max(0, 1 - (E * 3.6e6 / pw) * (i0 / np) / (cap * 3600) * 1.0); ro("soc", (socEnd * 100).toFixed(0) + " %");
  });
};

/* ------------------------------------------------ motor thermal */
SIMS.thermalmotor = host => {
  const L = layout(host, [{ label: "Winding temperature against time" }]);
  const I = ctl(L.ctrls, { key: "i", label: "Phase current (rms)", min: 5, max: 120, step: 1, value: 60, unit: "A" });
  const R25 = ctl(L.ctrls, { key: "r", label: "Winding resistance at 25 °C", min: 10, max: 200, step: 2, value: 40, unit: "mΩ" });
  const Rth = ctl(L.ctrls, { key: "rth", label: "Thermal resistance", min: 0.1, max: 2, step: 0.05, value: 0.5, unit: "K/W", fmt: v => v.toFixed(2) });
  const Cth = ctl(L.ctrls, { key: "cth", label: "Thermal capacitance", min: 10, max: 300, step: 5, value: 60, unit: "J/K" });
  const Ta = ctl(L.ctrls, { key: "ta", label: "Ambient", min: 0, max: 50, step: 1, value: 25, unit: "°C" });
  const air = toggle(L.ctrls, "Forced cooling (halves Rth)", false);
  legend(L.stage, [["var(--accent)", "winding temperature"], ["var(--warn)", "derate at 110 °C"], ["var(--bad)", "limit 150 °C"]]);
  const ro = readouts(L.stage, [["p", "Loss at 25 °C"], ["tau", "Time constant"], ["tss", "Steady temperature"], ["t110", "Time to 110 °C"], ["icont", "Continuous rating (110 °C)"], ["icrit", "Runaway current"]]);
  const alpha = 0.0039;
  animate(() => {
    const rth = Rth.v * (air.v ? 0.5 : 1), r25 = R25.v / 1000, tau = rth * Cth.v, win = Math.max(60, tau * 8);
    const C = themeColors(), g = fitCanvas(L.cvs[0]);
    let T = Ta.v, t = 0, t110 = null; const ts = [0], ys = [T], dtS = win / 600;
    for (let k = 0; k < 600; k++) { const rr = r25 * (1 + alpha * (T - 25)), P = 3 * I.v * I.v * rr; T += (P - (T - Ta.v) / rth) / Cth.v * dtS; T = Math.min(T, 260); t += dtS; if (t110 === null && T >= 110) t110 = t; ts.push(t); ys.push(T); }
    const ax = axes(g.ctx, pad(g.w, g.h), { xmin: 0, xmax: win, ymin: 0, ymax: 200, C, xlabel: "time (s)", ylabel: "°C" });
    plotLine(g.ctx, [0, win], [110, 110], ax.X, ax.Y, C.warn, 1.2, [4, 4]); plotLine(g.ctx, [0, win], [150, 150], ax.X, ax.Y, C.bad, 1.2, [4, 4]);
    plotLine(g.ctx, ts, ys, ax.X, ax.Y, C.accent, 2.5);
    const k = 3 * I.v * I.v * r25 * rth, runaway = k * alpha >= 1, tss = runaway ? Infinity : (Ta.v + k * (1 - 25 * alpha)) / (1 - k * alpha);
    const r110 = r25 * (1 + alpha * 85), icont = Math.sqrt(Math.max(0, (110 - Ta.v) / (3 * r110 * rth))), icrit = 1 / Math.sqrt(3 * r25 * rth * alpha);
    ro("p", (3 * I.v * I.v * r25).toFixed(0) + " W"); ro("tau", tau.toFixed(0) + " s"); ro("tss", runaway ? "runaway" : tss.toFixed(0) + " °C", runaway || tss > 150 ? "bad" : tss > 110 ? "warn" : "good");
    ro("t110", t110 === null ? "never" : t110.toFixed(0) + " s", t110 !== null && t110 < 60 ? "warn" : "good"); ro("icont", icont.toFixed(0) + " A", I.v > icont ? "warn" : "good"); ro("icrit", icrit.toFixed(0) + " A", I.v > icrit ? "bad" : "");
  });
};
