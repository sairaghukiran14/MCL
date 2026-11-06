/* Battery → controller (inverter + control) → three phases → motor, with position feedback.
   Every block links to the lesson that covers it. */

export function SystemDiagram() {
  return (
    <svg viewBox="0 0 640 230" className="sysd" role="img" aria-label="System: DC power feeds the motor controller, which drives three phases into the BLDC motor; the position sensor reports back to the controller.">
      <defs>
        <marker id="sd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
      </defs>

      <a href="/learn/battery-pack" className="sd-node">
        <rect x="8" y="58" width="128" height="74" rx="10" />
        <rect x="58" y="51" width="28" height="8" rx="2" className="sd-term" />
        <text x="72" y="92" textAnchor="middle" className="sd-t">DC power</text>
        <text x="72" y="110" textAnchor="middle" className="sd-s">battery · DC bus</text>
      </a>
      <line x1="136" y1="95" x2="190" y2="95" stroke="var(--ink)" strokeWidth="1.6" markerEnd="url(#sd-arrow)" />
      <text x="163" y="85" textAnchor="middle" className="sd-s">48 V DC</text>

      <a href="/learn/inverter-svpwm" className="sd-node">
        <rect x="194" y="40" width="168" height="110" rx="10" />
        <text x="278" y="66" textAnchor="middle" className="sd-t">Motor controller</text>
        <text x="278" y="83" textAnchor="middle" className="sd-s">inverter + control</text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${226 + i * 40} 96)`} className="sd-fet">
            <rect width="24" height="16" rx="2" /><rect y="22" width="24" height="16" rx="2" />
          </g>
        ))}
      </a>

      {(["A", "B", "C"] as const).map((ph, i) => {
        const y = 70 + i * 25;
        const color = ["var(--ph-r)", "var(--ph-y)", "var(--ph-b)"][i];
        return (
          <g key={ph}>
            <line x1="362" y1={y} x2="470" y2={y} stroke={color} strokeWidth="3" className="sd-flow" style={{ animationDelay: `${-i * 0.33}s` }} />
            <text x="372" y={y - 5} className="sd-ph" fill={color}>{ph}</text>
          </g>
        );
      })}
      <text x="416" y="40" textAnchor="middle" className="sd-s">3-phase AC</text>

      <a href="#exploded" className="sd-node sd-motor">
        <rect x="474" y="40" width="156" height="110" rx="10" />
        <rect x="494" y="64" width="78" height="58" rx="6" fill="url(#an-dark)" />
        {[72, 82, 92, 102, 112].map((y) => <line key={y} x1="497" y1={y} x2="569" y2={y} stroke="#000" strokeOpacity=".35" />)}
        <ellipse cx="494" cy="93" rx="9" ry="29" fill="#5d636c" />
        <rect x="572" y="88" width="34" height="10" rx="2" fill="url(#an-steel)" />
        <text x="552" y="140" textAnchor="middle" className="sd-t">BLDC motor</text>
      </a>

      <a href="/learn/quadrature-encoder" className="sd-node sd-fb">
        <path d="M552 150 V196 H278 V154" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#sd-arrow)" />
        <text x="415" y="216" textAnchor="middle" className="sd-s">rotor position feedback · Hall sensors or encoder</text>
      </a>
    </svg>
  );
}
