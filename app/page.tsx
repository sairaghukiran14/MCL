import Link from "next/link";
import { ALL_LESSONS, MISSIONS, TRACKS, WEEKS } from "@/lib/content";
import { HeroField } from "@/components/HeroField";
import { LabPreview } from "@/components/LabPreview";
import { TrackRows } from "@/components/TrackRows";
import { TodayPanel } from "@/components/TodayPanel";
import { Story } from "@/components/Story";
import { ExplainerCards } from "@/components/ExplainerCards";
import { ProjectCard } from "@/components/ProjectCard";
import { EXPLAINERS } from "@/lib/content/explainers";
import { PROJECTS, findProject } from "@/lib/content/projects";

const FEATURED = ["coil-motor", "axial-flux", "thrust-stand", "ebike-foc", "wireless-drone", "evtol-sim"];

const STEPS: [string, string][] = [
  ["Learn", "Theory with the equations that matter, nothing padded."],
  ["Explore", "A live simulation. Drag a slider, watch the physics move."],
  ["Quiz", "Short questions that explain the answer after you pick."],
  ["Challenge", "Numeric problems. Work it out and enter the number."],
  ["Debug", "A real firmware or wiring symptom. Find the root cause."],
  ["Prove", "A deliverable for your GitHub: your proof of work."],
];

export default function Home() {
  const quizzes = ALL_LESSONS.reduce((s, l) => s + l.quiz.length, 0);
  const challenges = ALL_LESSONS.reduce((s, l) => s + l.challenges.length, 0);
  const first = ALL_LESSONS[0];
  return (
    <main>
      <div className="wrap">
        <TodayPanel />
        <section className="hero">
          <div>
            <span className="eyebrow">EV motor control &amp; power electronics</span>
            <h1 style={{ marginTop: 16 }}>Learn motor control by <em>running</em> it.</h1>
            <p className="lede">
              {ALL_LESSONS.length} lessons from a sine wave to field-oriented control. Every one has a live
              simulation, a quiz, numeric challenges and a firmware bug to find.
            </p>
            <div className="btn-row">
              <Link className="btn primary" href={`/learn/${first.id}`}>Start learning</Link>
              <Link className="btn" href="/lab">Open the live lab</Link>
            </div>
          </div>
          <HeroField />
        </section>

        <div className="stats">
          <div className="stat"><b>{TRACKS.length}</b><span>tracks</span></div>
          <div className="stat"><b>{ALL_LESSONS.length}</b><span>lessons, Basic to Advanced</span></div>
          <div className="stat"><b>{ALL_LESSONS.length}</b><span>interactive simulations</span></div>
          <div className="stat"><b>{EXPLAINERS.length}</b><span>animated explainers</span></div>
          <div className="stat"><b>{PROJECTS.length}</b><span>build projects</span></div>
          <div className="stat"><b>{quizzes + challenges}</b><span>quiz questions and challenges</span></div>
          <div className="stat"><b>{MISSIONS.length}</b><span>hidden-fault lab missions</span></div>
        </div>

        <section className="section" aria-labelledby="watch-h">
          <div className="section-head">
            <span className="eyebrow">Watch first</span>
            <h2 id="watch-h">Hard ideas, animated step by step</h2>
            <p>Each explainer breaks one big idea into five short animations. Press play, or use the arrows to go at your own pace.</p>
          </div>
          <Story id="foc" />
          <ExplainerCards />
        </section>

        <section className="section" aria-labelledby="how">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 id="how">Six steps in every lesson</h2>
            <p>The loop is the same each time, so you always know what comes next and what counts as done.</p>
          </div>
          <ol className="loop-steps" style={{ padding: 0, margin: 0 }}>
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="n">0{i + 1}</span>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="tracks" aria-labelledby="tracks-h">
          <div className="section-head">
            <span className="eyebrow">Curriculum</span>
            <h2 id="tracks-h">Six tracks, three levels each</h2>
            <p>Start at Track 01, or jump to what you need. Each track climbs from Basic to Fundamental to Advanced.</p>
          </div>
          <TrackRows tracks={TRACKS} />
        </section>

        <section className="section" aria-labelledby="proj-h">
          <div className="section-head">
            <span className="eyebrow">Build</span>
            <h2 id="proj-h">{PROJECTS.length} projects, from a paper-clip motor to eVTOL</h2>
            <p>Motor design, EVs, drones, power electronics, firmware and frontier ideas. Each one lists parts, rough costs and milestones you can tick off.</p>
          </div>
          <div className="pgrid">
            {FEATURED.map((id, i) => { const p = findProject(id)!; return <ProjectCard key={id} p={p} index={i} />; })}
          </div>
          <div className="btn-row"><Link className="btn" href="/projects">See all {PROJECTS.length} projects</Link></div>
        </section>

        <section className="section split" aria-labelledby="lab-h">
          <div>
            <span className="eyebrow">Live lab</span>
            <h2 id="lab-h" style={{ marginTop: 10 }}>Debug a drive that is running</h2>
            <p className="muted" style={{ marginTop: 14 }}>
              A real-time PMSM and field-oriented controller, with scopes, a harmonic spectrum and seven
              hidden faults. Read the traces, then name the root cause.
            </p>
            <ul className="checks">
              <li><b>Real controller.</b> Clarke/Park, decoupled PI loops, SVPWM voltage limit, field weakening.</li>
              <li><b>Real failures.</b> Sensor offset, gain error, encoder angle, dead time, windup, overheating.</li>
              <li><b>Real symptoms.</b> Harmonics in iq point to the cause, just as they do on a bench.</li>
            </ul>
            <div className="btn-row" style={{ marginTop: 22 }}><Link className="btn" href="/lab">Open the lab</Link></div>
          </div>
          <LabPreview />
        </section>

        <section className="section split" aria-labelledby="cap-h">
          <div className="panel" style={{ padding: 24, display: "grid", gap: 18 }}>
            <span className="eyebrow">Full-scale estimate</span>
            <div className="stats" style={{ border: 0, padding: 0, gap: 28 }}>
              <div className="stat"><b>~120 kg</b><span>all-up mass</span></div>
              <div className="stat"><b>~24 kW</b><span>hover power</span></div>
              <div className="stat"><b>~4 kWh</b><span>10 min of flight</span></div>
              <div className="stat"><b>2 : 1</b><span>thrust to weight</span></div>
            </div>
            <p className="muted" style={{ fontSize: ".9rem" }}>
              First estimates from momentum theory, not a verified design.
            </p>
          </div>
          <div>
            <span className="eyebrow">Capstone</span>
            <h2 id="cap-h" style={{ marginTop: 10 }}>A board that could lift a person</h2>
            <p className="muted" style={{ marginTop: 14 }}>
              Track 06 sizes it from first principles: thrust, battery, heat and stability with a motor lost.
              The full-size board stays in simulation. You build and test a 1–1.5 kg scale model on a thrust stand.
            </p>
            <div className="btn-row" style={{ marginTop: 22 }}><Link className="btn" href="/tracks/flyboard">See Track 06</Link></div>
          </div>
        </section>

        <section className="section" aria-labelledby="route-h">
          <div className="section-head">
            <span className="eyebrow">Plan</span>
            <h2 id="route-h">Thirteen weeks, 15–20 hours a week</h2>
            <p>A route through the lessons that ends with a portfolio you can show an employer.</p>
          </div>
          <div className="timeline">
            {WEEKS.map((w) => (
              <div key={w.w} className="tl"><span className="w">{w.w}</span><span>{w.focus}</span></div>
            ))}
          </div>
        </section>

        <section className="cta" aria-labelledby="cta-h">
          <h2 id="cta-h" style={{ color: "#fff" }}>Start with a sine wave.</h2>
          <p>The first lesson takes 45 minutes. You will finish it knowing what a phasor is and why every motor drive depends on one.</p>
          <div className="btn-row">
            <Link className="btn primary" href={`/learn/${first.id}`}>Begin lesson 1</Link>
            <Link className="btn" href="/route">See the 13-week route</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
