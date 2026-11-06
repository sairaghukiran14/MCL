/* The whole craft as a system: the pilot's radio and the attitude loop along the top in logic,
   the power path along the bottom from battery to thrust, and the IMU closing the loop. Each
   block links to the lesson that covers it. */

function Node({ href, x, y, w, h, title, sub }: { href: string; x: number; y: number; w: number; h: number; title: string; sub?: string }) {
  return (
    <a href={href} className="sd-node">
      <rect x={x} y={y} width={w} height={h} rx="9" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5)} textAnchor="middle" className="sd-t">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" className="sd-s">{sub}</text>}
    </a>
  );
}

export function DroneSystem() {
  return (
    <svg viewBox="0 0 640 286" className="sysd" role="img"
      aria-label="The pilot's transmitter feeds the receiver, which feeds the flight controller. The IMU reports attitude to the controller, which sends four throttles to the ESCs. The battery powers the ESCs, which drive the motors and props to make thrust.">
      <defs>
        <marker id="dsd-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" /></marker>
        <marker id="dsd-c" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ph-b)" /></marker>
        <marker id="dsd-f" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" /></marker>
      </defs>

      <text x="8" y="12" className="sd-s">control · logic</text>
      <Node href="/learn/telemetry-debug" x={8} y={20} w={104} h={48} title="Transmitter" sub="pilot sticks" />
      <Node href="/learn/telemetry-debug" x={150} y={20} w={104} h={48} title="Receiver" sub="decodes link" />
      <Node href="/learn/stability-failure" x={300} y={20} w={150} h={60} title="Flight controller" sub="mix + attitude loop" />
      <Node href="/learn/loop-timing" x={300} y={120} w={100} h={46} title="IMU" sub="gyro + accel" />

      <text x="8" y="196" className="sd-s">power · high current</text>
      <Node href="/learn/battery-pack" x={8} y={206} w={104} h={56} title="Battery" sub="LiPo 4S" />
      <Node href="/learn/inverter-svpwm" x={150} y={206} w={120} h={56} title="4-in-1 ESC" sub="four inverters" />
      <Node href="/learn/bldc-sixstep" x={308} y={206} w={110} h={56} title="Motors" sub="4 × BLDC" />
      <Node href="/learn/thrust-hover" x={456} y={206} w={110} h={56} title="Props" sub="thrust + torque" />

      {/* logic chain */}
      <path d="M112,44 H148" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#dsd-c)" />
      <path d="M254,44 H298" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#dsd-c)" />
      <text x="276" y="36" textAnchor="middle" className="sd-s">demands</text>

      {/* IMU feedback up into the controller */}
      <path d="M350,120 V82" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#dsd-f)" />
      <text x="356" y="104" className="sd-s">attitude</text>

      {/* four throttles down to the ESC */}
      <path d="M330,80 V150 H210 V204" fill="none" stroke="var(--ph-b)" strokeWidth="1.6" markerEnd="url(#dsd-c)" />
      <text x="214" y="146" className="sd-s">4 throttles</text>

      {/* power chain */}
      <path d="M112,234 H148" stroke="var(--ink)" strokeWidth="2.4" markerEnd="url(#dsd-a)" />
      <text x="130" y="226" textAnchor="middle" className="sd-s">14.8 V</text>
      {["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"].map((c, i) => (
        <line key={i} x1="270" y1={222 + i * 9} x2="306" y2={222 + i * 9} stroke={c} strokeWidth="3" className="sd-flow" style={{ animationDelay: `${-i * 0.33}s` }} />
      ))}
      <path d="M418,234 H454" stroke="var(--ink)" strokeWidth="2.4" markerEnd="url(#dsd-a)" />

      {/* battery also powers the flight controller */}
      <path d="M60,206 V110 H298" fill="none" stroke="var(--muted)" strokeWidth="1.4" strokeDasharray="2 4" markerEnd="url(#dsd-a)" />
      <text x="120" y="104" className="sd-s">5 V logic supply</text>

      <text x="320" y="280" textAnchor="middle" className="sd-s">thick lines carry power · blue lines are logic · dashed accent lines are measurements</text>
    </svg>
  );
}
