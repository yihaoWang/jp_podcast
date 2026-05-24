import type { SubtitleLine } from "../types";
import type { Locale } from "../i18n";
import { messages } from "../i18n";

interface Props {
  line: SubtitleLine;
  locale?: Locale;
}

const BreakdownPanel = ({ line, locale = "zh-TW" }: Props) => {
  const t = messages[locale];
  const tokens = line.breakdown ?? [];
  const hasTokens = tokens.length > 0;
  const hasNote = Boolean(line.grammar_note);

  if (!hasTokens && !hasNote) {
    return (
      <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-500">
        {t.noBreakdown}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-neutral-800 bg-neutral-950 p-3">
      {hasTokens && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">{t.wordBreakdown}</div>
          <ul className="space-y-1.5">
            {tokens.map((token, idx) => (
              <li key={idx} className="grid grid-cols-[auto_auto_auto_1fr] items-baseline gap-x-3 gap-y-0.5">
                <span className="text-base font-medium text-neutral-100">{token.surface}</span>
                {token.reading !== token.surface && (
                  <span className="text-xs text-neutral-500">{token.reading}</span>
                )}
                {token.reading === token.surface && <span />}
                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">{token.pos}</span>
                <span className="text-sm text-neutral-300">{token.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasNote && (
        <div className="border-t border-neutral-800 pt-3">
          <div className="mb-1 text-xs uppercase tracking-wider text-neutral-500">{t.grammarCulture}</div>
          <p className="text-sm leading-relaxed text-amber-100/80">{line.grammar_note}</p>
        </div>
      )}
    </div>
  );
};

export default BreakdownPanel;
