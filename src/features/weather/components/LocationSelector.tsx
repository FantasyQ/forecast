"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TAIWAN_LOCATIONS, type TaiwanLocation } from "@/lib/constants/locations";

interface LocationSelectorProps {
  currentLocation: TaiwanLocation;
  className?: string;
}

export function LocationSelector({ currentLocation, className }: LocationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", e.target.value);
    params.delete("township");
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={currentLocation}
      onChange={handleChange}
      className={
        className ??
        "rounded-lg border border-black/10 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      }
    >
      {TAIWAN_LOCATIONS.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
    </select>
  );
}
