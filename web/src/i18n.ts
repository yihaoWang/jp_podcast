export type Locale = "zh-TW" | "en";

export const getInitialLocale = (): Locale => {
  const stored = localStorage.getItem("jp_podcast_locale");
  if (stored === "zh-TW" || stored === "en") return stored;
  return navigator.language.startsWith("zh") ? "zh-TW" : "en";
};

export const setStoredLocale = (locale: Locale) => {
  localStorage.setItem("jp_podcast_locale", locale);
};

export const messages = {
  "zh-TW": {
    appTitle: "日文情境 Podcast",
    appSubtitle: "挑一個情境開始聽，每天 30 分鐘。",
    empty: "目前沒有情境，執行",
    loadFailed: "載入失敗",
    loading: "載入中...",
    back: "返回",
    both: "雙語",
    targetOnly: "只看目標語",
    nativeOnly: "只看母語",
    repeatLine: "重複此句",
    recallMode: "回想模式",
    allLines: "全部句子",
    learnerLines: "只練我說",
    wrongLines: "錯題/跳過",
    autoExpand: "自動展開解析",
    autoScroll: "自動捲動",
    you: "你",
    other: "對方",
    reveal: "Reveal",
    analysis: "解析",
    collapse: "收起",
    noBreakdown: "這句沒有單字解說資料。",
    wordBreakdown: "單字解析",
    grammarCulture: "語法 / 文化點",
    lines: "句",
  },
  en: {
    appTitle: "Scenario Podcasts",
    appSubtitle: "Pick a scenario and practice for 30 focused minutes.",
    empty: "No scenarios yet. Run",
    loadFailed: "Failed to load",
    loading: "Loading...",
    back: "Back",
    both: "Bilingual",
    targetOnly: "Target only",
    nativeOnly: "Native only",
    repeatLine: "Repeat line",
    recallMode: "Recall mode",
    allLines: "All lines",
    learnerLines: "My lines",
    wrongLines: "Wrong/skipped",
    autoExpand: "Auto expand",
    autoScroll: "Auto scroll",
    you: "You",
    other: "Other",
    reveal: "Reveal",
    analysis: "Analysis",
    collapse: "Collapse",
    noBreakdown: "No word breakdown data for this line.",
    wordBreakdown: "Word breakdown",
    grammarCulture: "Grammar / culture",
    lines: "lines",
  },
} satisfies Record<Locale, Record<string, string>>;
