import { TAIWAN_LOCATIONS, type TaiwanLocation } from "@/lib/constants/locations";

interface NominatimAddress {
  city?: string;
  county?: string;
  suburb?: string;
  town?: string;
  village?: string;
  city_district?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

interface IpApiResponse {
  status: string;
  regionName?: string;
}

function normalize(name: string): string {
  return name.replace(/台/g, "臺");
}

function matchLocation(address: NominatimAddress): TaiwanLocation | null {
  const raw = address.city ?? address.county ?? "";
  const normalized = normalize(raw);
  return (TAIWAN_LOCATIONS as readonly string[]).includes(normalized)
    ? (normalized as TaiwanLocation)
    : null;
}

function matchTownship(address: NominatimAddress): string | null {
  const raw = address.suburb ?? address.city_district ?? address.town ?? address.village ?? "";
  return raw ? normalize(raw) : null;
}

async function locateByCoords(lat: string, lon: string): Promise<Response> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW`;
  const res = await fetch(url, {
    headers: { "User-Agent": "forecast-app/1.0 (weather forecast for Taiwan)" },
  });
  if (!res.ok) return Response.json({ error: "geocoding failed" }, { status: 502 });

  const data = (await res.json()) as NominatimResponse;
  const address = data.address ?? {};
  const location = matchLocation(address);
  if (!location) return Response.json({ error: "location not in Taiwan" }, { status: 404 });

  return Response.json({ location, township: matchTownship(address) });
}

async function locateByIp(req: Request): Promise<Response> {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? "") : "";

  const apiUrl = ip
    ? `http://ip-api.com/json/${ip}?fields=status,regionName&lang=zh-TW`
    : `http://ip-api.com/json/?fields=status,regionName&lang=zh-TW`;

  const res = await fetch(apiUrl);
  if (!res.ok) return Response.json({ error: "ip geolocation failed" }, { status: 502 });

  const data = (await res.json()) as IpApiResponse;
  if (data.status !== "success") {
    return Response.json({ error: "ip geolocation failed" }, { status: 502 });
  }

  const location = (TAIWAN_LOCATIONS as readonly string[]).includes(
    normalize(data.regionName ?? "")
  )
    ? (normalize(data.regionName ?? "") as TaiwanLocation)
    : null;

  if (!location) return Response.json({ error: "location not in Taiwan" }, { status: 404 });

  return Response.json({ location, township: null });
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  return lat && lon ? locateByCoords(lat, lon) : locateByIp(req);
}
