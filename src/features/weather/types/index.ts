export interface ForecastPeriod {
  startTime: string; // "00:00"
  endTime: string; // "03:00"
  minTemp: string; // "21"
  maxTemp: string; // "23"
  pop: string; // "30"
  weather: string; // "多雲"
  weatherCode: string; // "04"
}

export interface ForecastSummary {
  overallMax: string; // 這段期間最高溫
  overallMin: string; // 這段期間最低溫
  periods: ForecastPeriod[];
}

export interface ParsedWeather {
  locationName: string;
  township: string;
  description: string; // 天氣預報綜合描述
  weather: string; // 天氣現象
  weatherCode: string;
  temperature: string; // 當前溫度 °C
  apparentTemperature: string; // 體感溫度 °C
  humidity: string; // 相對濕度 %
  pop: string; // 3小時降雨機率 %
  windSpeed: string; // 風速 m/s
  windDirection: string; // 風向
  beaufortScale: string; // 蒲福風級
  forecast: ForecastSummary; // 接下來 6-9 小時預報
}
