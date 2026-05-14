"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeatherApiResponse } from "@/app/api/weather/route";
import type { TaiwanLocation } from "@/lib/constants/locations";

async function fetchWeather(county: TaiwanLocation, township: string): Promise<WeatherApiResponse> {
  const params = new URLSearchParams({ county, township });
  const res = await fetch(`/api/weather?${params}`);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  return res.json() as Promise<WeatherApiResponse>;
}

interface UseWeatherOptions {
  county: TaiwanLocation;
  township: string;
  initialData: WeatherApiResponse;
}

export function useWeather({ county, township, initialData }: UseWeatherOptions) {
  return useQuery({
    queryKey: ["weather", county, township],
    queryFn: () => fetchWeather(county, township),
    initialData,
    initialDataUpdatedAt: new Date(initialData.updatedAt).getTime(),
    refetchInterval: 5 * 60 * 1000, // 5 分鐘自動更新
    staleTime: 0, // 永遠視為過期，確保 refetch 後更新
  });
}
