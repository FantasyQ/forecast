import { z } from "zod";

// 天氣預報參數
const WeatherParameterSchema = z.object({
  parameterName: z.string(),
  parameterValue: z.string().optional(),
  parameterUnit: z.string().optional(),
});

// 單一時段
const WeatherTimeSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  parameter: WeatherParameterSchema,
});

// 天氣要素（Wx/PoP/MinT/MaxT/CI）
const WeatherElementSchema = z.object({
  elementName: z.string(),
  time: z.array(WeatherTimeSchema),
});

// 單一縣市
const WeatherLocationSchema = z.object({
  locationName: z.string(),
  weatherElement: z.array(WeatherElementSchema),
});

// F-C0032-001 完整回應
export const ForecastResponseSchema = z.object({
  success: z.string(),
  records: z.object({
    datasetDescription: z.string(),
    location: z.array(WeatherLocationSchema),
  }),
});

export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;
export type WeatherLocation = z.infer<typeof WeatherLocationSchema>;
export type WeatherElement = z.infer<typeof WeatherElementSchema>;
export type WeatherTime = z.infer<typeof WeatherTimeSchema>;
