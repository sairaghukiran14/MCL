import type { Metadata } from "next";
import { ReviewSession } from "@/components/ReviewSession";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <div className="wrap page narrow">
      <div className="page-title">
        <span className="eyebrow">Spaced review</span>
        <h1>Review</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>
          Questions you have already solved come back just before you would forget them: after 1 day, then 3, 7, 21 and 60.
          Get one right and it waits longer. Miss it and it starts again tomorrow.
        </p>
      </div>
      <ReviewSession />
    </div>
  );
}
