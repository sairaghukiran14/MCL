/* Inside the controller: the high-current power path along the bottom, the low-voltage control path
   along the top, and the measurements that close the loop. Each block links to its lesson. */

function Node({ href, x, y, w, h, title, sub }: { href: string; x: number; y: number; w: number; h: number; title: string; sub?: string }) {
  return (
    <a href={href} className="sd-node">
      <rect x={x} y={y} width={w} height={h} rx="9" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5)} textAnchor="middle" className="sd-t">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" className="sd-s">{sub}</text>}
    </a>
  );
}

export function InverterSystem() {
  return (
    <svg viewBox="0 0 640 262" className="sysd" role="img"
      aria-label="Battery feeds the DC link and power stage, which drives the motor. The microcontroller drives the gate drivers, which switch the power stage. Phase currents and rotor angle feed back to the microcontroller, which talks CAN to the vehicle.">
      <defs>
        <marker id="isd-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" /></marker>
        <marker id="isd-c" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ph-b)" /></marker>
        <marker id="isd-f" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" /></marker>
      </defs>

      <text x="8" y="12" className="sd-s">control · 3.3 V and 12 V</text>
      <Node href="/learn/can-bus" x={8} y={20} w={110} h={50} title="Vehicle" sub="CAN bus" />
      <Node href="/learn/foc-fw" x={160} y={20} w={130} h={50} title="Microcontroller" sub="FOC at 20 kHz" />
      <Node href="/learn/mosfet-losses" x={332} y={20} w={120} h={50} title="Gate drivers" sub="dead time" />

      <text x="8" y="146" className="sd-s">power · 48 V, up to 60 A</text>
      <Node href="/learn/battery-pack" x={8} y={156} w={110} h={58} title="Battery" sub="48 V" />
      <Node href="/learn/dc-link" x={160} y={156} w={110} h={58} title="DC link" sub="capacitor bank" />
      <Node href="/learn/inverter-svpwm" x={312} y={156} w={140} h={58} title="Power stage" sub="6 MOSFETs" />
      <Node href="#exploded" x={520} y={156} w={110} h={58} title="Motor" sub="3 phases" />

      <path d="M118,45 H158" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#isd-c)" markerStart="url(#isd-c)" />
      <path d="M290,45 H330" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#isd-c)" />
      <text x="310" y="38" textAnchor="middle" className="sd-s">PWM</text>
      <path d="M392,70 V154" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#isd-c)" />
      <text x="398" y="100" className="sd-s">gate pulses</text>

      <path d="M118,185 H158" stroke="var(--ink)" strokeWidth="2.4" markerEnd="url(#isd-a)" />
      <path d="M270,185 H310" stroke="var(--ink)" strokeWidth="2.4" markerEnd="url(#isd-a)" />
      {["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"].map((c, i) => (
        <line key={i} x1="452" y1={172 + i * 13} x2="518" y2={172 + i * 13} stroke={c} strokeWidth="3" className="sd-flow" style={{ animationDelay: `${-i * 0.33}s` }} />
      ))}

      <path d="M340,156 V128 H250 V72" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#isd-f)" />
      <text x="258" y="122" className="sd-s">phase currents (shunts → ADC)</text>
      <path d="M575,156 V100 H200 V72" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#isd-f)" />
      <text x="470" y="94" className="sd-s">rotor angle (Hall / encoder)</text>
      <text x="320" y="252" textAnchor="middle" className="sd-s">thick lines carry power · blue lines are logic · dashed lines are measurements</text>
    </svg>
  );
}
