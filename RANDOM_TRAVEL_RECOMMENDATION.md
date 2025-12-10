# 🎲 랜덤 여행지 추천 시스템 제작 문서

## 📋 개요

"랜덤 사주 여행 뽑기 머신" 컨셉의 여행지 추천 시스템. 사용자는 직접 텍스트 입력 없이 분기 질문만으로 상호작용하며, 지구본 여행자 캐릭터가 추천을 제공합니다.

## 🎯 핵심 컨셉

- **사주 느낌**: 랜덤한 척 하지만 실제로는 똑똑한 알고리즘
- **분기 질문만**: 사용자는 텍스트 입력 불가, 버튼 선택만 가능
- **하루 3회 제한**: 서버비 절약을 위한 제한
- **캐릭터 기반**: 지구본 여행자 캐릭터가 대답

## 🎨 디자인 컨셉

### 캐릭터
- 지구본 모양의 여행자 캐릭터 (이미지 제공됨)
- 모자, 백팩, 카메라, 여권을 가진 여행자
- 약간 장난스러운/알고 있는 듯한 표정
- 아이콘보다 큰 크기로 표시

### 색상 & 분위기
- 사주방 + 우주 + 지도 합친 느낌
- 딥블루/네이비 배경
- 별, 별자리, 지구본 실루엣
- 카드형 레이아웃 (타로 카드처럼)

### UI 스타일
- My Planet 카드와 동일한 디자인 언어
- 파란색 배경 (#5AA8E5), 노란색 강조 (#F8D348)
- 입체감 있는 그림자 효과

## 🔄 사용자 플로우

### 1. 초기 진입
```
[캐릭터 이미지]
"너 여행 패턴 한 줄 코멘트" 카드 표시
- 방문 국가 수 기반 "부자야?" 멘트
- 1회만 표시, 닫으면 다시 안 보임
```

### 2. 메인 화면
```
[캐릭터 이미지]
💸 오늘 남은 무료 추천: 3 / 3회
(서버비 아끼는 가난한 개발자 보호 모드 ON)

[🎁 랜덤 여행 뽑기] 버튼
```

### 3. 분기 질문 단계
```
Q. 이번 여행은 어떻게 가고 싶어?

[조금 고생하더라도 현지 감성 느끼기]
[웬만하면 편하게 쉬기]

Q. 거리 감각은?

[비행시간 따위... 난 상남자/상여자]
[주말에도 다녀올 수 있을 정도로]

Q. 예산은?

[최대한 가성비]
[적당히]
[그래, 이번엔 플렉스]
```

### 4. 추천 결과
```
[추천 여행지] 🇯🇵 도쿄

(설명문 2~3줄 - LLM 생성)

---

✈️ 여행 준비도 랜덤박스처럼 채워볼까?

- 🌐 스타링크 로밍
- 💳 트래블 카드
- 🛡 여행자 보험

[🤝 제휴·광고 문의] 버튼

---

※ 이 추천은 주관적 감과 빡센 알고리즘의 적당한 혼합물입니다.
어디까지 믿을지는 당신의 몫 🙃
```

### 5. 하루 3회 초과 시
```
오늘은 여기까지!

너도 여행 고민하느라 힘들고, 
나도 서버비 내느라 힘들어…

우리 내일 다시 만날까? 😂
```

## 🧠 알고리즘 규칙

### 스코어링 요소

1. **🎉 세계 축제 & 이벤트** (30%)
   - 현재 시기에 재밌는 행사 있는 곳
   - 축제 데이터베이스 필요

2. **🌤 계절** (20%)
   - 지금 가면 덥냐, 춥냐, 딱 좋냐
   - 국가별 최적 여행 시기

3. **❤️ 사용자 성향** (20%)
   - 분기 질문에서 수집:
     - 고생 vs 편안함
     - 멀리 vs 가까이
     - 가성비 vs 플렉스
   - 방문 기록 기반 선호도 분석

4. **🧳 가본 곳** (15%)
   - 너무 자주 간 곳은 살짝 피하기
   - 안 가본 곳은 살짝 밀어주기

5. **💱 세계 환율** (15%)
   - 지금 가면 돈 덜 새는 나라 위주
   - 환율 API: https://open.er-api.com/v6/latest/KRW

### 스코어링 공식
```
최종 스코어 = 
  (축제 점수 × 0.3) +
  (계절 점수 × 0.2) +
  (성향 점수 × 0.2) +
  (가본곳 점수 × 0.15) +
  (환율 점수 × 0.15)
```

상위 3개 후보를 LLM에 전달하여 최종 추천 생성

## 📊 데이터 구조

### TravelProfile (분기 질문 결과)
```typescript
interface TravelProfile {
  difficulty: 'adventure' | 'comfort'; // 고생 vs 편안
  distance: 'far' | 'near'; // 멀리 vs 가까이
  budget: 'budget' | 'moderate' | 'luxury'; // 가성비 vs 적당히 vs 플렉스
}
```

### RecommendationRequest
```typescript
interface RecommendationRequest {
  profile: TravelProfile;
  visitedCountries: string[]; // 방문한 국가 코드 목록
  visitCount: number; // 총 방문 국가 수
  currentDate: string; // 현재 날짜
}
```

### RecommendationResult
```typescript
interface RecommendationResult {
  country: {
    code: string;
    name: string;
    nameEn: string;
    flag: string;
  };
  city?: string; // 주요 도시
  message: string; // LLM 생성 추천 멘트
  slogan: string; // 한 줄 슬로건
  reasons: string[]; // 추천 이유 (축제, 환율, 계절 등)
  exchangeRate?: {
    currency: string;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  };
}
```

## 🔌 API 엔드포인트

### POST /api/travel/recommend

**Request:**
```json
{
  "profile": {
    "difficulty": "comfort",
    "distance": "near",
    "budget": "moderate"
  },
  "visitedCountries": ["KR", "JP", "US"]
}
```

**Response:**
```json
{
  "recommendation": {
    "country": {
      "code": "TH",
      "name": "태국",
      "nameEn": "Thailand",
      "flag": "🇹🇭"
    },
    "city": "방콕",
    "message": "태국 방콕은 지금...",
    "slogan": "현지 감성과 편안함의 완벽한 조화",
    "reasons": ["좋은 환율", "적당한 날씨", "가본 적 없음"],
    "exchangeRate": {
      "currency": "THB",
      "rate": 0.036,
      "trend": "stable"
    }
  },
  "remainingCount": 2,
  "dailyLimit": 3
}
```

## 💾 하루 3회 제한 구현

### 저장 방식
- LocalStorage: `travel_recommendations_YYYY-MM-DD`
- 또는 Supabase 테이블: `travel_recommendations`

### 구조
```typescript
interface DailyRecommendation {
  date: string; // YYYY-MM-DD
  count: number; // 오늘 사용한 횟수
  recommendations: RecommendationResult[];
}
```

## 🎭 방문 횟수 기반 "부자야?" 멘트

### 조건
- 최근 3년간 방문 국가 수 ≥ 8개
- 또는 같은 해에 해외 3번 이상

### 멘트 후보
```
너 여행 기록 쭉 보니까…

혹시 부자야…?
적어도 월급이 통장에서 그대로 있진 않을 것 같은데…? 🤔

해외를 이렇게 자주 나갔다고…?
최소한 '평범한 월급쟁이'는 아닌 것 같아.
혹시… 사업하시죠 사장님? 😏
```

### 반대 케이스
```
여행 기록이 너무 조용한데…
우리 같이 통장 울리지 않는 선에서 어딘가 한 번 찍고오자.
```

## 🌐 환율 API 통합

### API: https://open.er-api.com/v6/latest/KRW

**사용 방법:**
```typescript
const response = await fetch('https://open.er-api.com/v6/latest/KRW');
const data = await response.json();
// data.rates 객체에 모든 통화 환율 포함
```

### 환율 점수 계산
```typescript
function calculateExchangeRateScore(currency: string, rates: Record<string, number>): number {
  const rate = rates[currency];
  if (!rate) return 0;
  
  // 환율이 낮을수록 좋음 (원화가 더 많이 받음)
  // 예: 1 KRW = 0.0008 USD (낮음, 좋음)
  //     1 KRW = 0.01 USD (높음, 나쁨)
  
  // 정규화: 0-100 점수로 변환
  // 환율이 낮을수록 높은 점수
  const normalized = Math.max(0, 100 - (rate * 10000));
  return normalized;
}
```

## 📝 LLM 프롬프트 설계

### System Prompt
```
당신은 "랜덤 사주 여행 뽑기 머신"의 캐릭터입니다.
지구본 모양의 여행자 캐릭터로서, 약간 장난스럽고 알고 있는 듯한 말투로 대답하세요.

추천 여행지를 설명할 때:
- 사주 보는 듯한 느낌을 주되, 실제로는 알고리즘이 열심히 계산했다는 것을 살짝 암시
- 재치 있고 친근한 톤
- 가난한 개발자 서버비 드립 가끔 섞기
- 이모지 적절히 사용

카피 스타일:
- "논리적으로 설명할 수 없는 추천처럼 보이지만..."
- "사실 뒤에서 축제/환율/너 취향을 다 갈아 넣었어요"
- "그냥 '느낌'으로 뽑힌 것 같지? 알고리즘이 열일한 거야… 아마도…"
```

### User Prompt (알고리즘 결과 전달)
```
다음 정보를 바탕으로 여행지 추천 멘트를 작성해주세요:

추천 국가: {country.name} ({country.flag})
도시: {city}
추천 이유:
- 축제: {festival_reason}
- 계절: {season_reason}
- 환율: {exchange_reason}
- 성향: {preference_reason}

사용자 프로필:
- 여행 스타일: {difficulty}
- 거리 선호: {distance}
- 예산: {budget}
- 방문한 국가 수: {visitCount}개

2-3줄의 재치 있는 추천 멘트와 한 줄 슬로건을 작성해주세요.
```

## 🎨 UI 컴포넌트 구조

```
AIChatbot.tsx
├── CharacterDisplay (캐릭터 이미지 표시)
├── RichPersonDiagnosis (부자 진단 카드 - 1회만)
├── DailyLimitCounter (오늘 남은 횟수)
├── RandomTravelButton (랜덤 여행 뽑기 버튼)
├── BranchQuestions (분기 질문 단계)
│   ├── DifficultyQuestion (고생 vs 편안)
│   ├── DistanceQuestion (멀리 vs 가까이)
│   └── BudgetQuestion (예산)
├── RecommendationResult (추천 결과 카드)
│   ├── CountryInfo
│   ├── RecommendationMessage
│   ├── PartnershipSection (제휴 영역)
│   └── AlgorithmDisclaimer
└── DailyLimitReached (하루 3회 초과 메시지)
```

## 🔧 구현 단계

### Phase 1: API 엔드포인트 생성
- [ ] `/api/travel/recommend` 엔드포인트 생성
- [ ] 환율 API 통합
- [ ] 알고리즘 스코어링 로직 구현
- [ ] LLM 프롬프트 최적화

### Phase 2: UI 컴포넌트 재구성
- [ ] AIChatbot 컴포넌트를 분기 질문 기반으로 변경
- [ ] 캐릭터 이미지 통합
- [ ] 분기 질문 UI 구현
- [ ] 추천 결과 카드 디자인

### Phase 3: 제한 및 진단 기능
- [ ] 하루 3회 제한 로직
- [ ] 방문 횟수 기반 부자 진단
- [ ] LocalStorage/Supabase 저장

### Phase 4: 제휴 영역
- [ ] 제휴 상담 버튼 및 영역
- [ ] 제휴 문의 링크

### Phase 5: 퀄리티 향상
- [ ] 카피 라이팅 다양화
- [ ] 국가별 로컬 설명 프리셋
- [ ] 이모지/아이콘 적극 활용

## 📦 필요한 데이터

### 축제 데이터
- 국가별 주요 축제 및 이벤트
- 날짜 정보
- 계절별 축제 목록

### 계절 데이터
- 국가별 최적 여행 시기
- 현재 계절 정보
- 날씨 정보

### 환율 데이터
- 실시간 환율 (API 사용)
- 환율 추세 (상승/하락/안정)

## 🎯 카피 예시

### 버튼 텍스트
- 🎁 랜덤 여행 뽑기
- 🔮 오늘의 여행 운세
- 🎲 어디로 튈지 모르는 여행
- 🧧 복주머니 여행 추천

### 서브텍스트
```
사주 보는 척 하지만, 사실은
세계 축제 + 환율 + 너 취향 + 가본 나라까지 다 섞어서 
고르는 꽤 똑똑한 랜덤함이에요.
```

### 알고리즘 설명
```
이 앱은 대충 뽑는 척 하지만, 사실…

🎉 세계 축제 & 이벤트 : 지금 시기에 재밌는 행사 있는 곳?
🌤 계절 : 지금 가면 덥냐, 춥냐, 딱 좋냐
❤️ 너의 성향 : 도시 vs 자연, 맛집 vs 액티비티
🧳 가본 곳 : 너무 자주 간 곳은 살짝 피하고, 안 가본 곳은 살짝 밀어주고
💱 세계 환율 : 지금 가면 돈 덜 새는 나라 위주

이걸 다 섞어서
"랜덤한 척 하는, 꽤 영리한 추천"을 만들고 있어요.
```

## ✅ 구현 완료

1. ✅ API 엔드포인트 구현 (`/api/travel/recommend`)
2. ✅ UI 컴포넌트 재구성 (분기 질문 기반)
3. ✅ 하루 3회 제한 로직 (Supabase 테이블)
4. ✅ 부자 진단 멘트 (방문 횟수 기반)
5. ✅ 환율 API 통합
6. ✅ 제작 문서 작성

## 📝 추가 작업 필요

1. 캐릭터 이미지 추가
   - `public/traveler-character.png` 파일 추가
   - AIChatbot.tsx에서 주석 처리된 img 태그 활성화

2. 축제 데이터베이스 구축
   - 현재는 간단한 하드코딩된 축제 맵 사용
   - 실제 축제 데이터베이스 구축 권장

3. 계절 데이터 정확도 향상
   - 국가별 최적 여행 시기 데이터 추가

4. 제휴 문의 이메일 설정
   - 현재 `mailto:partnership@myplanet.com` 사용
   - 실제 이메일 주소로 변경 필요

## 🎨 캐릭터 이미지 추가 방법

1. 제공받은 캐릭터 이미지를 `public/traveler-character.png`로 저장
2. AIChatbot.tsx에서 다음 부분을 찾아서 주석 해제:
   ```tsx
   {/* <img src="/traveler-character.png" alt="여행자 캐릭터" className="w-full h-full object-cover" /> */}
   ```
3. 이모지 대신 이미지가 표시됨
