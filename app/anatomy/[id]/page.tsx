import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ALL_LESSONS } from "@/lib/content";
import { ANATOMIES, findAnatomy } from "@/lib/content/anatomy";
import { AnatomyView } from "@/components/anatomy/AnatomyView";

export function generateStaticParams() {
  return ANATOMIES.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/anatomy/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: findAnatomy(id)?.title ?? "Anatomy" };
}

export default async function AnatomyPage({ params }: PageProps<"/anatomy/[id]">) {
  const { id } = await params;
  const a = findAnatomy(id);
  if (!a) notFound();
  const lessonTitles = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l.title]));
  return (
    <div className="wrap page">
      <div className="page-title">
        <div className="crumbs"><Link href="/explain">Explainers</Link><span>/</span><span>Teardown</span></div>
        <span className="eyebrow">Labelled teardown</span>
        <h1>{a.title}</h1>
        <p className="muted" style={{ maxWidth: "70ch" }}>{a.intro}</p>
      </div>
      <AnatomyView a={a} lessonTitles={lessonTitles} />
    </div>
  );
}
