"use client";

import { useRef, useState } from "react";
import type { ChallengeItem } from "@/lib/content/types";

interface McqProps {
  title: string;
  options: string[];
  answer: number;
  why: string;
  solved: boolean;
  onRight: () => void;
}

export function Mcq({ title, options, answer, why, solved, onRight }: McqProps) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  const done = solved || right;
  const lastWrong = !done && wrong.length > 0;
  return (
    <div className="q">
      <p dangerouslySetInnerHTML={{ __html: title }} />
      <div className="opts">
        {options.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={done}
            className={`opt${done && i === answer ? " right" : ""}${!done && wrong.includes(i) ? " wrong" : ""}`}
            onClick={() => {
              if (i === answer) { setRight(true); onRight(); }
              else setWrong((w) => (w.includes(i) ? w : [...w, i]));
            }}
          >
            <span className="k">{"ABCD"[i]}</span>
            <span dangerouslySetInnerHTML={{ __html: o }} />
          </button>
        ))}
      </div>
      {done && <div className="why"><b>{solved && !right ? "Solved." : "Correct."}</b> <span dangerouslySetInnerHTML={{ __html: why }} /></div>}
      {lastWrong && <div className="why no"><b>Not quite.</b> Think it through again and pick another option.</div>}
    </div>
  );
}

interface ChallengeProps {
  item: ChallengeItem;
  index: number;
  solved: boolean;
  onSolved: () => void;
}

export function Challenge({ item, index, solved, onSolved }: ChallengeProps) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hints, setHints] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = `ans-${index}-${item.answer}`;

  const check = () => {
    const v = parseFloat(value.replace(/,/g, ""));
    if (Number.isNaN(v)) { setMsg({ ok: false, text: "Enter a number" }); return; }
    const tol = item.tol === 0 ? 0.5 : Math.max(Math.abs(item.answer) * item.tol, 1e-6);
    if (Math.abs(v - item.answer) <= tol) { setMsg({ ok: true, text: "✓ solved" }); onSolved(); }
    else setMsg({ ok: false, text: v > item.answer ? "✗ too high" : "✗ too low" });
  };
  const shown = solved ? { ok: true, text: "✓ solved" } : msg;
  return (
    <div className="q">
      <p><span dangerouslySetInnerHTML={{ __html: `${index + 1}. ${item.q}` }} /></p>
      <div className="answer-row">
        <input
          id={id} ref={input} inputMode="decimal" aria-label="Your answer" placeholder="your answer"
          value={solved ? String(item.answer) : value} disabled={solved}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
        />
        <span className="unit">{item.unit}</span>
        <button type="button" className="btn small primary" onClick={check} disabled={solved}>Check</button>
        <button type="button" className="btn small" onClick={() => setHints((h) => Math.min(item.hints.length + 1, h + 1))}>Hint</button>
        <button type="button" className="btn small" onClick={() => setShowSol(true)}>Show solution</button>
        {shown && <span className={`status ${shown.ok ? "ok" : "no"}`}>{shown.text}</span>}
      </div>
      {item.hints.slice(0, hints).map((h, i) => (
        <p key={i} className="hint" dangerouslySetInnerHTML={{ __html: `Hint ${i + 1}: ${h}` }} />
      ))}
      {hints > item.hints.length && <p className="hint">No more hints. Try the solution.</p>}
      {showSol && <p className="hint"><span dangerouslySetInnerHTML={{ __html: `Solution: ${item.solution}` }} /> <i>(no XP until you enter it yourself)</i></p>}
    </div>
  );
}
