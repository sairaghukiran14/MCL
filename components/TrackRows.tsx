"use client";

import Link from "next/link";
import { useProgress } from "./ProgressProvider";
import type { Track } from "@/lib/content/types";

export function TrackRows({ tracks }: { tracks: Track[] }) {
  const { mastery, ready } = useProgress();
  return (
    <div className="track-list">
      {tracks.map((t) => {
        const lv = t.lessons.map((l) => (ready ? mastery(l).level : 0));
        const practised = lv.filter((x) => x >= 2).length;
        const mastered = lv.filter((x) => x === 4).length;
        return (
          <Link key={t.id} className="track-row" href={`/tracks/${t.id}`}>
            <span className="code">{t.code}</span>
            <div>
              <h3>{t.title}</h3>
              <p>{t.summary}</p>
            </div>
            <div className="track-meta">
              <span>{t.lessons.length} lessons · {practised} practised · {mastered} mastered</span>
              <span className="ladder" aria-hidden="true">
                {lv.map((x, i) => <i key={i} className={`m${x}`} />)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
