import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_LESSONS, findLesson, neighbours } from "@/lib/content";
import { LessonView } from "@/components/LessonView";

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ lesson: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[lesson]">): Promise<Metadata> {
  const { lesson } = await params;
  const r = findLesson(lesson);
  return { title: r ? r.lesson.title : "Lesson" };
}

export default async function LessonPage({ params }: PageProps<"/learn/[lesson]">) {
  const { lesson } = await params;
  const r = findLesson(lesson);
  if (!r) notFound();
  const { prev, next } = neighbours(lesson);
  return (
    <LessonView
      lesson={r.lesson}
      track={{ id: r.track.id, code: r.track.code, title: r.track.title }}
      prev={prev && { id: prev.lesson.id, title: prev.lesson.title }}
      next={next && { id: next.lesson.id, title: next.lesson.title }}
    />
  );
}
