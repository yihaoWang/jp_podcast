import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageMenu from "../components/LanguageMenu";
import { getInitialLocale, messages, type Locale } from "../i18n";
import { saveLocalScenario } from "../storage";
import type { Scenario } from "../types";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const Upload = () => {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [audio, setAudio] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const t = messages[locale];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!audio) return;

    setBusy(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("audio", audio);
      form.append("native_language", locale === "zh-TW" ? "繁體中文" : "English");
      form.append("target_language", "japanese");
      const [audioUrl, response] = await Promise.all([
        readFileAsDataUrl(audio),
        fetch("/api/create-podcast", { method: "POST", body: form }),
      ]);

      const body = await response.json() as Scenario & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || response.statusText);
      }

      const scenario: Scenario = {
        ...body,
        variants: [{ mode: "uploaded_audio", label: t.uploadedLocal, path: audioUrl }, ...(body.variants ?? [])],
      };

      saveLocalScenario(scenario);
      setMessage(`${t.created}: ${scenario.title}`);
      navigate(`/scenario/${scenario.id}`);
    } catch (error) {
      setMessage(`${t.uploadFailed}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-200">← {t.back}</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{t.uploadTitle}</h1>
          <p className="mt-2 text-sm text-neutral-400">{t.uploadSubtitle}</p>
        </div>
        <LanguageMenu locale={locale} onChange={setLocale} />
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-md border border-neutral-800 bg-neutral-950 p-5">
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-400">{t.audioFile}</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100"
            required
          />
        </label>

        <div className="text-xs text-neutral-500">{t.localOnly}</div>
        <button
          type="submit"
          disabled={!audio || busy}
          className="rounded-md border border-amber-700 bg-amber-950/60 px-4 py-2 text-sm text-amber-100 transition hover:border-amber-500"
        >
          {busy ? t.creating : t.createPodcast}
        </button>
        {message && <p className={`text-sm ${message.startsWith(t.uploadFailed) ? "text-rose-300" : "text-emerald-300"}`}>{message}</p>}
      </form>
    </div>
  );
};

export default Upload;
