import { NextRequest, NextResponse } from "next/server";
import { fetchTownshipForecast } from "@/lib/api/cwa";
import { parseWeather } from "@/features/weather/hooks/parseWeather";
import { TAIWAN_LOCATIONS, DEFAULT_LOCATION, type TaiwanLocation } from "@/lib/constants/locations";
import type { ParsedWeather } from "@/features/weather/types";

export interface WeatherApiResponse {
  weather: ParsedWeather;
  townships: string[];
  updatedAt: string; // ISO string
}

export async function GET(request: NextRequest): Promise<NextResponse<WeatherApiResponse>> {
  const { searchParams } = request.nextUrl;
  const rawCounty = searchParams.get("county") ?? "";
  const rawTownship = searchParams.get("township") ?? "";

  const county: TaiwanLocation = TAIWAN_LOCATIONS.includes(rawCounty as TaiwanLocation)
    ? (rawCounty as TaiwanLocation)
    : DEFAULT_LOCATION;

  const data = await fetchTownshipForecast(county);
  const locations = data.records.Locations[0];
  const townships = locations?.Location.map((l) => l.LocationName) ?? [];

  const selectedTownship = townships.includes(rawTownship) ? rawTownship : (townships[0] ?? "");

  const townshipData = locations?.Location.find((l) => l.LocationName === selectedTownship);

  if (!townshipData) {
    return NextResponse.json(
      {
        weather: null,
        townships,
        updatedAt: new Date().toISOString(),
      } as unknown as WeatherApiResponse,
      { status: 404 }
    );
  }

  return NextResponse.json({
    weather: parseWeather(townshipData, county),
    townships,
    updatedAt: new Date().toISOString(),
  });
}
