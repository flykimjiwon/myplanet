import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { countries } from '@/lib/countries';

type TravelProfile = Record<string, string>;

interface RecommendationRequest {
  profile: TravelProfile;
  visitedCountries: string[];
}

interface UserData {
  travelPreferences?: Record<string, string>;
  visitedCountries: string[];
  ratings: Map<string, { rating: number; review: string | null }>;
}

// 관리자 여부 확인
function isAdmin(userEmail: string | undefined): boolean {
  if (!userEmail) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(userEmail);
}

// 일일 추천 제한 횟수 가져오기
function getDailyLimit(userEmail: string | undefined): number {
  return isAdmin(userEmail) ? 100 : 100; // 일반 사용자도 100회
}

// 환율 API에서 환율 가져오기
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/KRW', {
      next: { revalidate: 3600 } // 1시간 캐시
    });
    const data = await response.json();
    return data.rates || {};
  } catch (error) {
    console.error('환율 API 오류:', error);
    return {};
  }
}

// 환율을 직관적인 형식으로 변환 (1 통화당 KRW)
function formatExchangeRate(currency: string, rate: number): string {
  // rate는 1 KRW = rate 통화 형식
  // 1 통화 = 1/rate KRW로 변환
  const oneUnitInKRW = 1 / rate;
  
  // 통화별로 적절한 단위로 표시
  if (currency === 'JPY') {
    // 엔화는 1000엔 기준
    const thousandYen = oneUnitInKRW * 1000;
    return `1,000 ${currency} = ${Math.round(thousandYen).toLocaleString()}원`;
  } else if (currency === 'VND' || currency === 'IDR') {
    // 동화, 루피아는 10,000단위
    const tenThousand = oneUnitInKRW * 10000;
    return `10,000 ${currency} = ${Math.round(tenThousand).toLocaleString()}원`;
  } else {
    // 일반 통화는 1단위
    return `1 ${currency} = ${Math.round(oneUnitInKRW).toLocaleString()}원`;
  }
}

// 환율 정보를 텍스트로 변환
function getExchangeRateText(currency: string, rate: number): string {
  const formatted = formatExchangeRate(currency, rate);
  
  // 추가 설명
  const currencyNames: Record<string, string> = {
    'USD': '달러',
    'EUR': '유로',
    'JPY': '엔',
    'CNY': '위안',
    'GBP': '파운드',
    'AUD': '호주달러',
    'CAD': '캐나다달러',
    'THB': '바트',
    'VND': '동',
    'SGD': '싱가포르달러',
    'MYR': '링깃',
    'IDR': '루피아',
    'PHP': '페소',
    'TWD': '대만달러',
    'HKD': '홍콩달러',
  };
  
  const currencyName = currencyNames[currency] || currency;
  return `${formatted} (${currencyName})`;
}

// 계절 점수 계산 (현재 월 기준)
function getSeasonScore(country: typeof countries[0], currentMonth: number): number {
  // 간단한 계절 점수 (실제로는 국가별 최적 시기 데이터 필요)
  const northernHemisphere = country.lat > 0;
  const southernHemisphere = country.lat < 0;
  
  // 북반구: 3-5월(봄), 6-8월(여름), 9-11월(가을), 12-2월(겨울)
  // 남반구: 반대
  if (northernHemisphere) {
    if (currentMonth >= 3 && currentMonth <= 5) return 80; // 봄
    if (currentMonth >= 6 && currentMonth <= 8) return 70; // 여름
    if (currentMonth >= 9 && currentMonth <= 11) return 85; // 가을
    return 60; // 겨울
  } else if (southernHemisphere) {
    if (currentMonth >= 12 || currentMonth <= 2) return 80; // 여름
    if (currentMonth >= 3 && currentMonth <= 5) return 70; // 가을
    if (currentMonth >= 6 && currentMonth <= 8) return 60; // 겨울
    return 85; // 봄
  }
  
  return 70; // 적도 근처
}

// 환율 점수 계산
function getExchangeRateScore(
  countryCode: string,
  rates: Record<string, number>,
  budget?: string
): number {
  // 국가 코드를 통화 코드로 매핑
  const currencyMap: Record<string, string> = {
    'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY',
    'KR': 'KRW', 'EU': 'EUR', 'AU': 'AUD', 'CA': 'CAD',
    'TH': 'THB', 'VN': 'VND', 'SG': 'SGD', 'MY': 'MYR',
    'ID': 'IDR', 'PH': 'PHP', 'TW': 'TWD', 'HK': 'HKD',
  };
  
  const currency = currencyMap[countryCode] || 'USD';
  const rate = rates[currency];
  
  if (!rate) return 50; // 환율 정보 없으면 중간 점수
  
  // 환율이 낮을수록 좋음 (원화가 더 많이 받음)
  // 예: 1 KRW = 0.0008 USD (낮음, 좋음) vs 1 KRW = 0.01 USD (높음, 나쁨)
  let score = Math.max(0, 100 - (rate * 10000));
  
  // 예산에 따라 가중치 조정
  if (budget === 'budget') {
    score *= 1.3; // 가성비 중요
  } else if (budget === 'luxury') {
    score *= 0.7; // 예산 덜 중요
  }
  
  return Math.min(100, score);
}

// 성향 점수 계산 (사용자 여행 성향 데이터 반영)
function getPreferenceScore(
  country: typeof countries[0],
  profile: TravelProfile,
  travelPreferences?: Record<string, string>
): number {
  let score = 50;
  
  // 거리 점수 (한국 기준 대략적인 거리)
  const distanceFromKorea = Math.sqrt(
    Math.pow(country.lat - 37.5665, 2) + Math.pow(country.lng - 126.9780, 2)
  );
  
  if (profile.distance === 'near') {
    // 가까운 곳 선호 (아시아 위주)
    if (country.continent === '아시아') {
      score += 30;
    } else if (distanceFromKorea < 20) {
      score += 20;
    }
  } else if (profile.distance === 'far') {
    // 먼 곳 선호
    if (country.continent !== '아시아') {
      score += 30;
    } else if (distanceFromKorea > 30) {
      score += 20;
    }
  }
  // 'both'인 경우 점수 변화 없음
  
  // 난이도 점수 (간단한 추정)
  // 편안함 선호: 인프라 좋은 곳
  // 고생 선호: 덜 발달된 곳
  if (profile.difficulty === 'comfort') {
    // 선진국/관광지 선호
    const developedCountries = ['US', 'JP', 'GB', 'FR', 'DE', 'AU', 'CA', 'KR', 'SG', 'HK'];
    if (developedCountries.includes(country.code)) {
      score += 20;
    }
  } else if (profile.difficulty === 'adventure') {
    // 개발도상국/로컬 감성 선호
    const developingCountries = ['TH', 'VN', 'ID', 'PH', 'MY', 'IN', 'KH', 'LA'];
    if (developingCountries.includes(country.code)) {
      score += 20;
    }
  }
  
  // 예산 점수
  if (profile.budget === 'budget') {
    // 가성비 좋은 곳 선호
    const budgetCountries = ['TH', 'VN', 'ID', 'PH', 'MY', 'IN', 'KH', 'LA', 'CN'];
    if (budgetCountries.includes(country.code)) {
      score += 15;
    }
  } else if (profile.budget === 'luxury') {
    // 호화로운 곳 선호
    const luxuryCountries = ['US', 'JP', 'GB', 'FR', 'DE', 'AU', 'CA', 'SG', 'HK', 'CH'];
    if (luxuryCountries.includes(country.code)) {
      score += 15;
    }
  }

  // 프로필에서 직접 받은 성향 반영
  if (profile.vacation_style === 'relax') {
    const beachCountries = ['TH', 'VN', 'PH', 'ID', 'MY', 'MV', 'US', 'AU', 'BR', 'MX'];
    if (beachCountries.includes(country.code)) score += 15;
  } else if (profile.vacation_style === 'adventure') {
    const adventureCountries = ['NZ', 'NO', 'IS', 'CH', 'NP', 'PE', 'CL'];
    if (adventureCountries.includes(country.code)) score += 15;
  }

  if (profile.nature === 'nature') {
    const natureCountries = ['NZ', 'NO', 'IS', 'CH', 'AT', 'FI', 'CA'];
    if (natureCountries.includes(country.code)) score += 10;
  } else if (profile.nature === 'city') {
    const cityCountries = ['US', 'GB', 'FR', 'DE', 'JP', 'KR', 'SG', 'HK'];
    if (cityCountries.includes(country.code)) score += 10;
  }

  if (profile.food === 'important') {
    const foodCountries = ['JP', 'KR', 'TH', 'VN', 'IT', 'FR', 'ES', 'CN', 'TW'];
    if (foodCountries.includes(country.code)) score += 10;
  }

  if (profile.beach === 'required') {
    const beachCountries = ['TH', 'VN', 'PH', 'ID', 'MY', 'MV', 'US', 'AU', 'BR', 'MX', 'GR', 'ES', 'IT'];
    if (beachCountries.includes(country.code)) score += 12;
  }

  if (profile.shopping === 'important') {
    const shoppingCountries = ['US', 'JP', 'KR', 'SG', 'HK', 'GB', 'FR', 'IT', 'AE'];
    if (shoppingCountries.includes(country.code)) score += 10;
  }

  // 사용자 여행 성향 데이터 반영 (마이페이지에서 설정한 것)
  if (travelPreferences) {
    // 휴양지 스타일
    if (travelPreferences.vacation_style === 'relax') {
      const beachCountries = ['TH', 'VN', 'PH', 'ID', 'MY', 'MV', 'US', 'AU', 'BR', 'MX'];
      if (beachCountries.includes(country.code)) score += 10;
    } else if (travelPreferences.vacation_style === 'adventure') {
      const adventureCountries = ['NZ', 'NO', 'IS', 'CH', 'NP', 'PE', 'CL'];
      if (adventureCountries.includes(country.code)) score += 10;
    }

    // 자연 vs 도시
    if (travelPreferences.nature === 'nature') {
      const natureCountries = ['NZ', 'NO', 'IS', 'CH', 'AT', 'FI', 'CA'];
      if (natureCountries.includes(country.code)) score += 8;
    } else if (travelPreferences.nature === 'city') {
      const cityCountries = ['US', 'GB', 'FR', 'DE', 'JP', 'KR', 'SG', 'HK'];
      if (cityCountries.includes(country.code)) score += 8;
    }

    // 음식 중요도
    if (travelPreferences.food === 'important') {
      const foodCountries = ['JP', 'KR', 'TH', 'VN', 'IT', 'FR', 'ES', 'CN', 'TW'];
      if (foodCountries.includes(country.code)) score += 8;
    }
  }
  
  return Math.min(100, score);
}

// 가본 곳 점수 계산 (별점과 한줄평 반영)
function getVisitedScore(
  countryCode: string,
  visitedCountries: string[],
  ratings?: Map<string, { rating: number; review: string | null }>
): number {
  const visitCount = visitedCountries.filter(c => c === countryCode).length;
  const rating = ratings?.get(countryCode);
  
  if (visitCount === 0) {
    return 80; // 안 가본 곳은 높은 점수
  } else if (visitCount === 1) {
    // 한 번 간 곳: 별점이 높으면 다시 가고 싶을 수 있음
    if (rating && rating.rating >= 4) {
      return 50; // 별점 높으면 조금 더 높은 점수
    }
    return 40; // 한 번 간 곳은 중간
  } else {
    // 여러 번 간 곳: 별점이 매우 높으면 또 가고 싶을 수 있음
    if (rating && rating.rating >= 5) {
      return 35; // 최고점이면 조금 더 높은 점수
    }
    return 20; // 여러 번 간 곳은 낮은 점수
  }
}

// 축제 점수 (간단한 예시, 실제로는 축제 데이터베이스 필요)
function getFestivalScore(country: typeof countries[0], currentMonth: number): number {
  // 간단한 예시: 특정 국가/월에 축제가 있다고 가정
  const festivalMap: Record<string, number[]> = {
    'JP': [3, 4, 7, 8], // 벚꽃, 여름 축제
    'TH': [4, 11], // 송크란, 로이 크라통
    'BR': [2, 6], // 카니발
    'DE': [9, 10], // 옥토버페스트
    'ES': [7, 8], // 토마토 축제
  };
  
  const festivals = festivalMap[country.code];
  if (festivals && festivals.includes(currentMonth)) {
    return 90;
  }
  
  return 60; // 기본 점수
}

export async function POST(request: NextRequest) {
  try {
    // 로그인 상태 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인하고 사용해!' },
        { status: 401 }
      );
    }

    // 사용자 데이터 가져오기
    const { data: visitedData } = await supabase
      .from('visited_countries')
      .select('country_code, visits')
      .eq('user_id', user.id);

    const { data: ratingsData } = await supabase
      .from('country_ratings')
      .select('country_code, rating, review')
      .eq('user_id', user.id);

    const { data: preferencesData } = await supabase
      .from('user_preferences')
      .select('travel_preferences')
      .eq('user_id', user.id)
      .single();

    const visitedCountries = visitedData?.map(v => v.country_code) || [];
    const ratings = new Map<string, { rating: number; review: string | null }>();
    ratingsData?.forEach(r => {
      ratings.set(r.country_code, { rating: r.rating, review: r.review });
    });

    const travelPreferences = preferencesData?.travel_preferences as Record<string, string> | undefined;
    
    // 디버깅: 여행 성향 데이터 확인
    console.log('[서버] user_preferences에서 가져온 travelPreferences:', travelPreferences);

    const { profile }: { profile: TravelProfile } = await request.json();

    if (!profile) {
      return NextResponse.json(
        { error: '프로필 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 하루 3회 제한 확인
    const today = new Date().toISOString().split('T')[0];
    
    // Supabase에서 오늘 사용 횟수 확인
    const { data: todayUsage, error: usageError } = await supabase
      .from('travel_recommendations')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentCount = todayUsage?.count || 0;
    const dailyLimit = getDailyLimit(user.email);
    
    if (currentCount >= dailyLimit) {
      return NextResponse.json(
        { 
          error: `하루 ${dailyLimit}회 제한에 도달했습니다.`,
          limitReached: true,
          remainingCount: 0,
          dailyLimit
        },
        { status: 429 }
      );
    }

    // 환율 가져오기
    const exchangeRates = await getExchangeRates();
    const currentMonth = new Date().getMonth() + 1;

    // 모든 국가에 대해 스코어링
    const scoredCountries = countries.map(country => {
      const festivalScore = getFestivalScore(country, currentMonth) * 0.3;
      const seasonScore = getSeasonScore(country, currentMonth) * 0.2;
      const preferenceScore = getPreferenceScore(country, profile, travelPreferences) * 0.2;
      const visitedScore = getVisitedScore(country.code, visitedCountries, ratings) * 0.15;
      const exchangeScore = getExchangeRateScore(country.code, exchangeRates, profile.budget || profile['budget']) * 0.15;

      const totalScore = festivalScore + seasonScore + preferenceScore + visitedScore + exchangeScore;

      return {
        country,
        score: totalScore,
        breakdown: {
          festival: festivalScore,
          season: seasonScore,
          preference: preferenceScore,
          visited: visitedScore,
          exchange: exchangeScore,
        }
      };
    });

    // 상위 3개 선택
    const top3 = scoredCountries
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 랜덤하게 하나 선택 (상위 3개 중)
    const selected = top3[Math.floor(Math.random() * top3.length)];

    // LLM으로 추천 멘트 생성
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const reasons = [];
    if (selected.breakdown.festival > 20) reasons.push('축제/이벤트');
    if (selected.breakdown.season > 15) reasons.push('좋은 계절');
    if (selected.breakdown.exchange > 12) reasons.push('좋은 환율');
    if (selected.breakdown.visited > 10) reasons.push('새로운 경험');

    const systemPrompt = `당신은 "랜덤 여행 뽑기 머신"의 캐릭터입니다.
지구본 모양의 여행자 캐릭터로서, 약간 장난스럽고 알고 있는 듯한 말투로 대답하세요.

⚠️ 매우 중요: 반드시 최소 4-5줄 이상의 상세한 설명을 작성해야 합니다. 절대 짧게 끝내지 마세요!

추천 여행지를 설명할 때:
- 마구잡이 추천같지만 실제로는 미친 AI 알고리즘이 열심히 계산했다는 것을 강조
- 재치 있고 친근한 톤
- 가난한 개발자 서버비 드립 가끔 섞기 (예: "이 추천 생성하느라 서버비 0.03원 썼어… 😭")
- 이모지 적절히 사용
- 반드시 최소 4-5줄 이상의 상세한 설명 제공 (단순히 "다낭 추천!" 같은 짧은 문구 금지)

카피 스타일:
- "마구잡이 추천같지만, 사실은..."
- "미친 AI 알고리즘이 축제/환율/너 취향을 다 갈아 넣었어요"
- "그냥 '느낌'으로 뽑힌 것 같지? 알고리즘이 열일한 거야… 아마도…"
- 환율, 계절, 성향 등 구체적인 이유를 재미있게 설명

예시 (이 정도 길이는 최소한):
"오늘은 다낭 추천! 🇻🇳
지금 동(VND)이 지난달보다 약세라 분짜 두 그릇 더 먹고도 통장이 덜 아파.
너가 맛집 좋아하는 성향도 딱 맞고, 3월엔 야시장 감성 최고야.

슬로건: '돈은 줄이고 행복은 늘리는 여행'

(참고로 이 추천 생성하느라 서버비 0.03원 썼어… 😭)"`;

    // 사용자 평점 정보 추가
    const countryRating = ratings.get(selected.country.code);
    const ratingInfo = countryRating 
      ? `이전 방문 시 별점: ${countryRating.rating}/5${countryRating.review ? `, 한줄평: "${countryRating.review}"` : ''}`
      : '첫 방문 예정';

    // 환율 정보 가져오기
    const currencyMap: Record<string, string> = {
      'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY',
      'KR': 'KRW', 'EU': 'EUR', 'AU': 'AUD', 'CA': 'CAD',
      'TH': 'THB', 'VN': 'VND', 'SG': 'SGD', 'MY': 'MYR',
      'ID': 'IDR', 'PH': 'PHP', 'TW': 'TWD', 'HK': 'HKD',
    };
    const currency = currencyMap[selected.country.code] || 'USD';
    const exchangeRate = exchangeRates[currency];
    const exchangeRateInfo = exchangeRate 
      ? `현재 환율: ${getExchangeRateText(currency, exchangeRate)}`
      : '환율 정보 없음';

    const userPrompt = `다음 정보를 바탕으로 여행지 추천 멘트를 작성해주세요. 반드시 최소 4-5줄 이상, 상세하고 재미있게 작성해주세요.

추천 국가: ${selected.country.name} (${selected.country.flag})
추천 이유: ${reasons.join(', ')}
${exchangeRateInfo}

사용자 프로필:
${Object.entries(profile).length > 0 
  ? Object.entries(profile).map(([key, value]) => {
      const labels: Record<string, Record<string, string>> = {
        difficulty: { adventure: '조금 고생하더라도 현지 감성', comfort: '웬만하면 편하게', both: '둘다 상관없어' },
        distance: { far: '멀어도 상관없어', near: '가까운 데가 좋아', both: '둘다 상관없어' },
        budget: { budget: '최대한 가성비', moderate: '적당히', luxury: '플렉스', both: '둘다 상관없어' },
        vacation_style: { relax: '휴양지에서 쉬기', adventure: '모험과 탐험', both: '둘다 상관없어' },
        accommodation: { luxury: '호화로운 숙박', simple: '잠만 자면 됨', both: '둘다 상관없어' },
        food: { important: '음식이 중요해', simple: '간단하게', both: '둘다 상관없어' },
        nature: { nature: '자연 속에서', city: '도시 탐험', both: '둘다 상관없어' },
      };
      return `- ${key}: ${labels[key]?.[value] || value}`;
    }).join('\n')
  : '- 선호도 정보 없음 (모두 둘다 상관없어 선택)'}
- 방문한 국가 수: ${visitedCountries.length}개
- 이 국가 방문 이력: ${ratingInfo}
${travelPreferences ? `- 사용자 여행 성향 (마이페이지 설정): ${JSON.stringify(travelPreferences)}` : '- 사용자 여행 성향: 설정되지 않음'}
${Object.keys(profile).length > 0 ? `- 분기 질문 응답: ${JSON.stringify(profile)}` : ''}

⚠️ 매우 중요: 반드시 최소 4-5줄 이상의 상세한 설명을 작성해야 합니다. 절대 짧게 끝내지 마세요!

작성 형식 (반드시 이 순서대로):
1. 첫 줄: "오늘은 [국가명] 추천! [국기이모지]" 형식으로 시작
2. 환율 정보를 재미있게 설명 (반드시 "1 [통화] = [원화]원" 형식 포함)
   예: "지금 1달러에 1,300원이니까 여행하기 좋은 시기야!" 
   예: "1,000엔에 8,500원이면 라멘 한 그릇 더 먹을 수 있어"
   예: "지금 동(VND)이 지난달보다 약세라 분짜 두 그릇 더 먹고도 통장이 덜 아파"
3. 사용자 성향과 맞는 이유 설명 (2-3줄)
   예: "너가 맛집 좋아하는 성향도 딱 맞고, 3월엔 야시장 감성 최고야"
   예: "편하게 가고 싶다고 했는데, 여기는 인프라도 좋고 안전해"
4. 계절/축제 정보가 있으면 포함
5. 슬로건 한 줄 추가 (예: "돈은 줄이고 행복은 늘리는 여행")
6. 서버비 드립 추가 (예: "참고로 이 추천 생성하느라 서버비 0.03원 썼어… 😭")

최소 길이: 4-5줄 이상 (예시처럼)
절대 금지: "다낭 추천!" 같은 1줄짜리 짧은 답변

예시 (이 정도 길이는 최소한):
오늘은 다낭 추천! 🇻🇳
지금 동(VND)이 지난달보다 약세라 분짜 두 그릇 더 먹고도 통장이 덜 아파.
너가 맛집 좋아하는 성향도 딱 맞고, 3월엔 야시장 감성 최고야.

슬로건: "돈은 줄이고 행복은 늘리는 여행"

(참고로 이 추천 생성하느라 서버비 0.03원 썼어… 😭)`;

    // 사용 횟수 업데이트 (스트리밍 시작 전)
    const newCount = currentCount + 1;
    await supabase
      .from('travel_recommendations')
      .upsert({
        user_id: user.id,
        date: today,
        count: newCount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      });

    // SSE 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 먼저 국가 정보 전송
          const currencyMap: Record<string, string> = {
            'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY',
            'KR': 'KRW', 'EU': 'EUR', 'AU': 'AUD', 'CA': 'CAD',
            'TH': 'THB', 'VN': 'VND', 'SG': 'SGD', 'MY': 'MYR',
            'ID': 'IDR', 'PH': 'PHP', 'TW': 'TWD', 'HK': 'HKD',
          };
          const currency = currencyMap[selected.country.code] || 'USD';
          
          const countryData = JSON.stringify({ 
            type: 'country',
            country: selected.country,
            reasons,
            exchangeRate: exchangeRates[currency] ? {
              currency,
              rate: exchangeRates[currency],
              trend: 'stable' as const
            } : undefined
          });
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${countryData}\n\n`)
          );

          const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-5-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              max_completion_tokens: 3000, // 충분한 토큰 할당 (대화 잘림 방지)
              stream: true, // 스트리밍 활성화
              // gpt-5-mini는 temperature 지원하지 않음 (기본값 1 고정)
            }),
          });

          if (!llmResponse.ok) {
            const errorData = await llmResponse.json().catch(() => ({}));
            console.error('LLM 오류:', errorData);
            
            // LLM 실패 시 기본 메시지
            const defaultMessage = `오늘은 ${selected.country.name} 추천! ${selected.country.flag}\n\n마구잡이 추천같지만, 사실은 미친 AI 알고리즘이 열심히 계산한 거예요. 축제, 환율, 계절, 너의 취향까지 다 고려했어요. 그냥 '느낌'으로 뽑힌 것 같지? 알고리즘이 열일한 거야… 아마도… 😏\n\n(참고로 이 추천 생성하느라 서버비 0.03원 썼어… 😭)`;
            const defaultSlogan = '랜덤한 척 하는 미친 AI 알고리즘';
            
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ 
                  type: 'content',
                  content: defaultMessage 
                })}\n\n`
              )
            );
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ 
                  type: 'slogan',
                  slogan: defaultSlogan 
                })}\n\n`
              )
            );
            const dailyLimit = getDailyLimit(user.email);
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ 
                  type: 'done',
                  remainingCount: Math.max(0, dailyLimit - newCount),
                  dailyLimit
                })}\n\n`
              )
            );
            controller.close();
            return;
          }

          const reader = llmResponse.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            controller.close();
            return;
          }

          let fullContent = '';
          let slogan = '랜덤한 척 하는 미친 AI 알고리즘';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 디버깅: 최종 콘텐츠 길이 확인
              console.log('[서버] 스트리밍 완료 - 최종 콘텐츠 길이:', fullContent.length, '자');
              console.log('[서버] 최종 콘텐츠 (마지막 200자):', fullContent.slice(-200));
              
              // content가 비어있는 경우 처리 (예외 상황)
              if (!fullContent.trim()) {
                console.warn('gpt-5-mini: 최종 content가 비어있음 - 기본 메시지 사용');
                const currencyMap: Record<string, string> = {
                  'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY',
                  'KR': 'KRW', 'EU': 'EUR', 'AU': 'AUD', 'CA': 'CAD',
                  'TH': 'THB', 'VN': 'VND', 'SG': 'SGD', 'MY': 'MYR',
                  'ID': 'IDR', 'PH': 'PHP', 'TW': 'TWD', 'HK': 'HKD',
                };
                const currency = currencyMap[selected.country.code] || 'USD';
                const exchangeRate = exchangeRates[currency];
                const exchangeInfo = exchangeRate 
                  ? `지금 ${getExchangeRateText(currency, exchangeRate)}니까 여행하기 좋은 시기야!`
                  : '여행하기 좋은 시기야!';
                
                fullContent = `오늘은 ${selected.country.name} 추천! ${selected.country.flag}\n\n${exchangeInfo}\n\n마구잡이 추천같지만, 사실은 미친 AI 알고리즘이 열심히 계산한 거예요. 축제, 환율, 계절, 너의 취향까지 다 고려했어요. 그냥 '느낌'으로 뽑힌 것 같지? 알고리즘이 열일한 거야… 아마도… 😏`;
              }
              
              // 전체 내용 파싱
              const sloganMatch = fullContent.match(/슬로건[:\s]+(.+?)(?:\n|$)/i);
              if (sloganMatch) {
                slogan = sloganMatch[1].trim();
                fullContent = fullContent.replace(/슬로건[:\s]+.*$/i, '').trim();
              }
              
              // 최소 길이 확인 및 보완
              if (fullContent.trim().length < 150) {
                // 너무 짧으면 기본 메시지 추가
                const currencyMap: Record<string, string> = {
                  'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CN': 'CNY',
                  'KR': 'KRW', 'EU': 'EUR', 'AU': 'AUD', 'CA': 'CAD',
                  'TH': 'THB', 'VN': 'VND', 'SG': 'SGD', 'MY': 'MYR',
                  'ID': 'IDR', 'PH': 'PHP', 'TW': 'TWD', 'HK': 'HKD',
                };
                const currency = currencyMap[selected.country.code] || 'USD';
                const exchangeRate = exchangeRates[currency];
                const exchangeInfo = exchangeRate 
                  ? `지금 ${getExchangeRateText(currency, exchangeRate)}니까 여행하기 좋은 시기야!`
                  : '여행하기 좋은 시기야!';
                
                fullContent = `오늘은 ${selected.country.name} 추천! ${selected.country.flag}\n\n${exchangeInfo}\n\n${fullContent}\n\n마구잡이 추천같지만, 사실은 미친 AI 알고리즘이 열심히 계산한 거예요. 축제, 환율, 계절, 너의 취향까지 다 고려했어요.`;
              }
              
              // 서버비 드립이 없으면 추가
              if (!fullContent.includes('서버비') && !fullContent.includes('0.03원')) {
                fullContent += '\n\n(참고로 이 추천 생성하느라 서버비 0.03원 썼어… 😭)';
              }

              // 슬로건 전송
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ 
                    type: 'slogan',
                    slogan 
                  })}\n\n`
                )
              );

              // 완료 신호
              const dailyLimit = getDailyLimit(user.email);
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ 
                    type: 'done',
                    remainingCount: Math.max(0, dailyLimit - newCount),
                    dailyLimit
                  })}\n\n`
                )
              );
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const json = JSON.parse(data);
                  
                  // gpt-5-nano 스트리밍 응답 파싱
                  const choice = json.choices?.[0];
                  if (!choice) continue;
                  
                  // gpt-5-mini 스트리밍 응답 파싱
                  const content = choice.delta?.content || choice.content || '';
                  
                  if (content) {
                    fullContent += content;
                    // 디버깅: 서버에서 보내는 콘텐츠 로그
                    console.log('[서버] Content chunk 전송:', content.substring(0, 50), '...');
                    // 실시간으로 콘텐츠 전송
                    const dataToSend = JSON.stringify({ 
                      type: 'content',
                      content 
                    });
                    console.log('[서버] SSE 데이터:', dataToSend.substring(0, 100));
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${dataToSend}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // JSON 파싱 오류는 무시 (빈 줄이나 불완전한 JSON일 수 있음)
                  // 디버깅을 위해 로그는 남기지 않음
                }
              }
            }
          }
        } catch (error) {
          console.error('스트리밍 오류:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('추천 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
