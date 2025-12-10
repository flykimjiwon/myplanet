// 여행 추천 질문 풀

export interface TravelQuestion {
  id: string;
  question: string;
  options: {
    label: string;
    value: string;
    profileKey: string;
    profileValue: string;
  }[];
}

export const TRAVEL_QUESTIONS: TravelQuestion[] = [
  {
    id: 'difficulty',
    question: '이번 여행은 어떻게 가고 싶어?',
    options: [
      { label: '조금 고생하더라도 현지 감성 느끼기', value: 'adventure', profileKey: 'difficulty', profileValue: 'adventure' },
      { label: '웬만하면 편하게 쉬기', value: 'comfort', profileKey: 'difficulty', profileValue: 'comfort' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'difficulty', profileValue: 'both' },
    ],
  },
  {
    id: 'distance',
    question: '거리 감각은?',
    options: [
      { label: '비행시간 따위... 난 상남자/상여자', value: 'far', profileKey: 'distance', profileValue: 'far' },
      { label: '주말에도 다녀올 수 있을 정도로', value: 'near', profileKey: 'distance', profileValue: 'near' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'distance', profileValue: 'both' },
    ],
  },
  {
    id: 'budget',
    question: '예산은?',
    options: [
      { label: '최대한 가성비', value: 'budget', profileKey: 'budget', profileValue: 'budget' },
      { label: '적당히', value: 'moderate', profileKey: 'budget', profileValue: 'moderate' },
      { label: '그래, 이번엔 플렉스', value: 'luxury', profileKey: 'budget', profileValue: 'luxury' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'budget', profileValue: 'both' },
    ],
  },
  {
    id: 'vacation_style',
    question: '휴양지 스타일은?',
    options: [
      { label: '🏖️ 휴양지에서 쉬기', value: 'relax', profileKey: 'vacation_style', profileValue: 'relax' },
      { label: '🗺️ 모험과 탐험', value: 'adventure', profileKey: 'vacation_style', profileValue: 'adventure' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'vacation_style', profileValue: 'both' },
    ],
  },
  {
    id: 'accommodation',
    question: '숙박 스타일은?',
    options: [
      { label: '🏨 호화로운 숙박', value: 'luxury', profileKey: 'accommodation', profileValue: 'luxury' },
      { label: '🛏️ 잠만 자면 됨', value: 'simple', profileKey: 'accommodation', profileValue: 'simple' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'accommodation', profileValue: 'both' },
    ],
  },
  {
    id: 'food',
    question: '음식 중요도는?',
    options: [
      { label: '🍽️ 음식이 중요해', value: 'important', profileKey: 'food', profileValue: 'important' },
      { label: '🍱 간단하게', value: 'simple', profileKey: 'food', profileValue: 'simple' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'food', profileValue: 'both' },
    ],
  },
  {
    id: 'activity',
    question: '활동 선호도는?',
    options: [
      { label: '🎯 계획된 일정', value: 'planned', profileKey: 'activity', profileValue: 'planned' },
      { label: '🎲 즉흥적인 여행', value: 'spontaneous', profileKey: 'activity', profileValue: 'spontaneous' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'activity', profileValue: 'both' },
    ],
  },
  {
    id: 'group_size',
    question: '여행 동반자는?',
    options: [
      { label: '👥 그룹 여행', value: 'group', profileKey: 'group_size', profileValue: 'group' },
      { label: '🚶 혼자 여행', value: 'solo', profileKey: 'group_size', profileValue: 'solo' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'group_size', profileValue: 'both' },
    ],
  },
  {
    id: 'culture',
    question: '문화 체험은?',
    options: [
      { label: '🏛️ 문화 유적지', value: 'historical', profileKey: 'culture', profileValue: 'historical' },
      { label: '🎨 현대적 경험', value: 'modern', profileKey: 'culture', profileValue: 'modern' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'culture', profileValue: 'both' },
    ],
  },
  {
    id: 'nature',
    question: '자연 vs 도시?',
    options: [
      { label: '🌲 자연 속에서', value: 'nature', profileKey: 'nature', profileValue: 'nature' },
      { label: '🏙️ 도시 탐험', value: 'city', profileKey: 'nature', profileValue: 'city' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'nature', profileValue: 'both' },
    ],
  },
  {
    id: 'nightlife',
    question: '야경/야생활은?',
    options: [
      { label: '🌃 밤 문화 즐기기', value: 'active', profileKey: 'nightlife', profileValue: 'active' },
      { label: '🌙 일찍 자고 일찍 일어나기', value: 'early', profileKey: 'nightlife', profileValue: 'early' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'nightlife', profileValue: 'both' },
    ],
  },
  {
    id: 'transport',
    question: '교통 수단은?',
    options: [
      { label: '🚗 자유로운 이동', value: 'flexible', profileKey: 'transport', profileValue: 'flexible' },
      { label: '🚌 대중교통', value: 'public', profileKey: 'transport', profileValue: 'public' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'transport', profileValue: 'both' },
    ],
  },
  {
    id: 'weather',
    question: '날씨 선호도는?',
    options: [
      { label: '☀️ 따뜻한 곳', value: 'warm', profileKey: 'weather', profileValue: 'warm' },
      { label: '❄️ 시원한 곳', value: 'cool', profileKey: 'weather', profileValue: 'cool' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'weather', profileValue: 'both' },
    ],
  },
  {
    id: 'beach',
    question: '해변은 필수야?',
    options: [
      { label: '🏖️ 해변 필수!', value: 'required', profileKey: 'beach', profileValue: 'required' },
      { label: '🏔️ 해변 없어도 OK', value: 'optional', profileKey: 'beach', profileValue: 'optional' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'beach', profileValue: 'both' },
    ],
  },
  {
    id: 'shopping',
    question: '쇼핑은?',
    options: [
      { label: '🛍️ 쇼핑 필수!', value: 'important', profileKey: 'shopping', profileValue: 'important' },
      { label: '🎒 쇼핑 없어도 OK', value: 'optional', profileKey: 'shopping', profileValue: 'optional' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'shopping', profileValue: 'both' },
    ],
  },
  {
    id: 'language',
    question: '언어 걱정은?',
    options: [
      { label: '🗣️ 영어 잘 통하는 곳', value: 'english', profileKey: 'language', profileValue: 'english' },
      { label: '🤷 언어 장벽 상관없어', value: 'any', profileKey: 'language', profileValue: 'any' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'language', profileValue: 'both' },
    ],
  },
  {
    id: 'safety',
    question: '안전도는?',
    options: [
      { label: '🛡️ 안전한 곳 우선', value: 'safe', profileKey: 'safety', profileValue: 'safe' },
      { label: '🌍 모험적인 곳도 OK', value: 'adventure', profileKey: 'safety', profileValue: 'adventure' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'safety', profileValue: 'both' },
    ],
  },
  {
    id: 'duration',
    question: '여행 기간은?',
    options: [
      { label: '⏰ 짧게 (3-5일)', value: 'short', profileKey: 'duration', profileValue: 'short' },
      { label: '📅 길게 (1주일 이상)', value: 'long', profileKey: 'duration', profileValue: 'long' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'duration', profileValue: 'both' },
    ],
  },
  {
    id: 'photography',
    question: '사진 찍는 거 좋아해?',
    options: [
      { label: '📸 인스타 감성 필수!', value: 'important', profileKey: 'photography', profileValue: 'important' },
      { label: '📱 사진은 부차적', value: 'optional', profileKey: 'photography', profileValue: 'optional' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'photography', profileValue: 'both' },
    ],
  },
  {
    id: 'local_food',
    question: '현지 음식 도전은?',
    options: [
      { label: '🌶️ 현지 음식 도전!', value: 'adventure', profileKey: 'local_food', profileValue: 'adventure' },
      { label: '🍔 익숙한 음식 선호', value: 'familiar', profileKey: 'local_food', profileValue: 'familiar' },
      { label: '둘다 상관없어', value: 'both', profileKey: 'local_food', profileValue: 'both' },
    ],
  },
];

// 랜덤하게 3개 질문 선택
export function getRandomQuestions(count: number = 3): TravelQuestion[] {
  const shuffled = [...TRAVEL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
