// @ts-nocheck
/* Imperative canvas + control helpers shared by the simulations and the live lab.
   Everything here runs in the browser only; sims are mounted from <SimHost/>. */

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

export function h(tag: string, attrs: Record<string, string> = {}, html = ""): HTMLElement {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (html) e.innerHTML = html;
  return e;
}

/* ---------- animation loops, cleaned up when a sim unmounts ---------- */
let currentScope: Array<() => void> | null = null;
export function beginScope(): Array<() => void> {
  const s: Array<() => void> = [];
  currentScope = s;
  return s;
}
export function endScope() {
  currentScope = null;
}
export function reducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function animate(fn: (dt: number, t: number) => void) {
  let id = 0;
  let last = performance.now();
  let alive = true;
  const step = (now: number) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fn(dt, now / 1000);
    id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  const stop = () => {
    alive = false;
    cancelAnimationFrame(id);
  };
  if (currentScope) currentScope.push(stop);
  return stop;
}

/* ---------- canvas helpers ---------- */
export function themeColors() {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string) => s.getPropertyValue(n).trim();
  return {
    ink: g("--ink"), muted: g("--muted"), line: g("--line"), grid: g("--grid"),
    accent: g("--accent"), copper: g("--accent"),
    r: g("--ph-r"), y: g("--ph-y"), b: g("--ph-b"),
    good: g("--good"), warn: g("--warn"), bad: g("--bad"),
    paper: g("--bg"), bg: g("--bg"), panel: g("--panel"),
  };
}
export function fitCanvas(cv: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth, hh = cv.clientHeight;
  const W = Math.max(1, Math.round(w * dpr)), Hh = Math.max(1, Math.round(hh * dpr));
  if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, hh);
  return { ctx, w, h: hh };
}
function niceStep(range: number, n: number) {
  const raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
}
export function fmtNum(v: number, d?: number) {
  if (d !== undefined) return v.toFixed(d);
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 10000) return (v / 1000).toFixed(0) + "k";
  if (a >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/0$/, "");
}
export function axes(ctx: CanvasRenderingContext2D, box: any, o: any) {
  const C = o.C, { x, y, w, h: hh } = box;
  const X = (v: number) => x + (v - o.xmin) / (o.xmax - o.xmin) * w;
  const Y = (v: number) => y + hh - (v - o.ymin) / (o.ymax - o.ymin) * hh;
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.lineWidth = 1;
  const xs = niceStep(o.xmax - o.xmin, o.xn || 6), ys = niceStep(o.ymax - o.ymin, o.yn || 4);
  ctx.strokeStyle = C.grid; ctx.fillStyle = C.muted;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let v = Math.ceil(o.xmin / xs) * xs; v <= o.xmax + 1e-9; v += xs) {
    const px = X(v);
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + hh); ctx.stroke();
    if (!o.noXLabels) ctx.fillText((o.xfmt || fmtNum)(v), px, y + hh + 4);
  }
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let v = Math.ceil(o.ymin / ys) * ys; v <= o.ymax + 1e-9; v += ys) {
    const py = Y(v);
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
    ctx.fillText((o.yfmt || fmtNum)(Math.abs(v) < 1e-9 ? 0 : v), x - 5, py);
  }
  if (o.ymin < 0 && o.ymax > 0) {
    ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x, Y(0)); ctx.lineTo(x + w, Y(0)); ctx.stroke();
  }
  ctx.fillStyle = C.muted; ctx.textAlign = "left"; ctx.textBaseline = "top";
  if (o.ylabel) ctx.fillText(o.ylabel, x + 4, y + 2);
  if (o.xlabel) { ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(o.xlabel, x + w - 2, y + hh - 3); }
  return { X, Y };
}
export function plotLine(ctx: CanvasRenderingContext2D, xs: number[], ys: number[], X: any, Y: any, color: string, width = 2, dash?: number[]) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.lineJoin = "round"; ctx.beginPath();
  for (let i = 0; i < xs.length; i++) { const px = X(xs[i]), py = Y(ys[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.setLineDash([]);
}
export function plotFn(ctx: CanvasRenderingContext2D, f: (x: number) => number, x0: number, x1: number, X: any, Y: any, color: string, width = 2, n = 300, dash?: number[]) {
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; xs.push(x); ys.push(f(x)); }
  plotLine(ctx, xs, ys, X, Y, color, width, dash);
}
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
export function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width = 2.5) {
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hl = Math.min(10, L * 0.35);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - hl * 0.6 * Math.cos(a), y1 - hl * 0.6 * Math.sin(a)); ctx.stroke();
  if (L < 2) return;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
  ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

/* ---------- controls ---------- */
let ctlSeq = 0;
export function ctl(parent: HTMLElement, o: any) {
  const id = "c" + (++ctlSeq) + "-" + (o.key || "x");
  const wrap = h("div", { class: "ctl" });
  const fmt = o.fmt || ((v: number) => v);
  wrap.innerHTML = `<label for="${id}"><span>${o.label}</span><output>${fmt(o.value)}${o.unit ? " " + o.unit : ""}</output></label>`;
  const inp = h("input", { type: "range", id, min: o.min, max: o.max, step: o.step, value: o.value }) as HTMLInputElement;
  wrap.appendChild(inp); parent.appendChild(wrap);
  const out = wrap.querySelector("output")!;
  const obj = {
    get v() { return parseFloat(inp.value); },
    set(v: number) { inp.value = String(v); out.textContent = fmt(parseFloat(inp.value)) + (o.unit ? " " + o.unit : ""); },
    el: inp,
  };
  inp.addEventListener("input", () => {
    out.textContent = fmt(parseFloat(inp.value)) + (o.unit ? " " + o.unit : "");
    o.onInput && o.onInput(obj.v);
  });
  return obj;
}
export function toggle(parent: HTMLElement, label: string, checked: boolean, onChange?: (v: boolean) => void) {
  const id = "t" + (++ctlSeq);
  const l = h("label", { class: "toggle", for: id });
  l.innerHTML = `<input type="checkbox" id="${id}" ${checked ? "checked" : ""}> <span>${label}</span>`;
  parent.appendChild(l);
  const inp = l.querySelector("input") as HTMLInputElement;
  inp.addEventListener("change", () => onChange && onChange(inp.checked));
  return { get v() { return inp.checked; }, set(v: boolean) { inp.checked = v; }, el: inp };
}
export function selectCtl(parent: HTMLElement, label: string, options: [string, string][], value: string, onChange?: (v: string) => void) {
  const id = "s" + (++ctlSeq);
  const wrap = h("div", { class: "ctl" });
  wrap.innerHTML = `<label for="${id}"><span>${label}</span></label>`;
  const s = h("select", { id }) as HTMLSelectElement;
  options.forEach(([v, t]) => { const op = h("option", { value: v }); op.textContent = t; if (v === value) (op as HTMLOptionElement).selected = true; s.appendChild(op); });
  wrap.appendChild(s); parent.appendChild(wrap);
  s.addEventListener("change", () => onChange && onChange(s.value));
  return { get v() { return s.value; }, set(v: string) { s.value = v; }, el: s };
}
export function readouts(parent: HTMLElement, items: [string, string][]) {
  const g = h("div", { class: "readouts" });
  const map: Record<string, HTMLElement> = {};
  items.forEach(([k, label]) => { const d = h("div", { class: "ro" }, `<span>${label}</span><b>–</b>`); g.appendChild(d); map[k] = d; });
  parent.appendChild(g);
  return (k: string, v: any, cls?: string) => {
    const d = map[k]; if (!d) return;
    d.querySelector("b")!.textContent = String(v);
    d.className = "ro" + (cls ? " " + cls : "");
  };
}
export function legend(parent: HTMLElement, items: [string, string][]) {
  const d = h("div", { class: "legend" });
  d.innerHTML = items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("");
  parent.appendChild(d);
  return d;
}
