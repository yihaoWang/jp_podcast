export type Speaker = "you" | "other";

export interface SubtitleLine {
  order: number;
  speaker: Speaker;
  native: string;
  target: string;
  start: number;
  end: number;
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
