"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FORMULAS, GLOSSARY } from "@/lib/content/reference";

interface Group { code: string; title: string; ids: string[] }
interface Props { groups: Group[]; lessonTitles: Record<string, string> }

const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").toLowerCase();

export function ReferenceView({ groups, lessonTitles }: Props) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const match = (...parts: string[]) => !needle || parts.some((p) => plain(p).includes(needle));

  const sections = useMemo(() => groups.map((g) => ({
    ...g,
    formulas: FORMULAS.filter((f) => g.ids.includes(f.lesson) &&
      match(f.name, f.eq, f.note ?? "", lessonTitles[f.lesson] ?? "", ...f.vars.flat())),
  })).filter((g) => g.formulas.length), [groups, needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const terms = GLOSSARY.filter((t) => match(t.term, t.def));
  const count = sections.reduce((s, g) => s + g.formulas.length, 0);

  return (
    <div className="ref">
      <div className="filters-row ref-search">
        <label htmlFor="ref-q" className="muted">Search formulas and terms</label>
        <input id="ref-q" className="search" type="search" placeholder="e.g. Kv, ripple, slip, Park" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted mono">{count} formulas · {terms.length} terms</span>
      </div>

      {sections.map((g) => (
        <section key={g.code} className="ref-group">
          <h2><span className="mono">{g.code}</span> {g.title}</h2>
          <div className="ref-grid">
            {g.formulas.map((f) => (
              <article key={f.id} id={f.id} className="ref-card">
                <header>
                  <h3>{f.name}</h3>
                  <Link href={`/learn/${f.lesson}`} className="muted">{lessonTitles[f.lesson]} →</Link>
                </header>
                <div className="eq" dangerouslySetInnerHTML={{ __html: f.eq }} />
                {f.vars.length > 0 && (
                  <table className="ref-vars"><tbody>
                    {f.vars.map(([sym, meaning, unit]) => (
                      <tr key={sym}><td dangerouslySetInnerHTML={{ __html: sym }} /><td dangerouslySetInnerHTML={{ __html: meaning }} /><td className="mono">{unit}</td></tr>
                    ))}
                  </tbody></table>
                )}
                {f.note && <p className="hint" dangerouslySetInnerHTML={{ __html: f.note }} />}
              </article>
            ))}
          </div>
        </section>
      ))}

      {terms.length > 0 && (
        <section className="ref-group" id="glossary">
          <h2>Glossary</h2>
          <dl className="glossary">
            {terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd><span dangerouslySetInnerHTML={{ __html: t.def }} /> <Link href={`/learn/${t.lesson}`} className="muted">{lessonTitles[t.lesson]} →</Link></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {count === 0 && terms.length === 0 && <p className="muted">Nothing matches “{q}”. Try a symbol name such as Kt or a topic such as ripple.</p>}
    </div>
  );
}
