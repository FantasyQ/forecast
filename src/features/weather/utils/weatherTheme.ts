export interface WeatherTheme {
  gradient: string;
  emoji: string;
  isDark: boolean; // true = 背景夠深，用白字；false = 淺背景，用深字
}

export function getWeatherTheme(code: string): WeatherTheme {
  const n = parseInt(code, 10);

  // 晴天
  if (n === 1)
    return {
      gradient: "from-amber-50 via-sky-100 to-indigo-100",
      emoji: "☀️",
      isDark: false,
    };
  // 晴時多雲 / 多雲
  if (n <= 4)
    return {
      gradient: "from-stone-100 via-sky-100 to-zinc-200",
      emoji: "⛅",
      isDark: false,
    };
  // 多雲時陰 / 陰天
  if (n <= 7)
    return {
      gradient: "from-zinc-200 via-slate-300 to-zinc-300",
      emoji: "☁️",
      isDark: false,
    };
  // 短暫雨 / 陣雨 / 雨 — 漸層加深，但仍用深字較安全
  if (n <= 11)
    return {
      gradient: "from-zinc-300 via-slate-400 to-zinc-500",
      emoji: "🌧️",
      isDark: false,
    };
  // 雷雨 — 唯一夠深用白字的情境
  if (n <= 14)
    return {
      gradient: "from-zinc-500 via-slate-700 to-zinc-800",
      emoji: "⛈️",
      isDark: true,
    };
  // 多雲 / 陰 + 陣雨類
  if (n <= 23)
    return {
      gradient: "from-slate-200 via-zinc-300 to-slate-400",
      emoji: "🌦️",
      isDark: false,
    };
  // 霧
  if (n <= 31)
    return {
      gradient: "from-zinc-100 via-stone-200 to-zinc-300",
      emoji: "🌫️",
      isDark: false,
    };
  // 霾
  if (n <= 39)
    return {
      gradient: "from-stone-100 via-amber-50 to-stone-200",
      emoji: "😶‍🌫️",
      isDark: false,
    };
  // 雪
  return {
    gradient: "from-slate-50 via-zinc-100 to-blue-50",
    emoji: "❄️",
    isDark: false,
  };
}
