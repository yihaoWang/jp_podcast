export type Speaker = "you" | "other";
export type SourceType = "generated_scenario" | "uploaded_audio";
export type ReviewState = "new" | "correct" | "wrong" | "skipped";

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
  line_id?: string;
  source_type?: SourceType;
  source_id?: string;
  difficulty?: string;
  review_state?: ReviewState;
  breakdown?: BreakdownToken[];
  grammar_note?: string;
}

export interface Scenario {
  id: string;
  title: string;
  context: string;
  language_code: string;
  native_language_code?: string;
  source_type?: SourceType;
  source_id?: string;
  difficulty?: string;
  duration: number;
  variants?: AudioVariant[];
  lines: SubtitleLine[];
}

export interface ScenarioIndexEntry {
  id: string;
  title: string;
  context: string;
  duration: number;
  line_count: number;
  source_type?: SourceType;
  source_id?: string;
  difficulty?: string;
  variants?: AudioVariant[];
}

export interface ScenarioIndex {
  scenarios: ScenarioIndexEntry[];
}

export interface AudioVariant {
  mode: string;
  label: string;
  path: string;
  duration?: number;
}
