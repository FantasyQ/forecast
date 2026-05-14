import { env } from "@/lib/env";
import { ForecastResponseSchema, type ForecastResponse } from "@/lib/schemas/weather";
import {
  TownshipForecastResponseSchema,
  type TownshipForecastResponse,
} from "@/lib/schemas/township-weather";
import { LOCATION_DATASET_MAP, type TaiwanLocation } from "@/lib/constants/locations";

const BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

// 今明 36 小時縣市天氣預報
const FORECAST_36H_DATASET = "F-C0032-001";

interface FetchForecastOptions {
  locationName?: string; // 縣市名稱，不填則回傳全台
}

export async function fetchForecast36h(
  options: FetchForecastOptions = {}
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    Authorization: env.CWA_API_KEY,
    ...(options.locationName ? { locationName: options.locationName } : {}),
  });

  const res = await fetch(`${BASE_URL}/${FORECAST_36H_DATASET}?${params}`, {
    next: { revalidate: 60 * 30 }, // 30 分鐘重新驗證
  });

  if (!res.ok) {
    throw new Error(`CWA API error: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  return ForecastResponseSchema.parse(json);
}

// 鄉鎮未來 3 天逐小時預報
export async function fetchTownshipForecast(
  county: TaiwanLocation
): Promise<TownshipForecastResponse> {
  const datasetId = LOCATION_DATASET_MAP[county];
  const params = new URLSearchParams({ Authorization: env.CWA_API_KEY });

  const res = await fetch(`${BASE_URL}/${datasetId}?${params}`, {
    next: { revalidate: 60 * 30 }, // 30 分鐘重新驗證
  });

  if (!res.ok) {
    throw new Error(`CWA API error: ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  return TownshipForecastResponseSchema.parse(json);
}
