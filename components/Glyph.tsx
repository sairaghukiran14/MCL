/* Small animated SVG glyphs. Animation is pure CSS (see globals.css) and stops under reduced motion. */
export type GlyphKind = "motor" | "ev" | "drone" | "power" | "embedded" | "future" | "battery";

export function Glyph({ kind, size = 56 }: { kind: GlyphKind; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 64 64", fill: "none", "aria-hidden": true, className: `glyph glyph-${kind}` } as const;
  switch (kind) {
    case "motor":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="27" stroke="var(--line)" strokeWidth="2" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x="30" y="6" width="4" height="8" rx="1" fill="var(--line)" transform={`rotate(${a} 32 32)`} />
          ))}
          <g className="g-spin">
            <circle cx="32" cy="32" r="15" fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.5" />
            <rect x="32" y="28" width="12" height="8" rx="1.5" fill="var(--accent)" />
            <rect x="20" y="28" width="12" height="8" rx="1.5" fill="var(--ink)" />
          </g>
        </svg>
      );
    case "ev":
      return (
        <svg {...common}>
          <path d="M8 40 L14 28 Q16 24 21 24 L42 24 Q47 24 50 28 L56 36 L56 42 L8 42 Z" fill="var(--ink)" />
          <rect x="22" y="27" width="10" height="7" rx="1.5" fill="var(--panel)" />
          <rect x="35" y="27" width="10" height="7" rx="1.5" fill="var(--panel)" />
          {[18, 46].map((x) => (
            <g key={x} className="g-spin-fast">
              <circle cx={x} cy="44" r="6.5" fill="var(--panel)" stroke="var(--ink)" strokeWidth="2.5" />
              <path d={`M${x} 39.5 V48.5 M${x - 4.5} 44 H${x + 4.5}`} stroke="var(--accent)" strokeWidth="1.5" />
            </g>
          ))}
          <path className="g-road" d="M2 55 H62" stroke="var(--line)" strokeWidth="2" strokeDasharray="6 5" />
        </svg>
      );
    case "drone":
      return (
        <svg {...common}>
          <path d="M14 14 L50 50 M50 14 L14 50" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          <rect x="25" y="25" width="14" height="14" rx="3" fill="var(--accent)" />
          {[[14, 14], [50, 14], [14, 50], [50, 50]].map(([x, y], i) => (
            <ellipse key={i} className={`g-prop g-prop-${i}`} cx={x} cy={y} rx="11" ry="2.6" fill="var(--muted)" opacity=".7" />
          ))}
        </svg>
      );
    case "power":
      return (
        <svg {...common}>
          <path d="M6 32 H14 V16 H22 V48 H30 V16 H38 V48 H46 V16 H52 V32 H58" stroke="var(--line)" strokeWidth="2" />
          <path className="g-flow" d="M6 32 C14 8 22 8 32 32 S50 56 58 32" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 5" />
        </svg>
      );
    case "embedded":
      return (
        <svg {...common}>
          <rect x="18" y="18" width="28" height="28" rx="4" fill="var(--ink)" />
          {[22, 29, 36, 43].map((p) => (
            <g key={p} stroke="var(--line)" strokeWidth="2">
              <path d={`M${p - 0.5} 18 V10 M${p - 0.5} 46 V54 M18 ${p - 0.5} H10 M46 ${p - 0.5} H54`} />
            </g>
          ))}
          <circle className="g-pulse" cx="32" cy="32" r="5" fill="var(--accent)" />
          <circle className="g-blink" cx="25" cy="25" r="2" fill="var(--good)" />
        </svg>
      );
    case "future":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="24" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 4" />
          <ellipse cx="32" cy="32" rx="24" ry="9" stroke="var(--line)" strokeWidth="1.5" transform="rotate(-25 32 32)" />
          <circle className="g-pulse" cx="32" cy="32" r="7" fill="var(--accent)" />
          <g className="g-orbit"><circle cx="56" cy="32" r="3.5" fill="var(--ink)" /></g>
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect x="16" y="12" width="32" height="44" rx="5" stroke="var(--ink)" strokeWidth="2.5" />
          <rect x="26" y="7" width="12" height="5" rx="1.5" fill="var(--ink)" />
          <rect className="g-fill" x="20" y="16" width="24" height="36" rx="3" fill="var(--accent)" />
          <path d="M34 22 L27 35 H33 L30 46 L38 31 H32 Z" fill="var(--panel)" />
        </svg>
      );
  }
}

export const CAT_GLYPH: Record<string, GlyphKind> = {
  motor: "motor", ev: "ev", drone: "drone", power: "power", embedded: "embedded", future: "future",
};
