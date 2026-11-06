import type { Metadata } from "next";
import { ExplainerCards } from "@/components/ExplainerCards";
import Link from "next/link";
import { Story } from "@/components/Story";
import { ANATOMIES } from "@/lib/content/anatomy";

export const metadata: Metadata = { title: "Animated explainers" };

export default function ExplainPage() {
  return (
    <div className="wrap page">
      <div className="page-title">
        <span className="eyebrow">Watch first</span>
        <h1>Animated explainers</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>
          Big ideas in five short animated steps. Press play, or step through at your own pace with the arrows.
          Each one also appears at the top of the lessons it explains.
        </p>
      </div>
      <div className="an-feature-list">
        {ANATOMIES.map((a) => (
          <Link key={a.id} href={`/anatomy/${a.id}`} className="an-feature">
            <span className="eyebrow">Labelled teardown</span>
            <b>{a.title}</b>
            <span className="muted">{a.blurb}</span>
            <span className="an-feature-go">Open the teardown →</span>
          </Link>
        ))}
      </div>
      <Story id="motor-torque" />
      <ExplainerCards />
    </div>
  );
}
