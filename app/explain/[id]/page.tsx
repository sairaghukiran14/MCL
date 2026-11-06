import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXPLAINERS, findExplainer } from "@/lib/content/explainers";
import { findLesson } from "@/lib/content";
import { Story } from "@/components/Story";

export function generateStaticParams() {
  return EXPLAINERS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/explain/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: findExplainer(id)?.title ?? "Explainer" };
}

export default async function ExplainerPage({ params }: PageProps<"/explain/[id]">) {
  const { id } = await params;
  const e = findExplainer(id);
  if (!e) notFound();
  const i = EXPLAINERS.indexOf(e), next = EXPLAINERS[(i + 1) % EXPLAINERS.length];
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/explain">Explainers</Link><span>/</span><span>{e.title}</span></div>
      <div className="page-title">
        <h1>{e.title}</h1>
        <p className="muted">{e.summary}</p>
      </div>
      <Story id={e.id} />
      <section className="block">
        <header><h3>Go deeper</h3><span className="hint-xp">lessons with simulations, quizzes and challenges</span></header>
        <div className="related">
          {e.lessons.map((lid) => {
            const r = findLesson(lid);
            return r ? (
              <Link key={lid} href={`/learn/${lid}`} className="related-item">
                <span className="chip">{r.lesson.level}</span><span>{r.lesson.title}</span><span className="arrow-r">→</span>
              </Link>
            ) : null;
          })}
        </div>
      </section>
      <div className="lesson-nav"><span /><Link className="btn primary" href={`/explain/${next.id}`}>Next: {next.title} →</Link></div>
    </div>
  );
}
