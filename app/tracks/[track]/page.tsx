import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRACKS, findTrack } from "@/lib/content";
import { TrackView } from "@/components/TrackView";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/tracks/[track]">): Promise<Metadata> {
  const { track } = await params;
  const t = findTrack(track);
  return { title: t ? `${t.code} ${t.title}` : "Track" };
}

export default async function TrackPage({ params }: PageProps<"/tracks/[track]">) {
  const { track } = await params;
  const t = findTrack(track);
  if (!t) notFound();
  return <TrackView track={t} />;
}
