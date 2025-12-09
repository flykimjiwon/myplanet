export interface Country {
  name: string;
  code: string;
  continent: string;
  lat: number;
  lng: number;
  flag: string;
}

export const countries: Country[] = [
  // 아시아
  { name: "대한민국", code: "KR", continent: "아시아", lat: 37.5665, lng: 126.9780, flag: "🇰🇷" },
  { name: "일본", code: "JP", continent: "아시아", lat: 35.6762, lng: 139.6503, flag: "🇯🇵" },
  { name: "중국", code: "CN", continent: "아시아", lat: 39.9042, lng: 116.4074, flag: "🇨🇳" },
  { name: "태국", code: "TH", continent: "아시아", lat: 13.7563, lng: 100.5018, flag: "🇹🇭" },
  { name: "베트남", code: "VN", continent: "아시아", lat: 21.0285, lng: 105.8542, flag: "🇻🇳" },
  { name: "싱가포르", code: "SG", continent: "아시아", lat: 1.3521, lng: 103.8198, flag: "🇸🇬" },
  { name: "말레이시아", code: "MY", continent: "아시아", lat: 3.1390, lng: 101.6869, flag: "🇲🇾" },
  { name: "인도네시아", code: "ID", continent: "아시아", lat: -6.2088, lng: 106.8456, flag: "🇮🇩" },
  { name: "필리핀", code: "PH", continent: "아시아", lat: 14.5995, lng: 120.9842, flag: "🇵🇭" },
  { name: "인도", code: "IN", continent: "아시아", lat: 28.6139, lng: 77.2090, flag: "🇮🇳" },
  { name: "대만", code: "TW", continent: "아시아", lat: 25.0330, lng: 121.5654, flag: "🇹🇼" },
  { name: "홍콩", code: "HK", continent: "아시아", lat: 22.3193, lng: 114.1694, flag: "🇭🇰" },
  
  // 유럽
  { name: "영국", code: "GB", continent: "유럽", lat: 51.5074, lng: -0.1278, flag: "🇬🇧" },
  { name: "프랑스", code: "FR", continent: "유럽", lat: 48.8566, lng: 2.3522, flag: "🇫🇷" },
  { name: "독일", code: "DE", continent: "유럽", lat: 52.5200, lng: 13.4050, flag: "🇩🇪" },
  { name: "이탈리아", code: "IT", continent: "유럽", lat: 41.9028, lng: 12.4964, flag: "🇮🇹" },
  { name: "스페인", code: "ES", continent: "유럽", lat: 40.4168, lng: -3.7038, flag: "🇪🇸" },
  { name: "네덜란드", code: "NL", continent: "유럽", lat: 52.3676, lng: 4.9041, flag: "🇳🇱" },
  { name: "스위스", code: "CH", continent: "유럽", lat: 46.9479, lng: 7.4474, flag: "🇨🇭" },
  { name: "오스트리아", code: "AT", continent: "유럽", lat: 48.2082, lng: 16.3738, flag: "🇦🇹" },
  { name: "그리스", code: "GR", continent: "유럽", lat: 37.9838, lng: 23.7275, flag: "🇬🇷" },
  { name: "포르투갈", code: "PT", continent: "유럽", lat: 38.7223, lng: -9.1393, flag: "🇵🇹" },
  { name: "체코", code: "CZ", continent: "유럽", lat: 50.0755, lng: 14.4378, flag: "🇨🇿" },
  { name: "러시아", code: "RU", continent: "유럽", lat: 55.7558, lng: 37.6173, flag: "🇷🇺" },
  
  // 북미
  { name: "미국", code: "US", continent: "북미", lat: 40.7128, lng: -74.0060, flag: "🇺🇸" },
  { name: "캐나다", code: "CA", continent: "북미", lat: 43.6532, lng: -79.3832, flag: "🇨🇦" },
  { name: "멕시코", code: "MX", continent: "북미", lat: 19.4326, lng: -99.1332, flag: "🇲🇽" },
  
  // 남미
  { name: "브라질", code: "BR", continent: "남미", lat: -23.5505, lng: -46.6333, flag: "🇧🇷" },
  { name: "아르헨티나", code: "AR", continent: "남미", lat: -34.6037, lng: -58.3816, flag: "🇦🇷" },
  { name: "칠레", code: "CL", continent: "남미", lat: -33.4489, lng: -70.6693, flag: "🇨🇱" },
  { name: "페루", code: "PE", continent: "남미", lat: -12.0464, lng: -77.0428, flag: "🇵🇪" },
  
  // 오세아니아
  { name: "호주", code: "AU", continent: "오세아니아", lat: -33.8688, lng: 151.2093, flag: "🇦🇺" },
  { name: "뉴질랜드", code: "NZ", continent: "오세아니아", lat: -36.8485, lng: 174.7633, flag: "🇳🇿" },
  
  // 중동
  { name: "아랍에미리트", code: "AE", continent: "중동", lat: 25.2048, lng: 55.2708, flag: "🇦🇪" },
  { name: "터키", code: "TR", continent: "중동", lat: 41.0082, lng: 28.9784, flag: "🇹🇷" },
  { name: "이스라엘", code: "IL", continent: "중동", lat: 32.0853, lng: 34.7818, flag: "🇮🇱" },
  
  // 아프리카
  { name: "이집트", code: "EG", continent: "아프리카", lat: 30.0444, lng: 31.2357, flag: "🇪🇬" },
  { name: "남아프리카공화국", code: "ZA", continent: "아프리카", lat: -33.9249, lng: 18.4241, flag: "🇿🇦" },
  { name: "모로코", code: "MA", continent: "아프리카", lat: 33.9716, lng: -6.8498, flag: "🇲🇦" },
];

export const continents = ["아시아", "유럽", "북미", "남미", "오세아니아", "중동", "아프리카"];

// 위도/경도를 3D 좌표로 변환
export function latLngToVector3(lat: number, lng: number, radius: number = 2.5) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}



