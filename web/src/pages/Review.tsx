import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LanguageMenu from "../components/LanguageMenu";
import { getInitialLocale, messages, type Locale } from "../i18n";
import { getLocalScenarios, getReviewState, setReviewState } from "../storage";
import type { ReviewState, Scenario, ScenarioIndex } from "../types";

type Filter = "all" | "you" | "wrong";

const REVIEW_STATES: ReviewState[] = ["correct", "wrong", "skipped"];

const stateClass: Record<ReviewState, string> = {
  new: "border-neutral-700 text-neutral-400",
  correct: "border-emerald-700 bg-emerald-950/50 text-emerald-200",
  wrong: "border-rose-700 bg-rose-950/50 text-rose-200",
  skipped: "border-yellow-700 bg-yellow-950/50 text-yellow-200",
};

const stateLabel = (state: ReviewState, t: typeof messages["zh-TW"]) => {
  if (state === "correct") return t.correctState;
  if (state === "wrong") return t.wrongState;
  if (state === "skipped") return t.skippedState;
  return t.newState;
};

const Review = () => {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [stateVersion, setStateVersion] = useState(0);
  const [filter, setFilter] = useState<Filter>("you");
  const [error, setError] = useState<string | null>(null);
  const t = messages[locale];

  useEffect(() => {
    fetch("/audio/index.json")
      .then((r) => r.json())
      .then(async (index: ScenarioIndex) => {
        const remote = await Promise.all(
          index.scenarios.map((item) => fetch(`/audio/${item.id}.json`).then((r) => r.json() as Promise<Scenario>)),
        );
        setScenarios([...remote, ...getLocalScenarios()]);
      })
      .catch((e) => {
        setScenarios(getLocalScenarios());
        setError(String(e));
      });
  }, []);

  const rows = useMemo(() => {
    return scenarios.flatMap((scenario) =>
      scenario.lines.map((line) => {
        const state = getReviewState(scenario.id, line.line_id, line.order, line.review_state ?? "new");
        return { scenario, line, state };
      }),
    ).filter(({ line, state }) => {
      if (filter === "you") return line.speaker === "you";
      if (filter === "wrong") return state === "wrong" || state === "skipped";
      return true;
    });
  }, [scenarios, filter, stateVersion]);

  const mark = (scenario: Scenario, line: Scenario["lines"][number], state: ReviewState) => {
    setReviewState(scenario.id, line.line_id, line.order, state);
    setRevealed((prev) => new Set(prev).add(`${scenario.id}:${line.order}`));
    setStateVersion((value) => value + 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-200">← {t.back}</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{t.reviewTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">{t.reviewSubtitle}</p>
          {error && <p className="mt-2 text-sm text-yellow-300">{t.loadFailed}: {error}</p>}
        </div>
        <LanguageMenu locale={locale} onChange={setLocale} />
      </header>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["all", "you", "wrong"] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-md border px-3 py-2 transition ${
              filter === item ? "border-amber-600 bg-amber-950/60 text-amber-100" : "border-neutral-800 bg-neutral-900 text-neutral-300"
            }`}
          >
            {item === "all" ? t.allLines : item === "you" ? t.learnerLines : t.wrongLines}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-800">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">{t.source}</th>
              <th className="px-3 py-2">{t.nativeHeader}</th>
              <th className="px-3 py-2">{t.targetHeader}</th>
              <th className="px-3 py-2">{t.status}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {rows.map(({ scenario, line, state }) => {
              const key = `${scenario.id}:${line.order}`;
              const isRevealed = revealed.has(key);
              return (
                <tr key={key} className="align-top">
                  <td className="w-48 px-3 py-3 text-xs text-neutral-500">{scenario.title}</td>
                  <td className="px-3 py-3 text-neutral-300">{line.native}</td>
                  <td className="px-3 py-3 text-lg text-neutral-100">{isRevealed ? line.target : "••••••"}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded border px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel(state, t)}</span>
                  </td>
                  <td className="w-60 px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setRevealed((prev) => new Set(prev).add(key))}
                        className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300"
                      >
                        {t.reveal}
                      </button>
                      {REVIEW_STATES.map((next) => (
                        <button
                          key={next}
                          type="button"
                          onClick={() => mark(scenario, line, next)}
                          className={`rounded border px-2 py-1 text-xs ${stateClass[next]}`}
                        >
                          {stateLabel(next, t)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Review;
