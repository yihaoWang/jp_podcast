import { useState } from "react";
import { messages, setStoredLocale, type Locale } from "../i18n";

interface Props {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

const LOCALES: Locale[] = ["zh-TW", "en"];

const LanguageMenu = ({ locale, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const t = messages[locale];

  const choose = (next: Locale) => {
    setStoredLocale(next);
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 text-sm text-neutral-300 transition hover:border-neutral-600"
        aria-label={t.language}
      >
        <span aria-hidden="true">🌐</span>
        <span className="tabular-nums">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-36 rounded-md border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className={`block w-full rounded px-3 py-2 text-left text-sm transition ${
                option === locale ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-900"
              }`}
            >
              {option === "zh-TW" ? "繁體中文" : "English"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageMenu;
