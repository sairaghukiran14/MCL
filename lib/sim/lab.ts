// @ts-nocheck
import { h, TAU, D2R, animate, themeColors, fitCanvas, axes, plotLine, ctl, toggle, selectCtl, readouts } from "./runtime";
import { MISSIONS, DIAGNOSES } from "../content/core-tracks";

/* Live FOC Drive Lab: real-time PMSM + inverter (average model) + FOC with fault injection.
   Plant: SPMSM d-q model, solved at 80 kHz. Control: 40 kHz current loop, 1 kHz speed loop. */
const S3 = Math.sqrt(3);

const MOTOR = { p: 7, R0: 0.08, Ld: 0.15e-3, Lq: 0.15e-3, lam: 0.006, J: 2e-4, B: 1e-5, Imax: 30, Vbat: 24, Rbat: 0.08 };
const Ts = 25e-6;

const FAULTS = {
  none:     { label: "Healthy drive" },
  offsetA:  { label: "Phase A current offset (+2 A)" },
  gainB:    { label: "Phase B gain error (×1.25)" },
  angle:    { label: "Encoder angle offset (+60° elec)" },
  deadtime: { label: "Dead time uncompensated (0.8 V)" },
  tuning:   { label: "Speed loop mistuned" },
  windup:   { label: "Speed integrator windup (no AW)" },
  thermal:  { label: "Cooling failure (Rθ ×4)" }
};

function Drive() {
  this.reset();
}
Drive.prototype.reset = function () {
  Object.assign(this, {
    id: 0, iq: 0, wm: 0, thm: 0, Tw: 40, Vdc: MOTOR.Vbat,
    ci_d: 0, ci_q: 0, si: 0, iqRef: 0, idRef: 0, idFw: 0, vd: 0, vq: 0, vmag: 0,
    k: 0, t: 0, fault: "none", meas: [0, 0, 0], idm: 0, iqm: 0,
    Te: 0, PinF: 0, PoutF: 0, state: "RUN", ilim: MOTOR.Imax, satI: false, satV: false
  });
  this.slow = []; this.fast = []; this.iqBuf = new Float32Array(8192); this.iqPos = 0;
};
/* settings from UI */
Drive.prototype.cfg = { rpmRef: 1500, load: 0.3, bw: 800, kps: 0.2, kis: 2.5, fw: true, aw: true, dec: true };

Drive.prototype.step = function () {
  const m = MOTOR, c = this.cfg, f = this.fault;
  const thE = m.p * this.thm;
  const R = m.R0 * (1 + 0.0039 * (this.Tw - 25));
  // ---- sensing: true abc → faults → two-shunt reconstruct
  const ia = this.id * Math.cos(thE) - this.iq * Math.sin(thE);
  const ib_ = this.id * Math.sin(thE) + this.iq * Math.cos(thE);
  const a = ia, b = -ia / 2 + S3 / 2 * ib_;
  const nz = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.06;
  let am = a + nz() + (f === "offsetA" ? 2.0 : 0);
  let bm = b * (f === "gainB" ? 1.25 : 1) + nz();
  const cm = -(am + bm);
  this.meas[0] = am; this.meas[1] = bm; this.meas[2] = cm;
  const thHat = thE + (f === "angle" ? 60 * D2R : 0);
  const al = am, be = (am + 2 * bm) / S3, co = Math.cos(thHat), si = Math.sin(thHat);
  const idm = al * co + be * si, iqm = -al * si + be * co;
  this.idm = idm; this.iqm = iqm;
  const weHat = m.p * this.wm;

  // ---- speed loop at 1 kHz
  if (this.k % 40 === 0) {
    const wRef = c.rpmRef * TAU / 60, e = wRef - this.wm;
    let kp = c.kps, ki = c.kis; if (f === "tuning") { kp *= 0.15; ki *= 16; }
    const aw = c.aw && f !== "windup";
    // thermal derating: 110 °C → 150 °C reduces limit to 30 %
    const der = this.Tw <= 110 ? 1 : Math.max(0.3, 1 - 0.7 * (this.Tw - 110) / 40);
    this.ilim = m.Imax * der;
    const iqMax = Math.sqrt(Math.max(0, this.ilim * this.ilim - this.idFw * this.idFw));
    let u = kp * e + this.si + ki * e * 1e-3;
    const sat = Math.abs(u) > iqMax;
    if (!(aw && sat)) this.si += ki * e * 1e-3;
    if (aw) this.si = Math.max(-iqMax, Math.min(iqMax, this.si));
    this.iqRef = Math.max(-iqMax, Math.min(iqMax, u)); this.satI = sat;
  }
  // ---- field weakening (voltage feedback)
  const Vmax = this.Vdc / S3 * 0.97;
  if (c.fw) { this.idFw += 1500 * (0.93 * Vmax - this.vmag) * Ts; this.idFw = Math.max(-0.9 * this.ilim, Math.min(0, this.idFw)); }
  else this.idFw = 0;
  this.idRef = this.idFw;

  // ---- current PI (pole-cancel), decoupling, voltage limit
  const wc = TAU * c.bw, kpi = m.Ld * wc, kii = R * wc;
  const ed = this.idRef - idm, eq = this.iqRef - iqm;
  let vd = kpi * ed + this.ci_d + kii * ed * Ts, vq = kpi * eq + this.ci_q + kii * eq * Ts;
  if (c.dec) { vd += -weHat * m.Lq * iqm; vq += weHat * (m.Ld * idm + m.lam); }
  let mag = Math.hypot(vd, vq);
  const satV = mag > Vmax;
  if (satV) { vd *= Vmax / mag; vq *= Vmax / mag; mag = Vmax; }
  else { this.ci_d += kii * ed * Ts; this.ci_q += kii * eq * Ts; }
  this.vd = vd; this.vq = vq; this.vmag = mag; this.satV = satV;

  // ---- inverter: controller dq (θ̂) → αβ → abc (+ dead time) → true dq
  let va = vd * co - vq * si, vbeta = vd * si + vq * co;
  if (f === "deadtime" || true) {
    const vdt = f === "deadtime" ? 0.8 : 0.04; // residual after compensation when healthy
    const ic = -a - b;
    let A = va, B = -va / 2 + S3 / 2 * vbeta, Cc = -va / 2 - S3 / 2 * vbeta;
    A -= vdt * Math.tanh(a * 4); B -= vdt * Math.tanh(b * 4); Cc -= vdt * Math.tanh(ic * 4);
    va = (2 / 3) * (A - B / 2 - Cc / 2); vbeta = (B - Cc) / S3;
  }
  // ---- plant (2 substeps)
  const hs = Ts / 2;
  for (let s = 0; s < 2; s++) {
    const th = m.p * this.thm, cs = Math.cos(th), sn = Math.sin(th);
    const vdT = va * cs + vbeta * sn, vqT = -va * sn + vbeta * cs;
    const we = m.p * this.wm;
    const did = (vdT - R * this.id + we * m.Lq * this.iq) / m.Ld;
    const diq = (vqT - R * this.iq - we * m.Ld * this.id - we * m.lam) / m.Lq;
    this.id += did * hs; this.iq += diq * hs;
    const Te = 1.5 * m.p * (m.lam * this.iq + (m.Ld - m.Lq) * this.id * this.iq);
    const wsgn = Math.abs(this.wm) > 1 ? Math.sign(this.wm) : 0;
    let TL = c.load * (wsgn || Math.sign(Te) || 0);
    if (!wsgn && Math.abs(Te) < Math.abs(c.load)) TL = Te; // static friction-like hold at standstill
    this.wm += (Te - TL - m.B * this.wm) / m.J * hs;
    this.thm += this.wm * hs;
    this.Te = Te;
    if (s === 1) { this.vdT = vdT; this.vqT = vqT; }
  }
  if (this.thm > TAU * 1000) this.thm -= TAU * 1000;
  // ---- power, thermal, bus
  const Pin = 1.5 * (this.vdT * this.id + this.vqT * this.iq), Pout = this.Te * this.wm, Pcu = 1.5 * R * (this.id * this.id + this.iq * this.iq);
  this.PinF += (Pin - this.PinF) * 0.002; this.PoutF += (Pout - this.PoutF) * 0.002;
  const Rth = f === "thermal" ? 2.0 : 0.5, Cth = 60;
  this.Tw += (Pcu - (this.Tw - 40) / Rth) / Cth * Ts;
  const Ibus = Pin / Math.max(1, this.Vdc) / 0.97;
  this.Vdc += ((m.Vbat - m.Rbat * Ibus) - this.Vdc) * 0.01;
  this.state = this.Tw > 110 ? "DERATE" : satV && !c.fw ? "V-LIMIT" : this.idFw < -0.5 ? "FIELD WEAK" : this.satI ? "I-LIMIT" : "RUN";
  // ---- buffers
  this.iqBuf[this.iqPos] = iqm; this.iqPos = (this.iqPos + 1) % this.iqBuf.length;
  if (this.k % 2 === 0) { this.fast.push([this.t, am, bm, cm]); if (this.fast.length > 900) this.fast.shift(); }
  if (this.k % 40 === 0) { this.slow.push([this.t, this.wm * 60 / TAU, c.rpmRef, idm, iqm, this.iqRef, this.Tw]); if (this.slow.length > 3000) this.slow.shift(); }
  this.k++; this.t += Ts;
};
Drive.prototype.run = function (dt) { const n = Math.min(2400, Math.round(dt / Ts)); for (let i = 0; i < n; i++) this.step(); };
Drive.prototype.spectrum = function () {
  const fe = Math.abs(MOTOR.p * this.wm / TAU); if (fe < 8) return null;
  const Fs = 1 / Ts, L = this.iqBuf.length, perCyc = Fs / fe, cyc = Math.floor(L / perCyc); if (cyc < 2) return null;
  const N = Math.floor(cyc * perCyc), x = new Float32Array(N);
  let mean = 0; for (let i = 0; i < N; i++) { x[i] = this.iqBuf[(this.iqPos - N + i + L) % L]; mean += x[i]; } mean /= N;
  const out = [];
  for (let k = 1; k <= 8; k++) {
    const w = TAU * k * fe / Fs; let re = 0, im = 0;
    for (let i = 0; i < N; i++) { const v = x[i] - mean; re += v * Math.cos(w * i); im -= v * Math.sin(w * i); }
    out.push(2 * Math.hypot(re, im) / N);
  }
  return { fe, mags: out, mean };
};

/* -------------------------------------------------- UI */
const SC = { spd: "#c2410c", ref: "#8b8b84", iq: "#15803d", id: "#b91c1c", a: "#d63a3a", b: "#b98300", c: "#2457c5", tmp: "#7c3aed" };

function scope(parent, title, legendItems, cls) {
  const s = h("div", { class: "scope" });
  s.innerHTML = `<header><span>${title}</span><span class="legend">${legendItems.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("")}</span></header>`;
  const cv = h("canvas", { class: cls || "", "aria-label": title }); s.appendChild(cv); parent.appendChild(s); return cv;
}

export function mount(host, opts) {
  opts = opts || {};
  host.innerHTML = "";
  const d = new Drive(); d.cfg = Object.assign({}, Drive.prototype.cfg);
  const lab = h("div", { class: "lab" }); host.appendChild(lab);
  const panel = h("div", { class: "side" }); lab.appendChild(panel);
  const scopes = h("div", { class: "scopes" }); lab.appendChild(scopes);

  panel.appendChild(h("h3", {}, "Operating point"));
  const rpm = ctl(panel, { key: "rpm", label: "Speed setpoint", min: -2000, max: 6000, step: 50, value: 1500, unit: "rpm", onInput: v => d.cfg.rpmRef = v });
  const load = ctl(panel, { key: "load", label: "Load torque", min: -0.5, max: 1.8, step: 0.05, value: 0.3, unit: "N·m", fmt: v => v.toFixed(2), onInput: v => d.cfg.load = v });
  const btns = h("div", { style: "display:flex;gap:6px;flex-wrap:wrap" });
  const bStep = h("button", { class: "btn small", type: "button" }, "Step 500 → 3000");
  const bStop = h("button", { class: "btn small", type: "button" }, "Regen stop");
  const bRst = h("button", { class: "btn small", type: "button" }, "Reset");
  btns.append(bStep, bStop, bRst); panel.appendChild(btns);
  bStep.addEventListener("click", () => { rpm.set(500); d.cfg.rpmRef = 500; setTimeout(() => { rpm.set(3000); d.cfg.rpmRef = 3000; }, 700); });
  bStop.addEventListener("click", () => { rpm.set(0); d.cfg.rpmRef = 0; });
  bRst.addEventListener("click", () => { const f = d.fault, cfg = d.cfg; d.reset(); d.fault = f; d.cfg = cfg; });
  panel.appendChild(h("h3", {}, "Controller"));
  ctl(panel, { key: "bw", label: "Current loop bandwidth", min: 100, max: 3000, step: 50, value: 800, unit: "Hz", onInput: v => d.cfg.bw = v });
  ctl(panel, { key: "kps", label: "Speed Kp", min: 0.01, max: 1, step: 0.01, value: 0.2, unit: "A/(rad/s)", fmt: v => v.toFixed(2), onInput: v => d.cfg.kps = v });
  ctl(panel, { key: "kis", label: "Speed Ki", min: 0, max: 30, step: 0.5, value: 2.5, fmt: v => v.toFixed(1), onInput: v => d.cfg.kis = v });
  toggle(panel, "Field weakening", true, v => d.cfg.fw = v);
  toggle(panel, "Anti-windup (speed PI)", true, v => d.cfg.aw = v);
  toggle(panel, "d-q decoupling feed-forward", true, v => d.cfg.dec = v);

  let mission = null;
  if (opts.learning) {
    panel.appendChild(h("h3", {}, "Learning mode: inject a fault"));
    selectCtl(panel, "Fault", Object.keys(FAULTS).map(k => [k, FAULTS[k].label]), "none", v => { d.fault = v; d.Tw = v === "thermal" ? 70 : d.Tw; });
  }
  let missionBox = null, missionsList = null;
  if (opts.full) {
    panel.appendChild(h("h3", {}, "Missions"));
    missionsList = h("div", { class: "missions-list" }); panel.appendChild(missionsList);
    missionBox = h("div", { class: "mission", hidden: "" });
    scopes.appendChild(missionBox);
    const renderList = () => {
      missionsList.innerHTML = "";
      MISSIONS.forEach(ms => {
        const b = h("button", { class: "btn small", type: "button" }, `${opts.progress.has("m", ms.id) ? '<span class="solved">✓</span> ' : ""}${ms.title}`);
        b.addEventListener("click", () => startMission(ms)); missionsList.appendChild(b);
      });
      const cl = h("button", { class: "btn small", type: "button" }, "Clear fault (healthy drive)");
      cl.addEventListener("click", () => { d.fault = "none"; mission = null; missionBox.hidden = true; }); missionsList.appendChild(cl);
    };
    const setOp = (r, l) => { rpm.set(r); d.cfg.rpmRef = r; load.set(l); d.cfg.load = l; };
    const startMission = ms => {
      mission = ms; d.fault = ms.fault;
      const ops = { offsetA: [1500, 0.3], gainB: [2000, 0.5], angle: [1500, 0.8], deadtime: [300, 0.3], tuning: [2000, 0.3], windup: [500, 0.4], thermal: [2500, 1.4] };
      const o = ops[ms.fault] || [1500, 0.3]; setOp(o[0], o[1]);
      if (ms.fault === "thermal") d.Tw = 70;
      missionBox.hidden = false;
      const opts2 = DIAGNOSES.slice();
      missionBox.innerHTML = `<h3>Mission: ${ms.title}</h3><p>${ms.brief}</p><p class="muted" style="font-size:.88rem">Change the operating point, run step tests and watch the scopes. Then choose a diagnosis.</p>`;
      const g = h("div", { class: "diag-opts" }); missionBox.appendChild(g);
      const fb = h("div", { class: "why", hidden: "" }); missionBox.appendChild(fb);
      opts2.forEach((o2, i) => {
        const b = h("button", { class: "opt", type: "button" }, `<span class="k">${"ABCDEFGH"[i]}</span><span>${o2}</span>`);
        b.addEventListener("click", () => {
          if (o2 === ms.answer) { b.classList.add("right"); g.querySelectorAll("button").forEach(x => x.disabled = true); fb.className = "why"; fb.innerHTML = `<b>Diagnosed.</b> ${ms.why}`; fb.hidden = false; opts.progress.mark("m", ms.id); renderList(); }
          else { b.classList.add("wrong"); fb.className = "why no"; fb.innerHTML = "<b>Not the root cause.</b> Look at which harmonic order shows up, and whether torque per amp is normal."; fb.hidden = false; }
        });
        g.appendChild(b);
      });
      missionBox.scrollIntoView && missionBox.scrollIntoView({ block: "nearest" });
    };
    renderList();
  }

  // status + readouts
  const status = h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }); scopes.appendChild(status);
  const ro = readouts(scopes, [["rpm", "Speed"], ["te", "Shaft torque"], ["i", "|I|"], ["tpa", "Torque / amp"], ["v", "Voltage use"], ["p", "P in / P out"], ["eff", "Efficiency"], ["tw", "Winding temp"], ["vdc", "DC bus"]]);
  const cvSpd = scope(scopes, "Speed (rpm), last 3 s", [[SC.spd, "speed"], [SC.ref, "setpoint"]]);
  const cvDq = scope(scopes, "d-q currents measured (A), last 3 s", [[SC.iq, "iq"], [SC.id, "id"], [SC.ref, "iq*"]]);
  const row = h("div", { class: "lab-grid2" }); scopes.appendChild(row);
  const cvAbc = scope(row, "Phase currents measured (A), last 20 ms", [[SC.a, "a"], [SC.b, "b"], [SC.c, "c"]]);
  const cvSp = scope(row, "iq harmonic spectrum (× electrical freq)", [[SC.spd, "|iq| per order"]]);

  let frame = 0, spec = null;
  const C0 = { grid: "", muted: "", line: "" };
  animate(dt => {
    d.run(dt); frame++;
    const C = themeColors();
    // speed scope
    let g = fitCanvas(cvSpd), sl = d.slow, tN = d.t;
    const vis = sl.filter(r => r[0] > tN - 3);
    const ymax = Math.max(1000, ...vis.map(r => Math.max(r[1], r[2]))) * 1.1, ymin = Math.min(0, ...vis.map(r => Math.min(r[1], r[2]))) * 1.1;
    let ax = axes(g.ctx, { x: 46, y: 8, w: g.w - 56, h: g.h - 28 }, { xmin: -3, xmax: 0, ymin, ymax, C, xfmt: v => v.toFixed(1) + "s" });
    plotLine(g.ctx, vis.map(r => r[0] - tN), vis.map(r => r[2]), ax.X, ax.Y, SC.ref, 1.2, [4, 3]);
    plotLine(g.ctx, vis.map(r => r[0] - tN), vis.map(r => r[1]), ax.X, ax.Y, SC.spd, 2);
    // dq scope
    g = fitCanvas(cvDq);
    const im = Math.max(10, ...vis.map(r => Math.max(Math.abs(r[3]), Math.abs(r[4]), Math.abs(r[5])))) * 1.15;
    ax = axes(g.ctx, { x: 46, y: 8, w: g.w - 56, h: g.h - 28 }, { xmin: -3, xmax: 0, ymin: -im, ymax: im, C, xfmt: v => v.toFixed(1) + "s" });
    plotLine(g.ctx, vis.map(r => r[0] - tN), vis.map(r => r[5]), ax.X, ax.Y, SC.ref, 1.2, [4, 3]);
    plotLine(g.ctx, vis.map(r => r[0] - tN), vis.map(r => r[3]), ax.X, ax.Y, SC.id, 1.5);
    plotLine(g.ctx, vis.map(r => r[0] - tN), vis.map(r => r[4]), ax.X, ax.Y, SC.iq, 1.5);
    // abc scope
    g = fitCanvas(cvAbc); const fv = d.fast.filter(r => r[0] > tN - 0.02);
    const am = Math.max(5, ...fv.map(r => Math.max(Math.abs(r[1]), Math.abs(r[2]), Math.abs(r[3])))) * 1.15;
    ax = axes(g.ctx, { x: 40, y: 8, w: g.w - 48, h: g.h - 28 }, { xmin: -20, xmax: 0, ymin: -am, ymax: am, C, xfmt: v => v + "ms", xn: 4 });
    [SC.a, SC.b, SC.c].forEach((col, k) => plotLine(g.ctx, fv.map(r => (r[0] - tN) * 1000), fv.map(r => r[k + 1]), ax.X, ax.Y, col, 1.5));
    // spectrum
    if (frame % 8 === 0) spec = d.spectrum();
    g = fitCanvas(cvSp);
    if (!spec) { g.ctx.fillStyle = C.muted; g.ctx.font = "12px ui-monospace, Menlo, monospace"; g.ctx.textAlign = "center"; g.ctx.fillText("Spin above ~70 rpm to see the spectrum", g.w / 2, g.h / 2); }
    else {
      const top = Math.max(0.5, ...spec.mags) * 1.2, box = { x: 40, y: 8, w: g.w - 48, h: g.h - 28 };
      const a2 = axes(g.ctx, box, { xmin: 0.5, xmax: 8.5, ymin: 0, ymax: top, C, noXLabels: true, yn: 3 });
      spec.mags.forEach((v, i) => {
        const x = a2.X(i + 1), bw = box.w / 8 * 0.6;
        g.ctx.fillStyle = v > 0.4 ? SC.spd : "#c9c9c2"; g.ctx.fillRect(x - bw / 2, a2.Y(v), bw, a2.Y(0) - a2.Y(v));
        g.ctx.fillStyle = C.muted; g.ctx.font = "11px ui-monospace, Menlo, monospace"; g.ctx.textAlign = "center"; g.ctx.textBaseline = "top"; g.ctx.fillText(i + 1 + "×", x, box.y + box.h + 3);
      });
      g.ctx.textAlign = "right"; g.ctx.textBaseline = "top"; g.ctx.fillText("fe = " + spec.fe.toFixed(0) + " Hz", box.x + box.w - 2, box.y + 2);
    }
    // readouts
    if (frame % 4 === 0) {
      const I = Math.hypot(d.id, d.iq), tpa = I > 1 ? d.Te / I : NaN, nom = 1.5 * MOTOR.p * MOTOR.lam;
      const pill = d.state === "RUN" ? "run" : d.state === "DERATE" || d.state === "V-LIMIT" ? "trip" : "lim";
      status.innerHTML = `<span class="pill ${pill}">${d.state}</span><span class="muted mono" style="font-size:.8rem">fault: ${opts.learning ? FAULTS[d.fault].label : opts.full && mission ? "hidden" : "none"} · I limit ${d.ilim.toFixed(0)} A · id* ${d.idRef.toFixed(1)} A</span>`;
      ro("rpm", (d.wm * 60 / TAU).toFixed(0) + " rpm");
      ro("te", d.Te.toFixed(2) + " N·m"); ro("i", I.toFixed(1) + " A", I > 28 ? "warn" : "");
      ro("tpa", isNaN(tpa) ? "–" : tpa.toFixed(3) + " N·m/A", !isNaN(tpa) && Math.abs(tpa) < nom * 0.8 ? "bad" : "good");
      ro("v", (100 * d.vmag / (d.Vdc / S3)).toFixed(0) + " %", d.satV ? "warn" : "");
      ro("p", `${d.PinF.toFixed(0)} / ${d.PoutF.toFixed(0)} W`, d.PinF < -5 ? "good" : "");
      ro("eff", d.PinF > 5 && d.PoutF > 0 ? (100 * d.PoutF / d.PinF).toFixed(1) + " %" : d.PinF < -5 ? "regen" : "–");
      ro("tw", d.Tw.toFixed(1) + " °C", d.Tw > 110 ? "bad" : d.Tw > 90 ? "warn" : "");
      ro("vdc", d.Vdc.toFixed(2) + " V", d.Vdc > 25 ? "good" : d.Vdc < 22.5 ? "warn" : "");
    }
  });
}

export { Drive, MOTOR };
