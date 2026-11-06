# Motor Control Lab (MCL)

An interactive learning app for **EV motor control and power electronics**, from a sine wave to a
flying board that could lift a person. Every concept comes with a live simulation, not just text:
you drag a slider and watch the currents, torque and switching states respond.

Built with Next.js (App Router), React 19 and TypeScript. The simulations run on plain `<canvas>`
with no charting or physics dependencies, and all progress is stored in your browser, so there is
no backend, account or database.

## What's inside

| | |
|---|---|
| **6 tracks, 30 lessons** | Electrical and magnetic foundations → electrical machines → power electronics → motor control → embedded and real-time → a flying-board capstone. Each lesson is graded Basic, Fundamental or Advanced. |
| **Hands-on lessons** | Each lesson has a live simulation, quiz questions, numeric challenges, a debugging case and a proof-of-work task. The 18 core lessons also have step-by-step worked examples. |
| **Live FOC drive lab** | A real-time PMSM + inverter + field-oriented-control model (80 kHz plant, 40 kHz current loop) with **7 hidden-fault missions** to diagnose from the scopes and spectrum. |
| **Labelled teardowns** | Exploded, hover-able views of a **BLDC motor**, a **48 V motor inverter** and a **quadcopter flight stack**, each with a live cross-section or mixer, a system diagram and a quiz. |
| **6 animated explainers** | Motor torque, inverters, FOC, regenerative braking, how a drone stays level, how a battery pack is built. |
| **44 build projects** | From a paper-clip motor to an eVTOL, with parts lists, ₹ cost estimates, milestones with acceptance checks and common pitfalls. |
| **Spaced review** | Every solved question becomes a Leitner card that comes back after 1, 3, 7, 21 and 60 days. |
| **Reference** | A searchable formula sheet and glossary, each entry linked back to the lesson that teaches it. |
| **13-week route** | A suggested study plan at 15–20 hours a week. |

## Quick start

Requires Node.js 20 or newer.

```bash
git clone https://github.com/sairaghukiran14/MCL.git
cd MCL
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build (also type-checks)
npm start        # serve the production build
```

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page with live demos |
| `/tracks/[track]` | A track and its lessons |
| `/learn/[lesson]` | A lesson: simulation, quiz, challenges, debug case (and a worked example for core lessons) |
| `/explain` and `/explain/[id]` | Animated explainers, plus the teardown index |
| `/anatomy/[id]` | A labelled teardown (`bldc`, `inverter`, `drone`) |
| `/lab` | The live FOC drive lab and its fault missions |
| `/projects` and `/projects/[id]` | Build projects |
| `/review` | Spaced-repetition review |
| `/reference` | Formula sheet and glossary |
| `/route` | The 13-week study plan |

## Project layout

```
app/                    Routes and global styles (globals.css)
components/             React UI: lesson view, quiz and challenge widgets, progress, landing demos
  anatomy/              Teardown drawings: one kit per teardown, registered in kits.tsx
lib/content/            All learning content, as typed TypeScript data
  core-tracks.ts        The 18 core lessons and the lab missions
  extra-lessons.ts      12 more lessons, merged by track in index.ts
  index.ts              Ordering, lookup helpers and the 13-week route
  projects.ts           Build projects
  worked.ts             Worked examples for the core lessons
  reference.ts          Formula sheet and glossary, each entry linked to a lesson
  explainers.ts         Animated-explainer captions (drawing lives in lib/sim/stories.ts)
  anatomy.ts            Teardown words: parts, steps, takeaways, quizzes
lib/sim/                Canvas simulations (browser only, mounted by <SimHost/>)
  runtime.ts            Plotting and control helpers
  sims.ts, sims-extra.ts  One function per simulation
  lab.ts                The real-time PMSM + FOC drive model
  stories.ts            Canvas drawing for each explainer step
docs/roadmap.html       Product roadmap and ideas backlog
```

## Adding content

All content is data, so most additions are an object appended to an array. Nothing needs a new route.

### Add a lesson

1. Append a lesson object to `EXTRA_LESSONS[trackId]` in `lib/content/extra-lessons.ts`.
2. Set `sim` to a key in `SIMS`. Add one in `lib/sim/sims-extra.ts`, or reuse an existing key.
3. Optionally add it to `WEEKS` in `lib/content/index.ts` to place it in the 13-week route.

### Add a project

Append an object to `PROJECTS` in `lib/content/projects.ts`. It appears in the project browser, gets
its own page, and shows up under "Build it" in every lesson it lists.

### Add a worked example

Add an entry keyed by lesson id to `WORKED` in `lib/content/worked.ts`, or set `worked` on the lesson itself.

### Add a teardown

A teardown is split into the words and the drawing, so each can be edited on its own.

1. **Words:** append an entry to `ANATOMIES` in `lib/content/anatomy.ts`: parts (with `group`, `fn` and an
   optional linked `lesson`), steps, takeaways, a quiz and the lessons to link.
2. **Drawing:** create the four pieces in `components/anatomy/`:
   - `Scene`: the exploded view. It receives `t` (0 assembled, 1 exploded) and the active parts.
   - `Icon`: a small picture of each part for the parts list.
   - `Live`: an interactive panel (a cross-section, a switching-state diagram, a mixer, and so on).
   - `System`: the whole-system block diagram, with each block linking to a lesson.
3. **Register** the kit under the same id in `components/anatomy/kits.tsx`.

It then appears automatically on `/explain` and as a callout on every lesson it links to.
`components/anatomy/DroneDrawing.tsx` is a compact example of the isometric exploded-stack style.

> **Check your links.** Lesson links must point at real lesson ids. Some ids look like lessons but
> are explainers, tracks or reference entries (for example `drone`, `flyboard`, `kv-kt`) and would
> give a dead `/learn/...` page.

## Progress and mastery

Progress lives in your browser's `localStorage` under `emk-progress-v3` (migrated automatically from
`emk-progress-v2`). It holds XP marks, review cards and the last lesson opened. See
`components/ProgressProvider.tsx`. Clearing site data resets it.

- **Review cards.** Every solved quiz question, challenge and debug case becomes a card in Leitner
  box 1. A right answer moves it up a box (it returns after 1, 3, 7, 21, then 60 days). A miss sends it
  back to box 1.
- **Mastery** is derived, never stored: Seen (opened) → Practised (80% quiz, all challenges, debug) →
  Applied (also proof of work or a finished linked project) → Mastered (also every card in box 4 or higher).

## Tech notes

- **Next.js 16 and React 19.** This is a recent major version with changes from older releases, so check
  `node_modules/next/dist/docs/` before relying on remembered APIs. `AGENTS.md` says the same for
  AI coding tools.
- **Static by design.** Lessons, teardowns, projects and explainers are prerendered with
  `generateStaticParams`, so the production build is almost entirely static HTML.
- **No runtime dependencies beyond Next and React.** Simulations, plots and teardown drawings are
  hand-written canvas and SVG.
- **Motion is optional.** The teardown and system-diagram animations respect `prefers-reduced-motion`.

## Roadmap

`docs/roadmap.html` is a prioritised backlog: dark theme, offline use, keyboard-operable sim sliders,
a data-table fallback for screen readers, and more.
