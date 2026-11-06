"use client";

import { useState } from "react";
import type { WorkedExample as Worked } from "@/lib/content/types";

interface Props {
  worked: Worked;
  done: boolean;
  onDone: () => void;
  onSkip: () => void;
}

/* Reveals a solved problem one step at a time. Seeing the answer counts as finishing it. */
export function WorkedExample({ worked: w, done, onDone, onSkip }: Props) {
  const [shown, setShown] = useState(0);
  const visible = done ? w.steps.length : shown;
  const finished = visible >= w.steps.length;
  const reveal = (n: number) => {
    const next = Math.min(w.steps.length, n);
    setShown(next);
    if (next >= w.steps.length && !done) onDone();
  };
  return (
    <div className="worked">
      <p className="worked-prompt"><b>Problem.</b> <span dangerouslySetInnerHTML={{ __html: w.prompt }} /></p>
      {visible > 0 && (
        <ol className="worked-steps">
          {w.steps.slice(0, visible).map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
        </ol>
      )}
      {finished && <div className="why"><b>Answer.</b> <span dangerouslySetInnerHTML={{ __html: w.answer }} /></div>}
      {!finished && (
        <div className="btn-row worked-actions">
          <button type="button" className="btn small primary" onClick={() => reveal(visible + 1)}>
            {visible === 0 ? "Show the first step" : `Show step ${visible + 1} of ${w.steps.length}`}
          </button>
          <button type="button" className="btn small" onClick={() => reveal(w.steps.length)}>Show all steps</button>
          <button type="button" className="btn small" onClick={onSkip}>I can do this, go to the challenges</button>
        </div>
      )}
      {!finished && visible > 0 && <p className="hint">Before each step, try to say what comes next.</p>}
    </div>
  );
}
