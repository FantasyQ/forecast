"use client";

import { Fragment, Suspense, useCallback, useEffect, useRef, useState } from "react";
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
  const [locationMessage, setLocationMessage] = useState("");
  const locationRequest = useRef<AbortController | null>(null);

  const handleLocate = useCallback(async () => {
    locationRequest.current?.abort();
    const controller = new AbortController();
    locationRequest.current = controller;
    setIsLocating(true);
    setLocationMessage("正在取得目前位置…");

    try {
      if (!window.isSecureContext || !navigator.geolocation) {
        throw new Error("此瀏覽器或連線不支援定位，請手動選擇地點。");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            reject(
              new Error(
                error.code === 1
                  ? "未允許定位，請開啟瀏覽器定位權限後再試，或手動選擇地點。"
                  : "暫時無法取得位置，請重試或手動選擇地點。"
              )
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });
      if (controller.signal.aborted) return;

      const coordinates = new URLSearchParams({
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
      });
      const res = await fetch(`/api/locate?${coordinates}`, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? "目前僅提供臺灣天氣，請手動選擇地點。"
            : "無法辨識所在地，請重試或手動選擇地點。"
        );
      }
      const { location, township: detectedTownship } = (await res.json()) as {
        location?: string;
        township?: string | null;
      };
      if (controller.signal.aborted) return;
      if (!location) throw new Error("無法辨識所在地，請手動選擇地點。");
      const params = new URLSearchParams(window.location.search);
      params.set("location", location);
      params.delete("township");
      if (detectedTownship) params.set("township", detectedTownship);
      router.replace(`?${params.toString()}`, { scroll: false });
      setLocationMessage(`已定位至 ${location}${detectedTownship ?? ""}`);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLocationMessage(
          error instanceof Error && error.name === "Error"
            ? error.message
            : "定位失敗，請重試或手動選擇地點。"
        );
      }
    } finally {
      if (!controller.signal.aborted) setIsLocating(false);
    }
  }, [router]);

  useEffect(() => {
    // 每次開啟頁面都定位，包括先前選擇地點後留下的網址。
    const timer = window.setTimeout(() => void handleLocate(), 0);
    return () => {
      window.clearTimeout(timer);
      locationRequest.current?.abort();
    };
  }, [handleLocate]);

  function handleManualLocationChange() {
    // 避免較晚完成的定位覆蓋使用者剛選擇的地點。
    locationRequest.current?.abort();
    setIsLocating(false);
    setLocationMessage("");
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

  const updatedAt = new Date(dataUpdatedAt);
  const dateStr = updatedAt.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Taipei",
  });
  const timeStr = updatedAt.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  });

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme.gradient} transition-[background] duration-1000`}
    >
      <div className="flex min-h-screen flex-col items-center justify-between px-6 py-8 gap-8">
        {/* 頂部：地點選擇器 */}
        <header className="w-full max-w-sm" onChangeCapture={handleManualLocationChange}>
          <div
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 backdrop-blur-md ${headerBg}`}
          >
            <button
              onClick={() => void handleLocate()}
              disabled={isLocating}
              title="偵測目前位置"
              aria-label="偵測目前位置"
              className={`inline-flex items-center justify-center rounded-full p-1 transition-opacity hover:opacity-70 disabled:opacity-40 ${txt} ${isLocating ? "animate-pulse" : ""}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
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
          <p role="status" className={`mt-2 text-center text-xs ${txtSub}`}>
            {locationMessage}
          </p>
        </header>

        {/* 中央：天氣主角 */}
        <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <p className="shrink-0 text-7xl leading-none select-none sm:text-8xl">{theme.emoji}</p>
            <p
              className={`whitespace-nowrap text-8xl font-thin tracking-tighter leading-none sm:text-9xl ${txt}`}
            >
              {weather.temperature}°
            </p>
          </div>
          <p className={`text-2xl font-light mt-1 ${txt}`}>{weather.weather}</p>
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
              isDark={theme.isDark}
            />
          )}

          {/* 更新狀態列 */}
          <div className={`flex items-center justify-center gap-3 text-sm ${txtFaint}`}>
            <span>
              更新於{" "}
              <span className="font-mono">
                {dateStr} {timeStr}
              </span>
            </span>
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className={`rounded-full border px-3 py-1 transition-all disabled:opacity-40 ${btnBorder} ${txtSub}`}
            >
              {isFetching ? "更新中…" : "重新整理"}
            </button>
          </div>
        </section>
        <footer className={`text-center text-xs ${txtSub}`}>
          版本 <span className="font-mono">{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </footer>
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
  isDark: boolean;
}

function ForecastTimeline({
  periods,
  overallMax,
  overallMin,
  card,
  txt,
  txtSub,
  txtFaint,
  isDark,
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
              <div
                className={`flex items-center justify-between gap-2 rounded-lg px-2 -mx-2 py-0.5 ${p.isCurrent ? (isDark ? "bg-white/15" : "bg-black/[0.07]") : ""}`}
              >
                {/* 時間 */}
                <span className={`w-20 text-xs font-mono ${p.isCurrent ? txt : txtFaint}`}>
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
