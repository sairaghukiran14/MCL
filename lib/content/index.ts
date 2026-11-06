import { CORE_TRACKS, MISSIONS, DIAGNOSES } from "./core-tracks";
import { EXTRA_LESSONS } from "./extra-lessons";
import { WORKED } from "./worked";
import type { Lesson, Level, Track } from "./types";

const ORDER: Level[] = ["Basic", "Fundamental", "Advanced"];

/* Core + extra lessons, ordered Basic → Fundamental → Advanced inside each track. */
export const TRACKS: Track[] = CORE_TRACKS.map((t) => ({
  ...t,
  lessons: [...t.lessons, ...(EXTRA_LESSONS[t.id] ?? [])].map((l) => ({ ...l, worked: l.worked ?? WORKED[l.id] })).sort(
    (a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level),
  ),
}));

export { MISSIONS, DIAGNOSES, ORDER };

export interface LessonRef { lesson: Lesson; track: Track; index: number }

export const ALL_LESSONS: Lesson[] = TRACKS.flatMap((t) => t.lessons);
const REFS: LessonRef[] = TRACKS.flatMap((t) => t.lessons.map((lesson) => ({ lesson, track: t, index: 0 })))
  .map((r, i) => ({ ...r, index: i }));

export const findTrack = (id: string) => TRACKS.find((t) => t.id === id);
export const findLesson = (id: string): LessonRef | undefined => REFS.find((r) => r.lesson.id === id);
export const neighbours = (id: string) => {
  const r = findLesson(id);
  if (!r) return { prev: undefined, next: undefined };
  return { prev: REFS[r.index - 1], next: REFS[r.index + 1] };
};

/* The 13-week route. Ids refer to lessons; "LAB" and "PORTFOLIO" are special. */
export const WEEKS: { w: string; focus: string; ids: string[] }[] = [
  { w: "W1", focus: "AC, phasors, three-phase power", ids: ["ac-phasors", "three-phase", "rl-transient"] },
  { w: "W2", focus: "Electromagnetism and magnetic circuits", ids: ["em-torque", "magnetic-circuit"] },
  { w: "W3", focus: "DC motor, datasheets and PI control", ids: ["dc-motor", "motor-constants", "pi-control"] },
  { w: "W4", focus: "BLDC and six-step commutation", ids: ["bldc-sixstep", "quadrature-encoder"] },
  { w: "W5", focus: "PWM, boost and MOSFET losses", ids: ["pwm-buck", "mosfet-losses", "boost-regen"] },
  { w: "W6", focus: "Inverter, SVPWM and ADC sampling", ids: ["inverter-svpwm", "adc-sampling", "dc-link"] },
  { w: "W7", focus: "Clarke, Park and the d-q model", ids: ["clarke-park", "pmsm-dq", "induction-slip"] },
  { w: "W8", focus: "FOC, loop bandwidth and timing", ids: ["foc-fw", "current-loop-delay", "loop-timing"] },
  { w: "W9", focus: "Telemetry, CAN and debugging a live drive", ids: ["telemetry-debug", "can-bus", "LAB"] },
  { w: "W10", focus: "Thrust, disc loading and hover power", ids: ["thrust-hover"] },
  { w: "W11", focus: "Full-scale sizing and batteries", ids: ["board-sizing", "battery-pack"] },
  { w: "W12", focus: "Stability, faults, sensorless and thermal", ids: ["stability-failure", "motor-thermal", "sensorless"] },
  { w: "W13", focus: "Integration, portfolio, applications", ids: ["PORTFOLIO"] },
];
