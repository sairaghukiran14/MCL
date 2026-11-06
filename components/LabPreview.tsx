"use client";

import { useEffect, useRef } from "react";
import { animate, axes, fitCanvas, plotLine, themeColors } from "@/lib/sim/runtime";
import { Drive } from "@/lib/sim/lab";

/** A small live FOC drive: the speed setpoint alternates and the real controller responds. */
export function LabPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  const roRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const d: any = new (Drive as any)();
    d.cfg = { ...(Drive as any).prototype.cfg, rpmRef: 800, load: 0.3 };
    let clock = 0, n = 0;
    return animate((dt) => {
      clock += dt;
      d.cfg.rpmRef = Math.floor(clock / 3) % 2 === 0 ? 800 : 3000;
      d.run(dt);
      const C = themeColors();
      const { ctx, w, h } = fitCanvas(cv);
      const vis = d.slow.filter((r: number[]) => r[0] > d.t - 4);
      const ax = axes(ctx, { x: 44, y: 8, w: w - 54, h: h - 26 }, { xmin: -4, xmax: 0, ymin: 0, ymax: 3600, C, xfmt: (v: number) => v.toFixed(0) + "s", yn: 3 });
      plotLine(ctx, vis.map((r: number[]) => r[0] - d.t), vis.map((r: number[]) => r[2]), ax.X, ax.Y, C.muted, 1.2, [4, 3]);
      plotLine(ctx, vis.map((r: number[]) => r[0] - d.t), vis.map((r: number[]) => r[1]), ax.X, ax.Y, C.accent, 2.2);
      const Yq = (v: number) => 8 + (h - 26) * (1 - (v + 5) / 45);
      plotLine(ctx, vis.map((r: number[]) => r[0] - d.t), vis.map((r: number[]) => r[4]), ax.X, Yq, C.good, 1.4);
      if (++n % 6 === 0 && roRef.current)
        roRef.current.textContent = `${(d.wm * 60 / (2 * Math.PI)).toFixed(0)} rpm · iq ${d.iqm.toFixed(1)} A · id ${d.idm.toFixed(1)} A · ${d.state}`;
    });
  }, []);
  return (
    <div className="panel preview">
      <div className="cap"><span>Live: speed (orange), iq (green), setpoint (dashed)</span><span ref={roRef} /></div>
      <canvas ref={ref} aria-label="Live plot of motor speed and q-axis current from a running field-oriented controller" />
    </div>
  );
}
