import type { Metadata } from "next";
import { TRACKS } from "@/lib/content";
import { ReferenceView } from "@/components/ReferenceView";

export const metadata: Metadata = { title: "Formulas" };

export default function ReferencePage() {
  const groups = TRACKS.map((t) => ({ code: t.code, title: t.title, ids: t.lessons.map((l) => l.id) }));
  const lessonTitles = Object.fromEntries(TRACKS.flatMap((t) => t.lessons.map((l) => [l.id, l.title])));
  return (
    <div className="wrap page">
      <div className="page-title">
        <span className="eyebrow">Reference</span>
        <h1>Formulas and terms</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>
          Every equation from the lessons with its symbols and units, grouped by track. Each one links back to the lesson that derives it.
        </p>
      </div>
      <ReferenceView groups={groups} lessonTitles={lessonTitles} />
    </div>
  );
}
