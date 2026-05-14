export const TAIWAN_LOCATIONS = [
  "宜蘭縣",
  "花蓮縣",
  "臺東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
  "臺北市",
  "新北市",
  "桃園市",
  "臺中市",
  "臺南市",
  "高雄市",
  "基隆市",
  "新竹縣",
  "新竹市",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義縣",
  "嘉義市",
  "屏東縣",
] as const;

export type TaiwanLocation = (typeof TAIWAN_LOCATIONS)[number];

export const DEFAULT_LOCATION: TaiwanLocation = "臺北市";

// 各縣市對應的 F-D0047 3天逐小時預報 dataset ID
export const LOCATION_DATASET_MAP: Record<TaiwanLocation, string> = {
  宜蘭縣: "F-D0047-001",
  桃園市: "F-D0047-005",
  新竹縣: "F-D0047-009",
  苗栗縣: "F-D0047-013",
  彰化縣: "F-D0047-017",
  南投縣: "F-D0047-021",
  雲林縣: "F-D0047-025",
  嘉義縣: "F-D0047-029",
  屏東縣: "F-D0047-033",
  臺東縣: "F-D0047-037",
  花蓮縣: "F-D0047-041",
  澎湖縣: "F-D0047-045",
  基隆市: "F-D0047-049",
  新竹市: "F-D0047-053",
  嘉義市: "F-D0047-057",
  臺北市: "F-D0047-061",
  高雄市: "F-D0047-065",
  新北市: "F-D0047-069",
  臺中市: "F-D0047-073",
  臺南市: "F-D0047-077",
  連江縣: "F-D0047-081",
  金門縣: "F-D0047-085",
};
