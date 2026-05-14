import { z } from "zod";

// 逐小時時間點（溫度、風速等）
const PointTimeSchema = z.object({
  DataTime: z.string(),
  ElementValue: z.array(z.record(z.string(), z.string())),
});

// 時段（降雨機率、天氣現象等）
const PeriodTimeSchema = z.object({
  StartTime: z.string(),
  EndTime: z.string(),
  ElementValue: z.array(z.record(z.string(), z.string())),
});

const WeatherElementSchema = z.object({
  ElementName: z.string(),
  Time: z.array(z.union([PointTimeSchema, PeriodTimeSchema])),
});

const TownshipLocationSchema = z.object({
  LocationName: z.string(),
  Geocode: z.string(),
  Latitude: z.string(),
  Longitude: z.string(),
  WeatherElement: z.array(WeatherElementSchema),
});

const LocationsSchema = z.object({
  DatasetDescription: z.string(),
  LocationsName: z.string(),
  Location: z.array(TownshipLocationSchema),
});

export const TownshipForecastResponseSchema = z.object({
  success: z.string(),
  records: z.object({
    Locations: z.array(LocationsSchema),
  }),
});

export type TownshipForecastResponse = z.infer<typeof TownshipForecastResponseSchema>;
export type TownshipLocation = z.infer<typeof TownshipLocationSchema>;
export type TownshipWeatherElement = z.infer<typeof WeatherElementSchema>;
export type PointTime = z.infer<typeof PointTimeSchema>;
export type PeriodTime = z.infer<typeof PeriodTimeSchema>;
