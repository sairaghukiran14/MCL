"use client";

import { useEffect, useRef } from "react";
import { animate, arrow, dot, fitCanvas, reducedMotion, themeColors } from "@/lib/sim/runtime";

/** Three phase currents make a rotating field that drags the rotor around. */
export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    let t = 0.6;
    const draw = () => {
      const C = themeColors();
      const { ctx, w, h } = fitCanvas(cv);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
      const cols = [C.r, C.y, C.b], names = ["R", "Y", "B"];
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.88, 0, 7); ctx.stroke();
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88); ctx.lineTo(cx + Math.cos(a) * R * 1.12, cy + Math.sin(a) * R * 1.12); ctx.stroke();
      }
      let sx = 0, sy = 0;
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3, iv = Math.cos(t - (k * 2 * Math.PI) / 3);
        sx += iv * Math.cos(a); sy += iv * Math.sin(a);
        [a, a + Math.PI].forEach((aa, j) => {
          const px = cx + Math.cos(aa) * R, py = cy + Math.sin(aa) * R;
          ctx.globalAlpha = 0.25 + 0.75 * Math.abs(iv);
          dot(ctx, px, py, R * 0.075, cols[k]);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff"; ctx.font = `600 ${Math.round(R * 0.07)}px ui-monospace, Menlo, monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(names[k] + (j ? "′" : ""), px, py + 1);
        });
      }
      const ang = Math.atan2(sy, sx);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang - 0.3);
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R * 0.56, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.accent; ctx.fillRect(0, -R * 0.13, R * 0.5, R * 0.26);
      ctx.fillStyle = C.ink; ctx.fillRect(-R * 0.5, -R * 0.13, R * 0.5, R * 0.26);
      ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(R * 0.11)}px ui-monospace, Menlo, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("N", R * 0.28, 1); ctx.fillText("S", -R * 0.28, 1);
      ctx.restore();
      arrow(ctx, cx, cy, cx + (sx / 1.5) * R * 0.78, cy + (sy / 1.5) * R * 0.78, C.ink, 2.5);
      ctx.fillStyle = C.muted; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillText("constant-magnitude rotating field", cx, h - 6);
    };
    if (reducedMotion()) { draw(); return; }
    const stop = animate((dt) => { t += dt * 1.3; draw(); });
    return stop;
  }, []);
  return <canvas ref={ref} aria-label="Animation: three stator phases R, Y and B create a rotating magnetic field that turns the rotor" />;
}
