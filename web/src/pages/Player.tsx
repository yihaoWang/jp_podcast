import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BreakdownPanel from "../components/BreakdownPanel";
import LanguageMenu from "../components/LanguageMenu";
import { getInitialLocale, messages, type Locale } from "../i18n";
import { getLocalScenario, getReviewState } from "../storage";
import type { AudioVariant, ReviewState, Scenario } from "../types";

type Visibility = "both" | "native" | "target";
type PlayerIcon = "repeatLine" | "loopScenario" | "review" | "settings";

const SPEEDS = [0.75, 1, 1.25, 1.5];

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

const variantLabel = (variant: AudioVariant, t: typeof messages["zh-TW"]) => {
  if (variant.mode === "target") return t.variantTarget;
  if (variant.mode === "shadowing") return t.variantShadowing;
  if (variant.mode === "slow") return t.variantSlow;
  if (variant.mode === "native_then_target") return t.variantNativeTarget;
  if (variant.mode === "target_then_native") return t.variantTargetNative;
  if (variant.mode === "uploaded_audio") return t.variantUploadedAudio;
  return variant.label;
};

const PlayerControlIcon = ({ name }: { name: PlayerIcon }) => {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      {name === "repeatLine" && (
        <>
          <path {...common} d="M17 2l4 4-4 4" />
          <path {...common} d="M3 11V9a3 3 0 013-3h15" />
          <path {...common} d="M7 22l-4-4 4-4" />
          <path {...common} d="M21 13v2a3 3 0 01-3 3H3" />
          <path {...common} d="M12 9v6" />
        </>
      )}
      {name === "loopScenario" && (
        <>
          <path {...common} d="M17 2l4 4-4 4" />
          <path {...common} d="M3 11V9a3 3 0 013-3h15" />
          <path {...common} d="M7 22l-4-4 4-4" />
          <path {...common} d="M21 13v2a3 3 0 01-3 3H3" />
        </>
      )}
      {name === "review" && (
        <>
          <path {...common} d="M8 6h11" />
          <path {...common} d="M8 12h11" />
          <path {...common} d="M8 18h11" />
          <path {...common} d="M4 6h.01" />
          <path {...common} d="M4 12h.01" />
          <path {...common} d="M4 18h.01" />
        </>
      )}
      {name === "settings" && (
        <>
          <path {...common} d="M4 6h16" />
          <path {...common} d="M4 12h16" />
          <path {...common} d="M4 18h16" />
          <path {...common} d="M8 4v4" />
          <path {...common} d="M15 10v4" />
          <path {...common} d="M11 16v4" />
        </>
      )}
    </svg>
  );
};

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
  const [loopScenario, setLoopScenario] = useState(false);
  const [loopLineOrder, setLoopLineOrder] = useState<number | null>(null);
  const [playLineOrder, setPlayLineOrder] = useState<number | null>(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<AudioVariant | null>(null);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const t = messages[locale];

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
    const local = getLocalScenario(id);
    if (local) {
      setScenario(local);
      setSelectedVariant(local.variants?.[0] ?? null);
      return;
    }
    fetch(`/audio/${id}.json`)
      .then((r) => r.json())
      .then((data: Scenario) => {
        setScenario(data);
        setSelectedVariant(data.variants?.find((v) => v.mode === "target") ?? null);
      })
      .catch((e) => setError(String(e)));
  }, [id]);

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

  const jumpToLine = (line: Scenario["lines"][number]) => {
    if (loopLineOrder !== null) {
      setLoopLineOrder(line.order);
      setPlayLineOrder(null);
      setLoopScenario(false);
    } else {
      setPlayLineOrder(line.order);
      setLoopScenario(false);
    }
    jumpTo(line.start);
  };

  const repeatCurrent = () => {
    if (activeIndex < 0) return;
    const line = scenario.lines[activeIndex];
    setPlayLineOrder(null);
    setLoopScenario(false);
    setLoopLineOrder((current) => (current === line.order ? null : line.order));
    jumpTo(line.start);
  };

  const handleTimeUpdate = (audio: HTMLAudioElement) => {
    const nextTime = audio.currentTime;
    const loopLine = loopLineOrder === null ? null : scenario.lines.find((line) => line.order === loopLineOrder);
    const playLine = playLineOrder === null ? null : scenario.lines.find((line) => line.order === playLineOrder);

    if (loopLine && (nextTime >= loopLine.end || nextTime < loopLine.start)) {
      audio.currentTime = loopLine.start;
      setCurrentTime(loopLine.start);
      audio.play().catch((e) => console.warn("play failed", e));
      return;
    }

    if (playLine && nextTime >= playLine.end) {
      audio.pause();
      audio.currentTime = playLine.end;
      setCurrentTime(playLine.end);
      setPlayLineOrder(null);
      return;
    }

    setCurrentTime(nextTime);
  };

  const showNative = visibility !== "target";
  const showTarget = visibility !== "native";
  const audioSrc = selectedVariant?.path ?? `/audio/${id}.mp3`;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6 py-6">
      <header className="mb-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-200">← {t.back}</Link>
        <h1 className="truncate text-lg font-medium">{scenario.title}</h1>
        <LanguageMenu locale={locale} onChange={setLocale} />
      </header>

      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex rounded-lg border border-neutral-800 bg-neutral-900/80 p-1">
          <button
            type="button"
            onClick={repeatCurrent}
            disabled={activeIndex < 0}
            title={t.repeatLine}
            aria-label={t.repeatLine}
            aria-pressed={loopLineOrder !== null}
            className={`flex h-10 w-10 items-center justify-center rounded-md transition disabled:opacity-40 ${
              loopLineOrder !== null ? "bg-amber-700 text-amber-50" : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50"
            }`}
          >
            <PlayerControlIcon name="repeatLine" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPlayLineOrder(null);
              setLoopLineOrder(null);
              setLoopScenario((value) => !value);
            }}
            title={t.loopScenario}
            aria-label={t.loopScenario}
            aria-pressed={loopScenario}
            className={`flex h-10 w-10 items-center justify-center rounded-md transition ${
              loopScenario ? "bg-amber-700 text-amber-50" : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50"
            }`}
          >
            <PlayerControlIcon name="loopScenario" />
          </button>
          <Link
            to="/review"
            title={t.review}
            aria-label={t.review}
            className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-300 transition hover:bg-neutral-800 hover:text-neutral-50"
          >
            <PlayerControlIcon name="review" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvancedControls((value) => !value)}
          title={t.playerSettings}
          aria-label={t.playerSettings}
          aria-expanded={showAdvancedControls}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
            showAdvancedControls
              ? "border-neutral-600 bg-neutral-800 text-neutral-50"
              : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-neutral-50"
          }`}
        >
          <PlayerControlIcon name="settings" />
        </button>
      </div>

      {showAdvancedControls && (
        <div className="mb-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-sm">
          <div>
            <div className="mb-1.5 text-xs font-medium text-neutral-500">{t.displayMode}</div>
            <div className="grid grid-cols-3 rounded-md border border-neutral-800 bg-neutral-900 p-0.5">
              {(["both", "target", "native"] as Visibility[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`rounded px-2 py-2 transition ${
                    visibility === v ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {v === "both" ? t.both : v === "target" ? t.targetOnly : t.nativeOnly}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-neutral-500">{t.playbackSpeed}</div>
            <div className="grid grid-cols-4 rounded-md border border-neutral-800 bg-neutral-900 p-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`rounded px-2 py-2 tabular-nums transition ${
                    speed === s ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {scenario.variants && scenario.variants.length > 1 && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">{t.audioMode}</span>
              <select
                value={selectedVariant?.mode ?? "target"}
                onChange={(e) => {
                  const next = scenario.variants?.find((v) => v.mode === e.target.value) ?? null;
                  setSelectedVariant(next);
                  setPlayLineOrder(null);
                  setLoopLineOrder(null);
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-200"
              >
                {scenario.variants.map((variant) => (
                  <option key={variant.mode} value={variant.mode}>{variantLabel(variant, t)}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-300">
              <input
                type="checkbox"
                checked={autoExpand}
                onChange={(e) => setAutoExpand(e.target.checked)}
                className="accent-neutral-500"
              />
              {t.autoExpand}
            </label>
            <label className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-neutral-500"
              />
              {t.autoScroll}
            </label>
          </div>
        </div>
      )}

      <ol className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
        {scenario.lines.map((line) => {
          const idx = scenario.lines.findIndex((candidate) => candidate.order === line.order);
          const isActive = idx === activeIndex;
          const isPast = currentTime >= line.end;
          const isExpanded = expandedOrders.has(line.order) || (autoExpand && isActive);
          const reviewState = getReviewState(scenario.id, line.line_id, line.order, line.review_state ?? "new");
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
                  onClick={() => jumpToLine(line)}
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
                    <span className={`rounded border px-1.5 py-0.5 ${stateClass[reviewState]}`}>{stateLabel(reviewState, t)}</span>
                  </div>
                  {showTarget && (
                    <div className="text-lg leading-relaxed text-neutral-100">{line.target}</div>
                  )}
                  {showNative && (
                    <div className={`text-sm text-neutral-400 ${showTarget ? "mt-1" : ""}`}>{line.native}</div>
                  )}
                </button>
                <div className="flex shrink-0 flex-col gap-1">
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
              {isExpanded && <BreakdownPanel line={line} locale={locale} />}
            </li>
          );
        })}
      </ol>

      <audio
        ref={audioRef}
        src={audioSrc}
        controls
        loop={loopScenario}
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
        className="mt-4 w-full"
      />
    </div>
  );
};

export default Player;
