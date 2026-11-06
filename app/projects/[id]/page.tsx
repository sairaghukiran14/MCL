import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROJECTS, findProject } from "@/lib/content/projects";
import { findLesson } from "@/lib/content";
import { ProjectView } from "@/components/ProjectView";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: findProject(id)?.title ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const p = findProject(id);
  if (!p) notFound();
  const i = PROJECTS.indexOf(p);
  const ids = [...new Set([...(p.prereqs ?? []), ...p.lessons])];
  const lessons = ids.flatMap((lid) => {
    const r = findLesson(lid);
    return r ? [{ id: lid, title: r.lesson.title, level: r.lesson.level, prereq: !!p.prereqs?.includes(lid) }] : [];
  });
  const prev = PROJECTS[i - 1], next = PROJECTS[i + 1];
  return (
    <ProjectView p={p} lessons={lessons}
      prev={prev && { id: prev.id, title: prev.title }} next={next && { id: next.id, title: next.title }} />
  );
}
