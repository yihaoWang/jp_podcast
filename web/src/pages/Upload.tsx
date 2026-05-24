import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageMenu from "../components/LanguageMenu";
import { getInitialLocale, messages, type Locale } from "../i18n";
import { saveLocalScenario } from "../storage";
import type { Scenario } from "../types";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || `upload_${Date.now()}`;

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
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const t = messages[locale];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!audio || !title.trim() || !transcript.trim()) return;

    const audioUrl = await readFileAsDataUrl(audio);
    const id = `local_${slugify(title)}`;
    const lines = transcript
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [native, target] = line.includes("|") ? line.split("|", 2).map((part) => part.trim()) : [line, ""];
        return {
          order: index + 1,
          speaker: "you" as const,
          native,
          target: target || native,
          start: 0,
          end: 0,
          line_id: `${id}:${index + 1}`,
          source_type: "uploaded_audio" as const,
          source_id: id,
          review_state: "new" as const,
          breakdown: [],
          grammar_note: "",
        };
      });

    const scenario: Scenario = {
      id,
      title,
      context,
      language_code: "local",
      native_language_code: locale,
      source_type: "uploaded_audio",
      source_id: id,
      duration: 0,
      variants: [{ mode: "uploaded_audio", label: t.uploadedLocal, path: audioUrl }],
      lines,
    };

    saveLocalScenario(scenario);
    setMessage(`${t.created}: ${title}`);
    navigate(`/scenario/${id}`);
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
          <span className="mb-1 block text-sm text-neutral-400">{t.title}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-neutral-400">{t.context}</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100"
          />
        </label>

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

        <label className="block">
          <span className="mb-1 block text-sm text-neutral-400">{t.transcript}</span>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100"
            required
          />
          <span className="mt-1 block text-xs text-neutral-500">{t.transcriptHint}</span>
        </label>

        <div className="text-xs text-neutral-500">{t.localOnly}</div>
        <button
          type="submit"
          className="rounded-md border border-amber-700 bg-amber-950/60 px-4 py-2 text-sm text-amber-100 transition hover:border-amber-500"
        >
          {t.createPodcast}
        </button>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
      </form>
    </div>
  );
};

export default Upload;
