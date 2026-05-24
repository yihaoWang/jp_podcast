import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInitialLocale, messages, setStoredLocale, type Locale } from "../i18n";
import type { ScenarioIndex } from "../types";

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Home = () => {
  const [index, setIndex] = useState<ScenarioIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const t = messages[locale];

  const toggleLocale = () => {
    const next = locale === "zh-TW" ? "en" : "zh-TW";
    setLocale(next);
    setStoredLocale(next);
  };

  useEffect(() => {
    fetch("/audio/index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="p-8 text-red-400">{t.loadFailed}: {error}</div>;
  if (!index) return <div className="p-8 text-neutral-500">{t.loading}</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.appTitle}</h1>
            <p className="mt-2 text-neutral-400">{t.appSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-neutral-300"
          >
            {locale === "zh-TW" ? "EN" : "繁中"}
          </button>
        </div>
      </header>

      {index.scenarios.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-500">
          {t.empty} <code className="text-neutral-300">python generate_audio.py</code>.
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
                    <div>{s.line_count} {t.lines}</div>
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
