import type { Metadata } from "next";
import { ProjectsBrowser } from "@/components/ProjectsBrowser";
import { PROJECTS } from "@/lib/content/projects";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  const free = PROJECTS.filter((p) => p.budget[1] === 0).length;
  return (
    <div className="wrap page">
      <div className="page-title">
        <span className="eyebrow">Build to learn</span>
        <h1>{PROJECTS.length} projects</h1>
        <p className="muted" style={{ maxWidth: "64ch" }}>
          Motors, EVs, drones, power electronics, firmware and frontier ideas. Each project lists parts with rough
          ₹ costs, milestones you can tick off and the lessons to study first. {free} of them need only free software.
        </p>
      </div>
      <ProjectsBrowser />
    </div>
  );
}
