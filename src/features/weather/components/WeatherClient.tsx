"use client";

import { Fragment, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useWeather } from "@/features/weather/hooks/useWeather";
import { LocationSelector } from "./LocationSelector";
import { TownshipSelector } from "./TownshipSelector";
import { getWeatherTheme } from "@/features/weather/utils/weatherTheme";
import type { WeatherApiResponse } from "@/app/api/weather/route";
import type { TaiwanLocation } from "@/lib/constants/locations";
import type { ForecastPeriod } from "@/features/weather/types";

interface WeatherClientProps {
  county: TaiwanLocation;
  township: string;
  initialData: WeatherApiResponse;
}

export function WeatherClient({ county, township, initialData }: WeatherClientProps) {
  const router = useRouter();
  const [isLocating, setIsLocating] = useState(false);

  async function handleLocate() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/locate?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) return;
          const { location, township: detectedTownship } = (await res.json()) as {
            location?: string;
            township?: string | null;
          };
          if (!location) return;
          const params = new URLSearchParams({ location });
          if (detectedTownship) params.set("township", detectedTownship);
          router.replace(`?${params.toString()}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false)
    );
  }

  const { data, isFetching, refetch, dataUpdatedAt } = useWeather({
    county,
    township,
    initialData,
  });

  const { weather, townships } = data;
  const theme = getWeatherTheme(weather.weatherCode);

  // 依背景深淺決定文字色系（只有雷雨 isDark: true 用白字）
  const txt = theme.isDark ? "text-white" : "text-slate-700";
  const txtSub = theme.isDark ? "text-white/70" : "text-slate-500";
  const txtFaint = theme.isDark ? "text-white/45" : "text-slate-400";
  const card = theme.isDark ? "bg-white/10 border-white/15" : "bg-white/55 border-slate-200/70";
  const selectCls = [
    "bg-transparent appearance-none border-none outline-none font-medium text-sm cursor-pointer",
    theme.isDark ? "text-white" : "text-slate-700",
  ].join(" ");
  const headerBg = theme.isDark ? "bg-white/10 border-white/15" : "bg-white/55 border-slate-200/70";
  const divider = theme.isDark ? "text-white/25" : "text-slate-300";
  const btnBorder = theme.isDark
    ? "border-white/20 hover:bg-white/10"
    : "border-slate-300 hover:bg-black/5";

  const timeStr = new Date(dataUpdatedAt).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Taipei",
  });

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme.gradient} transition-[background] duration-1000`}
    >
      <div className="flex min-h-screen flex-col items-center justify-between px-6 py-8 gap-8">
        {/* 頂部：地點選擇器 */}
        <header className="w-full max-w-sm">
          <div
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 backdrop-blur-md ${headerBg}`}
          >
            <button
              onClick={() => void handleLocate()}
              disabled={isLocating}
              title="偵測目前位置"
              className={`text-base leading-none transition-opacity disabled:opacity-40 ${isLocating ? "animate-pulse" : ""}`}
            >
              📍
            </button>
            <span className={`text-sm ${divider}`}>|</span>
            <Suspense>
              <LocationSelector currentLocation={county} className={selectCls} />
            </Suspense>
            <span className={`text-sm ${divider}`}>/</span>
            {townships.length > 0 && (
              <Suspense>
                <TownshipSelector
                  townships={townships}
                  currentTownship={township}
                  className={selectCls}
                />
              </Suspense>
            )}
          </div>
        </header>

        {/* 中央：天氣主角 */}
        <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-8xl leading-none select-none">{theme.emoji}</p>
          <p className={`text-9xl font-thin tracking-tighter leading-none ${txt}`}>
            {weather.temperature}°
          </p>
          <p className={`text-2xl font-light mt-1 ${txt}`}>{weather.weather}</p>
          <p className={`mt-2 max-w-xs text-sm leading-relaxed ${txtSub}`}>{weather.description}</p>
        </main>

        {/* 下方：數據卡片 */}
        <section className="w-full max-w-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🌡️"
              label="體感溫度"
              value={`${weather.apparentTemperature}°C`}
              card={card}
              txt={txt}
              txtSub={txtSub}
            />
            <StatCard
              icon="💧"
              label="降雨機率"
              value={`${weather.pop}%`}
              card={card}
              txt={txt}
              txtSub={txtSub}
            />
            <StatCard
              icon="💦"
              label="相對濕度"
              value={`${weather.humidity}%`}
              card={card}
              txt={txt}
              txtSub={txtSub}
            />
            <StatCard
              icon="💨"
              label="風速"
              value={weather.windDirection}
              sub={`${weather.windSpeed} m/s`}
              card={card}
              txt={txt}
              txtSub={txtSub}
            />
          </div>

          {/* 未來預報時段 */}
          {(weather.forecast?.periods?.length ?? 0) > 0 && (
            <ForecastTimeline
              periods={weather.forecast.periods}
              overallMax={weather.forecast.overallMax}
              overallMin={weather.forecast.overallMin}
              card={card}
              txt={txt}
              txtSub={txtSub}
              txtFaint={txtFaint}
            />
          )}

          {/* 更新狀態列 */}
          <div className={`flex items-center justify-center gap-3 text-xs ${txtFaint}`}>
            <span>更新於 {timeStr}</span>
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className={`rounded-full border px-3 py-1 transition-all disabled:opacity-40 ${btnBorder} ${txtSub}`}
            >
              {isFetching ? "更新中…" : "重新整理"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface ForecastTimelineProps {
  periods: ForecastPeriod[];
  overallMax: string;
  overallMin: string;
  card: string;
  txt: string;
  txtSub: string;
  txtFaint: string;
}

function ForecastTimeline({
  periods,
  overallMax,
  overallMin,
  card,
  txt,
  txtSub,
  txtFaint,
}: ForecastTimelineProps) {
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md space-y-3 ${card}`}>
      {/* 標題列：標籤 + 整體最高最低溫 */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${txtSub}`}>接下來 24 小時</span>
        <span className={`text-xs ${txtFaint}`}>
          ↑ {overallMax}° / ↓ {overallMin}°
        </span>
      </div>

      {/* 每個 3 小時時段 */}
      <div className="space-y-2">
        {periods.map((p, i) => {
          const theme = getWeatherTheme(p.weatherCode);
          const showDateLabel = i === 0 || p.date !== periods[i - 1]?.date;
          return (
            <Fragment key={p.startTime}>
              {showDateLabel && (
                <div className={`text-xs font-medium ${txtSub} ${i > 0 ? "pt-1" : ""}`}>
                  {p.date}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                {/* 時間 */}
                <span className={`w-20 text-xs tabular-nums ${txtFaint}`}>
                  {p.startTime}–{p.endTime}
                </span>
                {/* Emoji */}
                <span className="text-base leading-none">{theme.emoji}</span>
                {/* 天氣文字 */}
                <span className={`flex-1 text-xs ${txtSub}`}>{p.weather}</span>
                {/* 溫度區間 */}
                <span className={`text-sm font-medium tabular-nums ${txt}`}>
                  {p.minTemp}–{p.maxTemp}°
                </span>
                {/* 降雨機率 */}
                <span
                  className={`w-10 text-right text-sm tabular-nums ${
                    p.pop !== "—" && parseInt(p.pop, 10) > 30 ? "text-blue-400" : txtFaint
                  }`}
                >
                  {p.pop === "—" ? "—" : `${p.pop}%`}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  card: string;
  txt: string;
  txtSub: string;
}

function StatCard({ icon, label, value, sub, card, txt, txtSub }: StatCardProps) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border p-4 backdrop-blur-md ${card}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className={`mt-1 text-xs ${txtSub}`}>{label}</span>
      <span className={`text-base font-medium ${txt}`}>{value}</span>
      {sub && <span className={`text-xs ${txtSub}`}>{sub}</span>}
    </div>
  );
}
