import type { TownshipLocation, PointTime, PeriodTime } from "@/lib/schemas/township-weather";
import type { ParsedWeather, ForecastPeriod, ForecastSummary } from "@/features/weather/types";

function isPointTime(t: PointTime | PeriodTime): t is PointTime {
  return "DataTime" in t;
}

function isPeriodTime(t: PointTime | PeriodTime): t is PeriodTime {
  return "StartTime" in t;
}

function getPointValue(loc: TownshipLocation, elementName: string): Record<string, string> {
  const el = loc.WeatherElement.find((e) => e.ElementName === elementName);
  const time = el?.Time[0];
  if (!time) return {};
  return (time.ElementValue[0] ?? {}) as Record<string, string>;
}

const TZ = "Asia/Taipei";

function formatHHMM(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

function toTaiwanDateString(isoString: string): string {
  return new Date(isoString).toLocaleDateString("zh-TW", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDate(isoString: string): string {
  const target = toTaiwanDateString(isoString);
  const now = new Date().toISOString();
  const today = toTaiwanDateString(now);
  const tomorrow = toTaiwanDateString(new Date(Date.now() + 86_400_000).toISOString());

  if (target === today) return "今天";
  if (target === tomorrow) return "明天";
  const d = new Date(isoString);
  return d.toLocaleDateString("zh-TW", { timeZone: TZ, month: "numeric", day: "numeric" });
}

function buildForecast(loc: TownshipLocation): ForecastSummary {
  const tempEl = loc.WeatherElement.find((e) => e.ElementName === "溫度");
  const popEl = loc.WeatherElement.find((e) => e.ElementName === "3小時降雨機率");
  const wxEl = loc.WeatherElement.find((e) => e.ElementName === "天氣現象");

  // 取接下來 3 個 3小時時段（9 小時）
  const popPeriods = (popEl?.Time ?? []).filter(isPeriodTime).slice(0, 8);

  const periods: ForecastPeriod[] = popPeriods.map((period) => {
    const { StartTime, EndTime } = period;
    const pop =
      (period.ElementValue[0] as Record<string, string>)["ProbabilityOfPrecipitation"] ?? "—";

    // 找該時段內所有逐小時溫度
    const hourlyTemps = (tempEl?.Time ?? [])
      .filter(isPointTime)
      .filter((t) => t.DataTime >= StartTime && t.DataTime < EndTime)
      .map((t) => parseInt((t.ElementValue[0] as Record<string, string>)["Temperature"] ?? "", 10))
      .filter((n) => !isNaN(n));

    const minTemp = hourlyTemps.length ? Math.min(...hourlyTemps).toString() : "—";
    const maxTemp = hourlyTemps.length ? Math.max(...hourlyTemps).toString() : "—";

    // 對應的天氣現象
    const wxPeriod = (wxEl?.Time ?? []).filter(isPeriodTime).find((t) => t.StartTime === StartTime);
    const weather =
      (wxPeriod?.ElementValue[0] as Record<string, string> | undefined)?.["Weather"] ?? "—";
    const weatherCode =
      (wxPeriod?.ElementValue[0] as Record<string, string> | undefined)?.["WeatherCode"] ?? "0";

    return {
      startTime: formatHHMM(StartTime),
      endTime: formatHHMM(EndTime),
      date: formatDate(StartTime),
      minTemp,
      maxTemp,
      pop,
      weather,
      weatherCode,
    };
  });

  const allTemps = periods
    .flatMap((p) => [parseInt(p.minTemp, 10), parseInt(p.maxTemp, 10)])
    .filter((n) => !isNaN(n));

  return {
    overallMax: allTemps.length ? Math.max(...allTemps).toString() : "—",
    overallMin: allTemps.length ? Math.min(...allTemps).toString() : "—",
    periods,
  };
}

export function parseWeather(loc: TownshipLocation, county: string): ParsedWeather {
  const temp = getPointValue(loc, "溫度");
  const apparent = getPointValue(loc, "體感溫度");
  const humidity = getPointValue(loc, "相對濕度");
  const wind = getPointValue(loc, "風速");
  const windDir = getPointValue(loc, "風向");
  const pop = getPointValue(loc, "3小時降雨機率");
  const wx = getPointValue(loc, "天氣現象");
  const desc = getPointValue(loc, "天氣預報綜合描述");

  return {
    locationName: county,
    township: loc.LocationName,
    description: desc["WeatherDescription"] ?? "—",
    weather: wx["Weather"] ?? "—",
    weatherCode: wx["WeatherCode"] ?? "0",
    temperature: temp["Temperature"] ?? "—",
    apparentTemperature: apparent["ApparentTemperature"] ?? "—",
    humidity: humidity["RelativeHumidity"] ?? "—",
    pop: pop["ProbabilityOfPrecipitation"] ?? "—",
    windSpeed: wind["WindSpeed"] ?? "—",
    windDirection: windDir["WindDirection"] ?? "—",
    beaufortScale: wind["BeaufortScale"] ?? "—",
    forecast: buildForecast(loc),
  };
}
