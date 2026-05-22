export type Speaker = "you" | "other";

export interface BreakdownToken {
  surface: string;
  reading: string;
  pos: string;
  meaning: string;
}

export interface SubtitleLine {
  order: number;
  speaker: Speaker;
  native: string;
  target: string;
  start: number;
  end: number;
  breakdown?: BreakdownToken[];
  grammar_note?: string;
}

export interface Scenario {
  id: string;
  title: string;
  context: string;
  language_code: string;
  duration: number;
  lines: SubtitleLine[];
}

export interface ScenarioIndexEntry {
  id: string;
  title: string;
  context: string;
  duration: number;
  line_count: number;
}

export interface ScenarioIndex {
  scenarios: ScenarioIndexEntry[];
}
