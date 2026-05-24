import type { ReviewState, Scenario } from "./types";

const LOCAL_SCENARIOS_KEY = "jp_podcast_local_scenarios";
const REVIEW_PREFIX = "jp_podcast_review";

export const lineKey = (scenarioId: string, lineId: string | undefined, order: number) =>
  `${REVIEW_PREFIX}:${scenarioId}:${lineId ?? order}`;

export const getReviewState = (scenarioId: string, lineId: string | undefined, order: number, fallback: ReviewState = "new") => {
  return (localStorage.getItem(lineKey(scenarioId, lineId, order)) as ReviewState | null) ?? fallback;
};

export const setReviewState = (scenarioId: string, lineId: string | undefined, order: number, state: ReviewState) => {
  localStorage.setItem(lineKey(scenarioId, lineId, order), state);
};

export const getLocalScenarios = (): Scenario[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SCENARIOS_KEY) ?? "[]") as Scenario[];
  } catch {
    return [];
  }
};

export const saveLocalScenario = (scenario: Scenario) => {
  const existing = getLocalScenarios().filter((item) => item.id !== scenario.id);
  localStorage.setItem(LOCAL_SCENARIOS_KEY, JSON.stringify([...existing, scenario]));
};

export const getLocalScenario = (id: string): Scenario | undefined =>
  getLocalScenarios().find((scenario) => scenario.id === id);
