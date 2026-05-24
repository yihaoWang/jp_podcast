import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LanguageMenu from "../components/LanguageMenu";
import { getInitialLocale, messages, type Locale } from "../i18n";
import { getLocalScenarios } from "../storage";
import type { Scenario, ScenarioIndex } from "../types";

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Home = () => {
  const [index, setIndex] = useState<ScenarioIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [localScenarios, setLocalScenarios] = useState<Scenario[]>([]);
  const t = messages[locale];

  useEffect(() => {
    fetch("/audio/index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch((e) => setError(String(e)));
    setLocalScenarios(getLocalScenarios());
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
          <LanguageMenu locale={locale} onChange={setLocale} />
        </div>
        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link to="/review" className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-200 transition hover:border-neutral-600">
            {t.review}
          </Link>
          <Link to="/upload" className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-200 transition hover:border-neutral-600">
            {t.upload}{localScenarios.length > 0 ? ` (${localScenarios.length})` : ""}
          </Link>
        </nav>
      </header>

      {index.scenarios.length === 0 && localScenarios.length === 0 ? (
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
          {localScenarios.map((s) => (
            <li key={s.id}>
              <Link
                to={`/scenario/${s.id}`}
                className="block rounded-lg border border-amber-900/70 bg-amber-950/20 p-5 transition hover:border-amber-700"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium text-neutral-100">{s.title}</h2>
                    {s.context && <p className="mt-1 truncate text-sm text-neutral-500">{s.context}</p>}
                  </div>
                  <div className="shrink-0 text-right text-sm text-amber-200/70">
                    <div>{t.uploadedLocal}</div>
                    <div>{s.lines.length} {t.lines}</div>
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
