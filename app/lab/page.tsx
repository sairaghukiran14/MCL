import type { Metadata } from "next";
import { LabView } from "@/components/LabView";
import { MISSIONS } from "@/lib/content";

export const metadata: Metadata = { title: "Live lab" };

export default function LabPage() {
  return (
    <div className="wrap page">
      <div className="page-title">
        <span className="eyebrow">PMSM 7 pp · 24 V · 40 kHz loop · real time</span>
        <h1>Live FOC drive lab</h1>
        <p className="muted" style={{ maxWidth: "68ch" }}>
          A simulated surface-PMSM drive running in real time: two-shunt sensing, Clarke/Park, decoupled PI
          current loops, an SVPWM voltage limit, field weakening, thermal derating and a battery bus that rises
          during regeneration. Each of the {MISSIONS.length} missions hides a fault. Read the scopes and the
          spectrum, then name the root cause.
        </p>
      </div>
      <LabView />
    </div>
  );
}
