export type Level = "Basic" | "Fundamental" | "Advanced";

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  why: string;
}
export interface ChallengeItem {
  q: string;
  answer: number;
  tol: number;
  unit: string;
  hints: string[];
  solution: string;
}
export interface DebugCase {
  scenario: string;
  code?: string;
  options: string[];
  answer: number;
  why: string;
}
export interface WorkedExample {
  prompt: string;
  steps: string[];
  answer: string;
}
export interface Lesson {
  id: string;
  level: Level;
  title: string;
  minutes: number;
  sim: string;
  theory: string;
  simNote: string;
  quiz: QuizItem[];
  challenges: ChallengeItem[];
  debug: DebugCase;
  pow: string;
  worked?: WorkedExample;
}
export interface Track {
  id: string;
  code: string;
  title: string;
  summary: string;
  rating: string;
  lessons: Lesson[];
}
export interface Mission {
  id: string;
  fault: string;
  title: string;
  brief: string;
  answer: string;
  why: string;
}
