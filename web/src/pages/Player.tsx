import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BreakdownPanel from "../components/BreakdownPanel";
import { getInitialLocale, messages, setStoredLocale, type Locale } from "../i18n";
import type { AudioVariant, ReviewState, Scenario } from "../types";

type Visibility = "both" | "native" | "target";
type PracticeFilter = "all" | "you" | "wrong";

const SPEEDS = [0.75, 1, 1.25, 1.5];
const REVIEW_STATES: ReviewState[] = ["correct", "wrong", "skipped"];

const stateClass: Record<ReviewState, string> = {
  new: "border-neutral-700 text-neutral-400",
  correct: "border-emerald-700 bg-emerald-950/50 text-emerald-200",
  wrong: "border-rose-700 bg-rose-950/50 text-rose-200",
  skipped: "border-yellow-700 bg-yellow-950/50 text-yellow-200",
};

const lineKey = (scenarioId: string, lineId: string | undefined, order: number) =>
  `jp_podcast_review:${scenarioId}:${lineId ?? order}`;

const Player = () => {
  const { id } = useParams<{ id: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibility, setVisibility] = useState<Visibility>("both");
  const [speed, setSpeed] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [autoExpand, setAutoExpand] = useState(false);
  const [recallMode, setRecallMode] = useState(false);
  const [revealedOrders, setRevealedOrders] = useState<Set<number>>(new Set());
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>("all");
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});
  const [selectedVariant, setSelectedVariant] = useState<AudioVariant | null>(null);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const t = messages[locale];

  const toggleLocale = () => {
    const next = locale === "zh-TW" ? "en" : "zh-TW";
    setLocale(next);
    setStoredLocale(next);
  };

  const toggleExpand = (order: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/audio/${id}.json`)
      .then((r) => r.json())
      .then((data: Scenario) => {
        setScenario(data);
        setSelectedVariant(data.variants?.find((v) => v.mode === "target") ?? null);
      })
      .catch((e) => setError(String(e)));
  }, [id]);

  useEffect(() => {
    if (!scenario) return;
    const next: Record<string, ReviewState> = {};
    for (const line of scenario.lines) {
      const key = lineKey(scenario.id, line.line_id, line.order);
      const stored = localStorage.getItem(key) as ReviewState | null;
      next[key] = stored ?? line.review_state ?? "new";
    }
    setReviewStates(next);
    setRevealedOrders(new Set());
  }, [scenario]);

  const activeIndex = useMemo(() => {
    if (!scenario) return -1;
    return scenario.lines.findIndex((l) => currentTime >= l.start && currentTime < l.end);
  }, [scenario, currentTime]);

  useEffect(() => {
    if (autoScroll && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, autoScroll]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  if (error) return <div className="p-8 text-red-400">{t.loadFailed}: {error}</div>;
  if (!scenario) return <div className="p-8 text-neutral-500">{t.loading}</div>;

  const jumpTo = (sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = sec;
      audioRef.current.play().catch((e) => console.warn("play failed", e));
    }
  };

  const repeatCurrent = () => {
    if (activeIndex >= 0) jumpTo(scenario.lines[activeIndex].start);
  };

  const showNative = visibility !== "target";
  const showTarget = visibility !== "native";
  const audioSrc = selectedVariant?.path ?? `/audio/${id}.mp3`;
  const visibleLines = scenario.lines.filter((line) => {
    const key = lineKey(scenario.id, line.line_id, line.order);
    const state = reviewStates[key] ?? line.review_state ?? "new";
    if (practiceFilter === "you") return line.speaker === "you";
    if (practiceFilter === "wrong") return state === "wrong" || state === "skipped";
    return true;
  });

  const markReview = (line: Scenario["lines"][number], state: ReviewState) => {
    const key = lineKey(scenario.id, line.line_id, line.order);
    localStorage.setItem(key, state);
    setReviewStates((prev) => ({ ...prev, [key]: state }));
    setRevealedOrders((prev) => {
      const next = new Set(prev);
      next.add(line.order);
      return next;
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6 py-6">
      <header className="mb-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-200">← {t.back}</Link>
        <h1 className="truncate text-lg font-medium">{scenario.title}</h1>
        <button
          type="button"
          onClick={toggleLocale}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-neutral-300"
        >
          {locale === "zh-TW" ? "EN" : "繁中"}
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="flex rounded-md border border-neutral-800 bg-neutral-900 p-0.5">
          {(["both", "target", "native"] as Visibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`rounded px-3 py-1 transition ${
                visibility === v ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {v === "both" ? t.both : v === "target" ? t.targetOnly : t.nativeOnly}
            </button>
          ))}
        </div>

        <div className="flex rounded-md border border-neutral-800 bg-neutral-900 p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`rounded px-3 py-1 tabular-nums transition ${
                speed === s ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {scenario.variants && scenario.variants.length > 1 && (
          <select
            value={selectedVariant?.mode ?? "target"}
            onChange={(e) => {
              const next = scenario.variants?.find((v) => v.mode === e.target.value) ?? null;
              setSelectedVariant(next);
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-200"
          >
            {scenario.variants.map((variant) => (
              <option key={variant.mode} value={variant.mode}>{variant.label}</option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={repeatCurrent}
          disabled={activeIndex < 0}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-200 transition hover:border-neutral-600 disabled:opacity-40"
        >
          {t.repeatLine}
        </button>

        <button
          type="button"
          onClick={() => setRecallMode((v) => !v)}
          className={`rounded-md border px-3 py-1 transition ${
            recallMode
              ? "border-amber-600 bg-amber-950/60 text-amber-100"
              : "border-neutral-800 bg-neutral-900 text-neutral-200 hover:border-neutral-600"
          }`}
        >
          {t.recallMode}
        </button>

        <select
          value={practiceFilter}
          onChange={(e) => setPracticeFilter(e.target.value as PracticeFilter)}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-200"
        >
          <option value="all">{t.allLines}</option>
          <option value="you">{t.learnerLines}</option>
          <option value="wrong">{t.wrongLines}</option>
        </select>

        <label className="ml-auto flex items-center gap-2 text-neutral-400">
          <input
            type="checkbox"
            checked={autoExpand}
            onChange={(e) => setAutoExpand(e.target.checked)}
            className="accent-neutral-500"
          />
          {t.autoExpand}
        </label>
        <label className="flex items-center gap-2 text-neutral-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="accent-neutral-500"
          />
          {t.autoScroll}
        </label>
      </div>

      <ol className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
        {visibleLines.map((line) => {
          const idx = scenario.lines.findIndex((candidate) => candidate.order === line.order);
          const isActive = idx === activeIndex;
          const isPast = currentTime >= line.end;
          const isExpanded = expandedOrders.has(line.order) || (autoExpand && isActive);
          const isRevealed = revealedOrders.has(line.order);
          const targetHidden = recallMode && line.speaker === "you" && !isRevealed;
          const key = lineKey(scenario.id, line.line_id, line.order);
          const reviewState = reviewStates[key] ?? line.review_state ?? "new";
          return (
            <li
              key={line.order}
              ref={isActive ? activeRef : null}
              className={`rounded-md border p-3 transition ${
                isActive
                  ? "border-amber-500/60 bg-amber-500/10"
                  : isPast
                    ? "border-transparent opacity-50 hover:opacity-100"
                    : "border-transparent hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => jumpTo(line.start)}
                  className="flex-1 text-left"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        line.speaker === "you" ? "bg-sky-900/50 text-sky-300" : "bg-fuchsia-900/50 text-fuchsia-300"
                      }`}
                    >
                      {line.speaker === "you" ? t.you : t.other}
                    </span>
                    <span className="tabular-nums">{line.start.toFixed(1)}s</span>
                    <span className={`rounded border px-1.5 py-0.5 ${stateClass[reviewState]}`}>{reviewState}</span>
                  </div>
                  {showTarget && !targetHidden && (
                    <div className="text-lg leading-relaxed text-neutral-100">{line.target}</div>
                  )}
                  {showTarget && targetHidden && (
                    <div className="text-lg leading-relaxed text-neutral-500">••••••</div>
                  )}
                  {showNative && (
                    <div className={`text-sm text-neutral-400 ${showTarget ? "mt-1" : ""}`}>{line.native}</div>
                  )}
                </button>
                <div className="flex shrink-0 flex-col gap-1">
                  {targetHidden && (
                    <button
                      type="button"
                      onClick={() => setRevealedOrders((prev) => new Set(prev).add(line.order))}
                      className="rounded-md border border-amber-700 bg-amber-950/50 px-2 py-1 text-xs text-amber-100 transition hover:border-amber-500"
                    >
                      {t.reveal}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(line.order)}
                    className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-100"
                    aria-label="切換單字解析"
                  >
                    {isExpanded ? t.collapse : t.analysis}
                  </button>
                </div>
              </div>
              {recallMode && line.speaker === "you" && (
                <div className="mt-3 flex gap-2">
                  {REVIEW_STATES.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => markReview(line, state)}
                      className={`rounded-md border px-2 py-1 text-xs transition ${stateClass[state]}`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              )}
              {isExpanded && <BreakdownPanel line={line} locale={locale} />}
            </li>
          );
        })}
      </ol>

      <audio
        ref={audioRef}
        src={audioSrc}
        controls
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        className="mt-4 w-full"
      />
    </div>
  );
};

export default Player;
