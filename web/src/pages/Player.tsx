import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BreakdownPanel from "../components/BreakdownPanel";
import type { Scenario } from "../types";

type Visibility = "both" | "native" | "target";

const VISIBILITY_LABEL: Record<Visibility, string> = {
  both: "雙語",
  target: "只看日文",
  native: "只看中文",
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

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
      .then(setScenario)
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

  if (error) return <div className="p-8 text-red-400">載入失敗：{error}</div>;
  if (!scenario) return <div className="p-8 text-neutral-500">載入中...</div>;

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

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6 py-6">
      <header className="mb-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-200">← 返回</Link>
        <h1 className="truncate text-lg font-medium">{scenario.title}</h1>
        <div className="w-12" />
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
              {VISIBILITY_LABEL[v]}
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

        <button
          type="button"
          onClick={repeatCurrent}
          disabled={activeIndex < 0}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-200 transition hover:border-neutral-600 disabled:opacity-40"
        >
          重複此句
        </button>

        <label className="ml-auto flex items-center gap-2 text-neutral-400">
          <input
            type="checkbox"
            checked={autoExpand}
            onChange={(e) => setAutoExpand(e.target.checked)}
            className="accent-neutral-500"
          />
          自動展開解析
        </label>
        <label className="flex items-center gap-2 text-neutral-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="accent-neutral-500"
          />
          自動捲動
        </label>
      </div>

      <ol className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
        {scenario.lines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = currentTime >= line.end;
          const isExpanded = expandedOrders.has(line.order) || (autoExpand && isActive);
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
                      {line.speaker === "you" ? "你" : "對方"}
                    </span>
                    <span className="tabular-nums">{line.start.toFixed(1)}s</span>
                  </div>
                  {showTarget && (
                    <div className="text-lg leading-relaxed text-neutral-100">{line.target}</div>
                  )}
                  {showNative && (
                    <div className={`text-sm text-neutral-400 ${showTarget ? "mt-1" : ""}`}>{line.native}</div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleExpand(line.order)}
                  className="shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-100"
                  aria-label="切換單字解析"
                >
                  {isExpanded ? "收起" : "解析"}
                </button>
              </div>
              {isExpanded && <BreakdownPanel line={line} />}
            </li>
          );
        })}
      </ol>

      <audio
        ref={audioRef}
        src={`/audio/${id}.mp3`}
        controls
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        className="mt-4 w-full"
      />
    </div>
  );
};

export default Player;
