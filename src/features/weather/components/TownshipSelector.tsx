"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TownshipSelectorProps {
  townships: string[];
  currentTownship: string;
  className?: string;
}

export function TownshipSelector({ townships, currentTownship, className }: TownshipSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("township", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={currentTownship}
      onChange={handleChange}
      className={
        className ??
        "rounded-lg border border-black/10 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      }
    >
      {townships.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
