"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress, xpMax } from "./ProgressProvider";

const LINKS = [
  { href: "/#tracks", label: "Tracks", match: "/tracks" },
  { href: "/explain", label: "Explainers", match: "/explain" },
  { href: "/projects", label: "Projects", match: "/projects" },
  { href: "/lab", label: "Live lab", match: "/lab" },
  { href: "/route", label: "Route", match: "/route" },
  { href: "/reference", label: "Formulas", match: "/reference" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { xp, ready, due } = useProgress();
  const max = xpMax();
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Motor Control Lab home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          </svg>
          Motor Control Lab
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.match) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/review" className={`review-pill${ready && due.length ? " has" : ""}`} aria-current={pathname.startsWith("/review") ? "page" : undefined}>
          Review{ready && due.length > 0 && <b>{due.length}</b>}
        </Link>
        <div className="header-xp" aria-label="Experience points">
          <span>{ready ? xp : 0} / {max} XP</span>
          <span className="xpbar" aria-hidden="true"><i style={{ width: `${ready ? (100 * xp) / max : 0}%` }} /></span>
        </div>
      </div>
    </header>
  );
}
