// @ts-nocheck
/* Canvas drawing for the animated explainers. Each function draws one frame.
   s = { step, st (seconds since the step started), t (seconds since mount) } */
import { arrow, dot } from "./runtime";

const TAU = Math.PI * 2;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const MONO = "ui-monospace, Menlo, monospace";
const SANS = "system-ui, -apple-system, sans-serif";

function text(ctx, s, x, y, color, size = 12, align = "center", weight = 500, font = MONO) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
}
function rbox(ctx, x, y, w, h, r, fill, stroke, lw = 1.5) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function wire(ctx, x, y, r, out, C) {
  dot(ctx, x, y, r, C.panel); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  if (out) dot(ctx, x, y, r * 0.3, C.ink);
  else { const k = r * 0.5; ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); }
}
function strip(ctx, x, y, w, h, f, color, C, label) {
  rbox(ctx, x, y, w, h, 6, C.bg, C.line, 1);
  ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x + 6, y + h / 2); ctx.lineTo(x + w - 6, y + h / 2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i++) { const u = i / 120, px = x + 6 + u * (w - 12), py = y + h / 2 - f(u) * (h / 2 - 6); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  if (label) text(ctx, label, x + 8, y + 10, C.muted, 10, "left");
}
function fieldPoles(ctx, w, h, t, C, alpha = 1) {
  const cx = w / 2, cy = h / 2, pw = Math.min(70, w * 0.09), ph = h * 0.62, gx = Math.min(w * 0.36, 300);
  ctx.globalAlpha = alpha;
  rbox(ctx, cx - gx - pw, cy - ph / 2, pw, ph, 6, C.r); rbox(ctx, cx + gx, cy - ph / 2, pw, ph, 6, C.b);
  text(ctx, "N", cx - gx - pw / 2, cy, "#fff", 22, "center", 700, SANS); text(ctx, "S", cx + gx + pw / 2, cy, "#fff", 22, "center", 700, SANS);
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.setLineDash([7, 9]); ctx.lineDashOffset = -t * 40;
  for (let k = -3; k <= 3; k++) { const y = cy + k * ph / 8; ctx.beginPath(); ctx.moveTo(cx - gx, y); ctx.lineTo(cx + gx, y); ctx.stroke(); }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  return { cx, cy, gx, ph };
}
function rotatingField(ctx, w, h, t, C) {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38, cols = [C.r, C.y, C.b], names = ["R", "Y", "B"];
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.88, 0, TAU); ctx.stroke();
  let sx = 0, sy = 0;
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + k * TAU / 3, iv = Math.cos(t - k * TAU / 3);
    sx += iv * Math.cos(a); sy += iv * Math.sin(a);
    [a, a + Math.PI].forEach((aa, j) => { ctx.globalAlpha = 0.25 + 0.75 * Math.abs(iv); dot(ctx, cx + Math.cos(aa) * R, cy + Math.sin(aa) * R, R * 0.08, cols[k]); ctx.globalAlpha = 1; text(ctx, names[k] + (j ? "′" : ""), cx + Math.cos(aa) * R, cy + Math.sin(aa) * R, "#fff", Math.round(R * 0.08), "center", 700); });
    arrow(ctx, cx, cy, cx + iv * Math.cos(a) * R * 0.4, cy + iv * Math.sin(a) * R * 0.4, cols[k], 2);
  }
  const ang = Math.atan2(sy, sx);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang - 0.25);
  ctx.fillStyle = C.panel; ctx.beginPath(); ctx.arc(0, 0, R * 0.56, 0, TAU); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
  ctx.globalAlpha = 0.9; ctx.fillStyle = C.accent; ctx.fillRect(0, -R * 0.12, R * 0.48, R * 0.24); ctx.fillStyle = C.ink; ctx.fillRect(-R * 0.48, -R * 0.12, R * 0.48, R * 0.24); ctx.globalAlpha = 1;
  ctx.restore();
  arrow(ctx, cx, cy, cx + sx / 1.5 * R * 0.8, cy + sy / 1.5 * R * 0.8, C.ink, 3);
}

/* ======================================================= motor-torque */
function motorTorque(ctx, w, h, s, C) {
  const { step, st, t } = s;
  if (step === 4) { rotatingField(ctx, w, h, t * 1.3, C); return; }
  const P = fieldPoles(ctx, w, h, t, C, step === 0 ? 1 : 0.55);
  const { cx, cy } = P;
  if (step === 0) {
    text(ctx, "B: magnetic field", cx, cy - P.ph / 2 - 14, C.muted, 12);
    for (let k = -1; k <= 1; k += 2) arrow(ctx, cx - 30, cy + k * P.ph / 4, cx + 30, cy + k * P.ph / 4, C.ink, 2);
    return;
  }
  if (step === 1) {
    const g = ease(st / 1.2), r = 16;
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.lineDashOffset = t * 30;
    for (const rr of [30, 46]) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); }
    ctx.setLineDash([]);
    wire(ctx, cx, cy, r, true, C);
    arrow(ctx, cx, cy - r - 4, cx, cy - r - 4 - 90 * g, C.accent, 4);
    text(ctx, "F = B · I · L", cx + 70, cy - 70, C.ink, 14, "left", 600);
    text(ctx, "current out of the screen", cx, cy + 70, C.muted, 11);
    return;
  }
  // steps 2 and 3: coil end view
  const R = Math.min(P.gx * 0.55, P.ph * 0.36), spd = step === 2 ? 0.6 : 1.6;
  const phi = t * spd, dir = step === 3 ? (Math.cos(phi) >= 0 ? 1 : -1) : 1;
  const p1 = [cx + R * Math.cos(phi), cy - R * Math.sin(phi)], p2 = [cx - R * Math.cos(phi), cy + R * Math.sin(phi)];
  ctx.strokeStyle = C.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  wire(ctx, p1[0], p1[1], 13, dir > 0, C); wire(ctx, p2[0], p2[1], 13, dir < 0, C);
  arrow(ctx, p1[0], p1[1] - 16 * dir, p1[0], p1[1] - 60 * dir, C.good, 3);
  arrow(ctx, p2[0], p2[1] + 16 * dir, p2[0], p2[1] + 60 * dir, C.good, 3);
  const tq = Math.cos(phi) * dir;
  // torque meter
  const mx = w - 150, my = 24, mw = 120;
  rbox(ctx, mx, my, mw, 16, 8, C.bg, C.line, 1);
  const z = mx + mw / 2; ctx.fillStyle = tq >= 0 ? C.good : C.bad; ctx.fillRect(Math.min(z, z + tq * mw / 2), my + 3, Math.abs(tq) * mw / 2, 10);
  text(ctx, "torque", mx - 8, my + 8, C.muted, 11, "right");
  if (step === 3) {
    strip(ctx, 20, h - 70, Math.min(320, w - 40), 56, (u) => Math.abs(Math.cos(phi - (1 - u) * 6)), C.good, C, "torque: always positive");
    if (Math.abs(Math.cos(phi)) < 0.08) text(ctx, "flip!", cx, cy - R - 30, C.accent, 14, "center", 700);
  } else {
    strip(ctx, 20, h - 70, Math.min(320, w - 40), 56, (u) => Math.cos(phi - (1 - u) * 6), C.bad, C, "torque: reverses every half-turn");
  }
}

/* ======================================================= inverter */
function halfBridge(ctx, x, y, hh, on, C, label) {
  const w = 54;
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + hh); ctx.stroke();
  rbox(ctx, x - w / 2, y + hh * 0.12, w, hh * 0.26, 6, on ? C.accent : C.panel, on ? C.accent : C.line);
  rbox(ctx, x - w / 2, y + hh * 0.62, w, hh * 0.26, 6, !on ? C.ink : C.panel, !on ? C.ink : C.line);
  text(ctx, on ? "ON" : "off", x, y + hh * 0.25, on ? "#fff" : C.muted, 11, "center", 600);
  text(ctx, !on ? "ON" : "off", x, y + hh * 0.75, !on ? "#fff" : C.muted, 11, "center", 600);
  dot(ctx, x, y + hh / 2, 4, C.ink);
  if (label) text(ctx, label, x, y + hh + 14, C.muted, 11);
}
function inverter(ctx, w, h, s, C) {
  const { step, st, t } = s;
  const top = 40, bot = h - 40, plotX = Math.min(260, w * 0.36), plotW = w - plotX - 24, mid = (top + bot) / 2;
  if (step === 0) {
    rbox(ctx, 60, mid - 50, 90, 100, 10, C.panel, C.ink, 2); rbox(ctx, 92, mid - 60, 26, 10, 3, C.ink);
    text(ctx, "+", 105, mid - 22, C.ink, 22, "center", 700, SANS); text(ctx, "48 V", 105, mid + 18, C.ink, 14, "center", 600);
    rbox(ctx, plotX, top, plotW, bot - top, 8, C.bg, C.line, 1);
    const g = ease(st / 1.2); ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(plotX + 10, mid - 50); ctx.lineTo(plotX + 10 + (plotW - 20) * g, mid - 50); ctx.stroke();
    text(ctx, "voltage over time: flat", plotX + 12, top + 14, C.muted, 11, "left");
    return;
  }
  if (step === 4) {
    const cols = [C.r, C.y, C.b];
    for (let k = 0; k < 3; k++) {
      const duty = 0.5 + 0.45 * Math.sin(t * 2 - k * TAU / 3), on = ((t * 7) % 1) < duty;
      halfBridge(ctx, 50 + k * 70, top + 10, bot - top - 40, on, C, "RYB"[k]);
    }
    rbox(ctx, plotX, top, plotW, bot - top, 8, C.bg, C.line, 1);
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const u = i / 200, x = plotX + 8 + u * (plotW - 16), y = mid - (bot - top) * 0.38 * Math.sin(t * 2 - k * TAU / 3 - (1 - u) * 9); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    text(ctx, "three phase currents, 120° apart", plotX + 12, top + 14, C.muted, 11, "left");
    return;
  }
  // steps 1–3: one leg
  const period = 1 / 6, onNow = step === 1 ? ((t * 1.2) % 1) < 0.5 : ((t * 6) % 1) < 0.5 + 0.45 * Math.sin(t * 1.4);
  halfBridge(ctx, 90, top + 10, bot - top - 30, onNow, C, "one leg");
  arrow(ctx, 96, mid - 2, plotX - 10, mid - 2, C.muted, 1.5);
  rbox(ctx, plotX, top, plotW, bot - top, 8, C.bg, C.line, 1);
  const H = (bot - top) * 0.36, x0 = plotX + 8, W = plotW - 16;
  if (step === 1) {
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const u = i / 400, ph = (t * 1.2 - (1 - u) * 4) % 1, v = (ph + 1) % 1 < 0.5 ? 1 : -1; const x = x0 + u * W, y = mid - v * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); text(ctx, "output: +V or 0, a square wave", plotX + 12, top + 14, C.muted, 11, "left"); return;
  }
  // PWM whose duty follows a sine
  const span = 2.2, n = 26;
  ctx.globalAlpha = step === 3 ? 0.25 : 0.85;
  for (let k = 0; k < n; k++) {
    const u0 = k / n, tt = t * 1.4 - (1 - u0) * span * 2, duty = 0.5 + 0.45 * Math.sin(tt);
    const px = x0 + u0 * W, pw = W / n;
    ctx.fillStyle = C.ink; ctx.fillRect(px + pw * (1 - duty) / 2, mid - H, pw * duty, 2 * H);
  }
  ctx.globalAlpha = 1;
  const reveal = step === 2 ? ease(st / 2) : 1;
  ctx.strokeStyle = C.accent; ctx.lineWidth = step === 3 ? 3 : 2.5; ctx.setLineDash(step === 2 ? [6, 5] : []); ctx.beginPath();
  for (let i = 0; i <= 300 * reveal; i++) {
    const u = i / 300, tt = t * 1.4 - (1 - u) * span * 2, ripple = step === 3 ? 0.06 * Math.sin(u * n * TAU * 1) : 0;
    const v = (0.9 * Math.sin(tt)) + ripple, x = x0 + u * W, y = mid - v * H;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke(); ctx.setLineDash([]);
  text(ctx, step === 2 ? "pulse width follows a sine; the average is the dashed line" : "motor current: smooth sine, small ripple", plotX + 12, top + 14, C.muted, 11, "left");
}

/* ======================================================= FOC */
const PIPE = ["ADC", "Clarke", "Park", "PI × 2", "Inv. Park", "SVPWM", "Switches", "Motor"];
function foc(ctx, w, h, s, C) {
  const { step, st, t } = s;
  const th = t * 1.2, cols = [C.r, C.y, C.b];
  const ia = [0, 1, 2].map((k) => Math.cos(th - k * TAU / 3));
  if (step === 0) {
    const x0 = 30, W = w - 60, mid = h / 2, H = h * 0.32;
    rbox(ctx, x0 - 10, mid - H - 20, W + 20, 2 * H + 40, 8, C.bg, C.line, 1);
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 240; i++) { const u = i / 240, y = mid - H * Math.cos(th - k * TAU / 3 - (1 - u) * 10); i ? ctx.lineTo(x0 + u * W, y) : ctx.moveTo(x0 + u * W, y); }
      ctx.stroke(); dot(ctx, x0 + W, mid - H * ia[k], 5, cols[k]); text(ctx, "abc"[k], x0 + W + 14, mid - H * ia[k], cols[k], 12, "left", 700);
    }
    return;
  }
  if (step === 1 || step === 2) {
    const R = Math.min(w * 0.2, h * 0.36), cx1 = w * 0.27, cy = h / 2, cx2 = w * 0.72;
    const vx = 1.5 * Math.cos(th), vy = 1.5 * Math.sin(th);
    if (step === 1) {
      for (let k = 0; k < 3; k++) {
        const a = k * TAU / 3; ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx1, cy); ctx.lineTo(cx1 + Math.cos(a) * R * 1.1, cy - Math.sin(a) * R * 1.1); ctx.stroke();
        text(ctx, "abc"[k], cx1 + Math.cos(a) * R * 1.2, cy - Math.sin(a) * R * 1.2, cols[k], 12, "center", 700);
        arrow(ctx, cx1, cy, cx1 + Math.cos(a) * ia[k] * R * 0.6, cy - Math.sin(a) * ia[k] * R * 0.6, cols[k], 2.5);
      }
      arrow(ctx, cx1, cy, cx1 + vx * R * 0.6, cy - vy * R * 0.6, C.ink, 3.5);
      arrow(ctx, cx1 + R * 1.25, cy, cx2 - R * 1.25, cy, C.muted, 1.5); text(ctx, "Clarke", (cx1 + cx2) / 2, cy - 14, C.muted, 11);
    }
    const cx = step === 1 ? cx2 : cx1;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    text(ctx, "α", cx + R - 6, cy - 10, C.muted, 12); text(ctx, "β", cx + 10, cy - R + 8, C.muted, 12);
    ctx.strokeStyle = C.accent; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, R * 0.6 * 1.5 / 1.5 * 0.9, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    arrow(ctx, cx, cy, cx + Math.cos(th) * R * 0.54, cy - Math.sin(th) * R * 0.54, C.ink, 3.5);
    if (step === 2) {
      const d = th - Math.PI / 2, g = ease(st / 1);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(d) * R * g, cy - Math.sin(d) * R * g); ctx.stroke();
      ctx.strokeStyle = C.good; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(d + Math.PI / 2) * R * g, cy - Math.sin(d + Math.PI / 2) * R * g); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "d", cx + Math.cos(d) * R * 1.08, cy - Math.sin(d) * R * 1.08, C.accent, 13, "center", 700);
      text(ctx, "q", cx + Math.cos(d + Math.PI / 2) * R * 1.08, cy - Math.sin(d + Math.PI / 2) * R * 1.08, C.good, 13, "center", 700);
      const px = w * 0.52, pw = w * 0.44, ph = h * 0.6, py = h * 0.2;
      rbox(ctx, px, py, pw, ph, 8, C.bg, C.line, 1);
      const yq = py + ph * 0.3, yd = py + ph * 0.7;
      ctx.lineWidth = 3; ctx.strokeStyle = C.good; ctx.beginPath(); ctx.moveTo(px + 10, yq); ctx.lineTo(px + 10 + (pw - 20) * g, yq); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.moveTo(px + 10, yd); ctx.lineTo(px + 10 + (pw - 20) * g, yd); ctx.stroke();
      text(ctx, "iq = constant (torque)", px + 14, yq - 14, C.good, 12, "left", 600); text(ctx, "id = 0 (no wasted current)", px + 14, yd - 14, C.accent, 12, "left", 600);
    }
    return;
  }
  // steps 3 and 4: the pipeline
  const n = PIPE.length, cols2 = Math.min(4, n), rows = 2, bw = Math.min(130, (w - 60) / cols2 - 18), bh = 44;
  const pos = PIPE.map((_, i) => { const r = i < 4 ? 0 : 1, c = r === 0 ? i : 7 - i; return [30 + c * ((w - 60) / cols2) + ((w - 60) / cols2 - bw) / 2, h * (r === 0 ? 0.28 : 0.62)]; });
  const speed = step === 3 ? 0.35 : 2.2, phase = (t * speed) % 1, active = Math.floor(phase * n);
  for (let i = 0; i < n; i++) {
    const [x, y] = pos[i], [nx, ny] = pos[(i + 1) % n];
    const ax = i === 3 ? x + bw / 2 : x + (i < 4 ? bw : 0), ay = y + bh / 2;
    if (i === 3) arrow(ctx, x + bw / 2, y + bh, nx + bw / 2, ny, C.line, 1.5);
    else if (i === 7) arrow(ctx, x + bw / 2, y, nx + bw / 2, ny + bh, C.line, 1.5);
    else if (i < 3) arrow(ctx, x + bw, ay, nx, ay, C.line, 1.5);
    else arrow(ctx, x, ay, nx + bw, ay, C.line, 1.5);
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pos[i], on = i === active;
    rbox(ctx, x, y, bw, bh, 8, on ? C.accent : C.panel, on ? C.accent : C.line, 1.5);
    text(ctx, PIPE[i], x + bw / 2, y + bh / 2, on ? "#fff" : C.ink, 12, "center", 600);
  }
  if (step === 3) text(ctx, "iq* from the speed loop  →  PI  →  vq", w / 2, h * 0.5, C.muted, 12);
  else text(ctx, `${Math.floor(st * 20000).toLocaleString()} loops since you started watching`, w / 2, h * 0.5, C.accent, 13, "center", 600);
}

/* ======================================================= regen */
function regen(ctx, w, h, s, C) {
  const { step, st, t } = s;
  const y0 = 50, bx = 40, ix = w * 0.42, mx = w - 140, bw2 = 100, bh2 = 46;
  const blocks = [[bx, "Battery"], [ix, "Inverter"], [mx, "Motor"]];
  const back = step >= 1;
  if (step === 4) {
    const bars = [["Recovered to battery", 0.64, C.good], ["Motor losses", 0.12, C.warn], ["Inverter losses", 0.05, C.warn], ["Battery losses", 0.05, C.warn], ["Drag and friction", 0.14, C.muted]];
    const x0 = Math.min(220, w * 0.34), W = w - x0 - 60;
    text(ctx, "Kinetic energy at the start of braking = 100%", 24, 28, C.ink, 13, "left", 600);
    bars.forEach(([lab, v, col], i) => {
      const y = 64 + i * 46, g = ease(st / 1.5 - i * 0.12);
      text(ctx, lab, x0 - 12, y + 12, C.ink, 12, "right", 500, SANS);
      rbox(ctx, x0, y, W, 24, 6, C.bg, C.line, 1); rbox(ctx, x0, y, Math.max(2, W * v * g), 24, 6, col);
      text(ctx, Math.round(v * 100 * g) + "%", x0 + W * v * g + 10, y + 12, C.ink, 12, "left", 600);
    });
    return;
  }
  // blocks
  blocks.forEach(([x, lab]) => { rbox(ctx, x, y0, bw2, bh2, 8, C.panel, C.ink, 1.5); text(ctx, lab, x + bw2 / 2, y0 + bh2 / 2, C.ink, 12, "center", 600); });
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + bw2, y0 + bh2 / 2); ctx.lineTo(mx, y0 + bh2 / 2); ctx.stroke();
  // particles
  const toRes = step === 3, col = back ? C.good : C.accent;
  for (let k = 0; k < 10; k++) {
    let u = ((t * 0.5 + k / 10) % 1);
    if (back) u = 1 - u;
    let x = bx + bw2 + u * (mx - bx - bw2), y = y0 + bh2 / 2;
    if (toRes && x < ix + bw2 / 2) { x = ix + bw2 / 2; y = y0 + bh2 + (ix + bw2 / 2 - (bx + bw2 + u * (mx - bx - bw2))) / (ix - bx) * 70; }
    dot(ctx, x, y, 4, toRes && y > y0 + bh2 ? C.bad : col);
  }
  // redraw the blocks on top so particles pass behind them
  blocks.forEach(([x, lab]) => { rbox(ctx, x, y0, bw2, bh2, 8, C.panel, C.ink, 1.5); text(ctx, lab, x + bw2 / 2, y0 + bh2 / 2, C.ink, 12, "center", 600); });
  if (toRes) {
    const glow = 0.5 + 0.5 * Math.sin(t * 6);
    rbox(ctx, ix + bw2 / 2 - 40, y0 + bh2 + 74, 80, 26, 6, `rgba(185,28,28,${0.15 + 0.35 * glow})`, C.bad, 1.5);
    text(ctx, "brake resistor", ix + bw2 / 2, y0 + bh2 + 87, C.bad, 11, "center", 600);
    text(ctx, "FULL", bx + bw2 / 2, y0 + bh2 + 14, C.bad, 11, "center", 700);
  }
  // car and road
  const roadY = h - 40, carX = w * 0.5 - 90, speed = back ? Math.max(0.6, 2.5 - st * 0.3) : 2.5;
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, roadY); ctx.lineTo(w, roadY); ctx.stroke();
  ctx.setLineDash([18, 16]); ctx.lineDashOffset = t * 60 * speed; ctx.beginPath(); ctx.moveTo(0, roadY + 12); ctx.lineTo(w, roadY + 12); ctx.stroke(); ctx.setLineDash([]);
  rbox(ctx, carX, roadY - 62, 180, 40, 12, C.ink); rbox(ctx, carX + 40, roadY - 86, 100, 28, 10, C.ink);
  [carX + 38, carX + 142].forEach((wx) => {
    dot(ctx, wx, roadY - 18, 17, C.ink); dot(ctx, wx, roadY - 18, 11, C.panel);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; const a = -t * 4 * speed;
    for (let k = 0; k < 3; k++) { const aa = a + k * TAU / 3; ctx.beginPath(); ctx.moveTo(wx, roadY - 18); ctx.lineTo(wx + Math.cos(aa) * 10, roadY - 18 + Math.sin(aa) * 10); ctx.stroke(); }
  });
  text(ctx, back ? "braking: negative torque" : "driving: positive torque", carX + 90, roadY - 104, back ? C.good : C.accent, 12, "center", 600);
  if (step === 2) {
    const gx = w - 190, gy = y0 + bh2 + 30, gw = 170, gh = 90;
    rbox(ctx, gx, gy, gw, gh, 8, C.bg, C.line, 1);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const u = i / 60, v = 48 + 4 * ease((st - (1 - u) * 3) / 2); const x = gx + 8 + u * (gw - 16), y = gy + gh - 12 - (v - 46) / 8 * (gh - 24); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); text(ctx, `DC bus ${(48 + 4 * ease(st / 2)).toFixed(1)} V`, gx + 10, gy + 12, C.ink, 11, "left", 600);
  }
}

/* ======================================================= drone */
function drone(ctx, w, h, s, C) {
  const { step, st, t } = s;
  const cx = w / 2, cy = h * 0.45, L = Math.min(w * 0.36, 260);
  let th = 0;
  if (step === 1) th = 18 * ease(st / 0.8);
  if (step === 2) th = 18;
  if (step === 3) th = 18 * Math.exp(-1.4 * st) * Math.cos(2.4 * st);
  if (step === 4) th = st < 0.6 ? 0 : -14 * Math.exp(-1.2 * (st - 0.6)) * Math.sin(2.6 * (st - 0.6) + 0.3) * 1.2;
  const failed = step === 4 && st > 0.6;
  const a = th * Math.PI / 180;
  const motors = [-1, -0.45, 0.45, 1];
  const thrust = motors.map((m, i) => {
    if (failed && i === 0) return 0;
    let base = 1; if (failed) base = 4 / 3;
    const corr = step >= 3 ? (m > 0 ? 1 : -1) * th / 30 : 0;
    return Math.max(0.2, base + corr);
  });
  if (step === 1) {
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
    for (let k = 0; k < 5; k++) { const y = 40 + k * 18, x = ((t * 220 + k * 70) % (w * 0.6)) - 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.stroke(); }
    text(ctx, "gust", 30, 30, C.muted, 12, "left", 600);
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.stroke();
  rbox(ctx, -34, -14, 68, 28, 8, C.ink);
  if (step >= 2) { const blink = 0.5 + 0.5 * Math.sin(t * 10); rbox(ctx, -14, -8, 28, 16, 4, `rgba(194,65,12,${0.4 + 0.6 * blink})`); text(ctx, "IMU", 0, 0, "#fff", 9, "center", 700); }
  motors.forEach((m, i) => {
    const x = m * L, dead = failed && i === 0;
    rbox(ctx, x - 8, -24, 16, 20, 3, dead ? C.bad : C.ink);
    const spin = dead ? 0.15 : Math.abs(Math.sin(t * 30 + i));
    ctx.fillStyle = dead ? C.line : C.muted; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(x, -28, 46 * (0.3 + 0.7 * spin), 4, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    if (!dead) {
      arrow(ctx, x, -36, x, -36 - 50 * thrust[i], C.accent, 3);
      ctx.fillStyle = C.b; ctx.globalAlpha = 0.35;
      for (let k = 0; k < 4; k++) { const yy = ((t * 120 + k * 22) % 88) + 4; dot(ctx, x + ((k % 2) - 0.5) * 18, yy, 2.5, C.b); }
      ctx.globalAlpha = 1;
    } else text(ctx, "✕", x, -50, C.bad, 18, "center", 700);
  });
  ctx.restore();
  text(ctx, `roll ${th.toFixed(1)}°`, w - 20, 24, Math.abs(th) > 5 ? C.warn : C.good, 13, "right", 600);
  if (step >= 3) {
    const sx = 20, sy = h - 78, sw = Math.min(300, w - 40);
    strip(ctx, sx, sy, sw, 62, (u) => {
      const tt = st - (1 - u) * 3;
      if (step === 3) return tt < 0 ? 1 : Math.exp(-1.4 * tt) * Math.cos(2.4 * tt);
      return tt < 0.6 ? 0 : -Math.exp(-1.2 * (tt - 0.6)) * Math.sin(2.6 * (tt - 0.6) + 0.3);
    }, C.accent, C, "roll angle over time");
  }
}

/* ======================================================= battery */
function cell(ctx, x, y, cw, ch, fill, C, hot = 0) {
  const col = hot > 0 ? `rgb(${Math.round(194 + 40 * hot)},${Math.round(120 - 80 * hot)},${Math.round(60 - 40 * hot)})` : C.accent;
  rbox(ctx, x + cw * 0.3, y - 5, cw * 0.4, 6, 2, C.ink);
  rbox(ctx, x, y, cw, ch, 6, C.panel, C.ink, 1.5);
  rbox(ctx, x + 3, y + 3 + (ch - 6) * (1 - fill), cw - 6, (ch - 6) * fill, 4, col);
}
function battery(ctx, w, h, s, C) {
  const { step, st, t } = s;
  const cw = 34, ch = 70;
  if (step === 0) {
    const x = w / 2 - cw, y = h / 2 - ch;
    cell(ctx, x, y, cw * 2, ch * 2, 0.75 + 0.05 * Math.sin(t * 2), C);
    text(ctx, "3.7 V · 5 Ah", w / 2, y + ch * 2 + 26, C.ink, 15, "center", 600);
    return;
  }
  if (step === 1) {
    const n = Math.min(6, 1 + Math.floor(st * 1.6)), gap = 14, total = n * cw + (n - 1) * gap, x0 = w / 2 - total / 2, y = h / 2 - ch / 2;
    for (let i = 0; i < n; i++) { cell(ctx, x0 + i * (cw + gap), y, cw, ch, 0.8, C); if (i) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + i * (cw + gap) - gap, y + ch / 2); ctx.lineTo(x0 + i * (cw + gap), y + ch / 2); ctx.stroke(); } }
    text(ctx, `${n}S  →  ${(n * 3.7).toFixed(1)} V`, w / 2, y + ch + 34, C.ink, 16, "center", 700);
    return;
  }
  const ns = 6, np = step === 2 ? Math.min(3, 1 + Math.floor(st * 1.2)) : 3, gap = 12, total = ns * cw + (ns - 1) * gap;
  const x0 = step >= 3 ? 30 : w / 2 - total / 2, y0 = h / 2 - (np * (ch + 18)) / 2;
  const I = 10 + 50 * (0.5 + 0.5 * Math.sin(t * 0.9)), hot = step === 4 ? Math.min(1, (I - 10) / 50) : 0;
  for (let r = 0; r < np; r++) for (let i = 0; i < ns; i++) cell(ctx, x0 + i * (cw + gap), y0 + r * (ch + 18), cw, ch, 0.8, C, hot);
  if (step === 2) { text(ctx, `6S${np}P  →  22.2 V · ${np * 5} Ah`, w / 2, y0 + np * (ch + 18) + 20, C.ink, 16, "center", 700); return; }
  // load and meter
  const R = 0.06, V = 22.2 - I * R, mx = x0 + total + 50, mw = w - mx - 30;
  for (let k = 0; k < 8; k++) { const u = (t * 0.8 + k / 8) % 1; dot(ctx, mx - 30 + u * 20, h / 2 - 50 + u * 0, 3, C.accent); }
  rbox(ctx, mx, h / 2 - 90, mw, 180, 10, C.bg, C.line, 1);
  text(ctx, `current  ${I.toFixed(0)} A`, mx + 16, h / 2 - 64, C.ink, 14, "left", 600);
  if (step === 3) {
    text(ctx, `voltage  ${V.toFixed(2)} V`, mx + 16, h / 2 - 34, C.ink, 14, "left", 600);
    rbox(ctx, mx + 16, h / 2 - 10, mw - 32, 18, 9, C.panel, C.line, 1); rbox(ctx, mx + 16, h / 2 - 10, (mw - 32) * (V - 18) / 4.2, 18, 9, C.accent);
    text(ctx, `sag = I·R = ${(I * R).toFixed(2)} V`, mx + 16, h / 2 + 40, C.muted, 12, "left");
  } else {
    const P = I * I * R;
    text(ctx, `heat  ${P.toFixed(0)} W`, mx + 16, h / 2 - 34, hot > 0.6 ? C.bad : C.ink, 14, "left", 600);
    rbox(ctx, mx + 16, h / 2 - 10, mw - 32, 18, 9, C.panel, C.line, 1); rbox(ctx, mx + 16, h / 2 - 10, (mw - 32) * Math.min(1, P / 216), 18, 9, C.bad);
    text(ctx, "P = I²·R: 2× current → 4× heat", mx + 16, h / 2 + 40, C.muted, 12, "left");
  }
}

export const STORY_DRAW: Record<string, Function> = {
  "motor-torque": motorTorque,
  inverter,
  foc,
  regen,
  drone,
  battery,
};
