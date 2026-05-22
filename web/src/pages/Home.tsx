import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ScenarioIndex } from "../types";

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Home = () => {
  const [index, setIndex] = useState<ScenarioIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/audio/index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="p-8 text-red-400">載入失敗：{error}</div>;
  if (!index) return <div className="p-8 text-neutral-500">載入中...</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">日文情境 Podcast</h1>
        <p className="mt-2 text-neutral-400">挑一個情境開始聽，每天 30 分鐘。</p>
      </header>

      {index.scenarios.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-500">
          目前沒有情境，執行 <code className="text-neutral-300">python generate_audio.py</code> 來生成。
        </div>
      ) : (
        <ul className="space-y-3">
          {index.scenarios.map((s) => (
            <li key={s.id}>
              <Link
                to={`/scenario/${s.id}`}
                className="block rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-neutral-600 hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium text-neutral-100">{s.title}</h2>
                    {s.context && <p className="mt-1 truncate text-sm text-neutral-500">{s.context}</p>}
                  </div>
                  <div className="shrink-0 text-right text-sm text-neutral-500">
                    <div>{s.line_count} 句</div>
                    <div className="tabular-nums">{formatDuration(s.duration)}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
