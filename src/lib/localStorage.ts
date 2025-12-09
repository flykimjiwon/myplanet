// 로컬스토리지 유틸리티 함수

const STORAGE_KEY = 'myplanet_visited_countries';

export interface VisitedCountryData {
  code: string;
  visits: number;
  rating?: number; // 별점 (1-5)
  review?: string; // 한줄평
}

// 국가별 평점과 한줄평 저장
const RATINGS_KEY = 'myplanet_country_ratings';

export interface CountryRating {
  code: string;
  rating: number; // 1-5
  review: string; // 한줄평
}

export function saveCountryRating(code: string, rating: number, review: string): void {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    const ratings: CountryRating[] = stored ? JSON.parse(stored) : [];
    const index = ratings.findIndex(r => r.code === code);
    
    if (index >= 0) {
      ratings[index] = { code, rating, review };
    } else {
      ratings.push({ code, rating, review });
    }
    
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
    
    // 같은 탭에서의 변경을 감지하기 위한 custom event 발생
    window.dispatchEvent(new Event('localStorageChange'));
  } catch (error) {
    console.error('평점 저장 실패:', error);
  }
}

export function getCountryRating(code: string): CountryRating | null {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    if (!stored) return null;
    
    const ratings: CountryRating[] = JSON.parse(stored);
    return ratings.find(r => r.code === code) || null;
  } catch (error) {
    console.error('평점 불러오기 실패:', error);
    return null;
  }
}

export function getAllRatings(): Map<string, CountryRating> {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    if (!stored) return new Map();
    
    const ratings: CountryRating[] = JSON.parse(stored);
    return new Map(ratings.map(r => [r.code, r]));
  } catch (error) {
    console.error('평점 불러오기 실패:', error);
    return new Map();
  }
}

// 방문한 나라 데이터를 로컬스토리지에 저장
export function saveVisitedCountries(visitedCountries: Map<string, number>): void {
  try {
    const data: VisitedCountryData[] = Array.from(visitedCountries.entries()).map(([code, visits]) => ({
      code,
      visits,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('로컬스토리지 저장 실패:', error);
  }
}

// 로컬스토리지에서 방문한 나라 데이터 불러오기
export function loadVisitedCountries(): Map<string, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Map();
    }
    
    const data: VisitedCountryData[] = JSON.parse(stored);
    return new Map(data.map(({ code, visits }) => [code, visits]));
  } catch (error) {
    console.error('로컬스토리지 불러오기 실패:', error);
    return new Map();
  }
}

// 방문한 나라 데이터 초기화
export function clearVisitedCountries(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('로컬스토리지 삭제 실패:', error);
  }
}

// 여행 일기 데이터 저장 (비로그인 상태용)
const TRAVEL_MEMORIES_KEY = 'myplanet_travel_memories';

export interface TravelMemory {
  country_code: string;
  photo?: string; // base64 이미지
  title?: string;
  text?: string;
  updatedAt: number;
}

export function saveTravelMemory(countryCode: string, photo?: string, title?: string, text?: string): void {
  try {
    const stored = localStorage.getItem(TRAVEL_MEMORIES_KEY);
    const memories: TravelMemory[] = stored ? JSON.parse(stored) : [];
    const index = memories.findIndex(m => m.country_code === countryCode);
    
    const memory: TravelMemory = {
      country_code: countryCode,
      photo,
      title,
      text,
      updatedAt: Date.now(),
    };
    
    if (index >= 0) {
      // 기존 데이터와 병합 (undefined인 필드는 기존 값 유지)
      const existing = memories[index];
      memories[index] = {
        ...existing,
        ...memory,
        photo: photo !== undefined ? photo : existing.photo,
        title: title !== undefined ? title : existing.title,
        text: text !== undefined ? text : existing.text,
      };
    } else {
      memories.push(memory);
    }
    
    localStorage.setItem(TRAVEL_MEMORIES_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error('여행 일기 저장 실패:', error);
  }
}

export function getTravelMemory(countryCode: string): TravelMemory | null {
  try {
    const stored = localStorage.getItem(TRAVEL_MEMORIES_KEY);
    if (!stored) return null;
    
    const memories: TravelMemory[] = JSON.parse(stored);
    return memories.find(m => m.country_code === countryCode) || null;
  } catch (error) {
    console.error('여행 일기 불러오기 실패:', error);
    return null;
  }
}

export function deleteTravelMemory(countryCode: string): void {
  try {
    const stored = localStorage.getItem(TRAVEL_MEMORIES_KEY);
    if (!stored) return;
    
    const memories: TravelMemory[] = JSON.parse(stored);
    const filtered = memories.filter(m => m.country_code !== countryCode);
    localStorage.setItem(TRAVEL_MEMORIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('여행 일기 삭제 실패:', error);
  }
}

