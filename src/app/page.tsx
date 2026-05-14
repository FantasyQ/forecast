import { fetchTownshipForecast } from "@/lib/api/cwa";
import { parseWeather } from "@/features/weather/hooks/parseWeather";
import { WeatherClient } from "@/features/weather/components/WeatherClient";
import { TAIWAN_LOCATIONS, DEFAULT_LOCATION, type TaiwanLocation } from "@/lib/constants/locations";
import type { WeatherApiResponse } from "@/app/api/weather/route";

interface HomeProps {
  searchParams: Promise<{ location?: string; township?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { location: rawLocation, township: rawTownship } = await searchParams;

  const county: TaiwanLocation = TAIWAN_LOCATIONS.includes(rawLocation as TaiwanLocation)
    ? (rawLocation as TaiwanLocation)
    : DEFAULT_LOCATION;

  const data = await fetchTownshipForecast(county);
  const locations = data.records.Locations[0];
  const townships = locations?.Location.map((l) => l.LocationName) ?? [];

  const selectedTownship = townships.includes(rawTownship ?? "")
    ? (rawTownship as string)
    : (townships[0] ?? "");

  const townshipData = locations?.Location.find((l) => l.LocationName === selectedTownship);

  const initialData: WeatherApiResponse = {
    weather: townshipData
      ? parseWeather(townshipData, county)
      : {
          locationName: county,
          township: selectedTownship,
          description: "—",
          weather: "—",
          weatherCode: "0",
          temperature: "—",
          apparentTemperature: "—",
          humidity: "—",
          pop: "—",
          windSpeed: "—",
          windDirection: "—",
          beaufortScale: "—",
          forecast: { overallMax: "—", overallMin: "—", periods: [] },
        },
    townships,
    updatedAt: new Date().toISOString(),
  };

  const hasExplicitLocation = TAIWAN_LOCATIONS.includes(rawLocation as TaiwanLocation);

  return (
    <WeatherClient
      county={county}
      township={selectedTownship}
      initialData={initialData}
      hasExplicitLocation={hasExplicitLocation}
    />
  );
}
