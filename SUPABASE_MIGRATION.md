# Supabase 마이그레이션 개요

## 📋 현재 데이터 구조 분석

### 1. IndexedDB (여행 일기 데이터)

- **travelData**: 국가별 여행 일기
  - `photo`: base64 이미지
  - `title`: 일기 제목
  - `text`: 일기 내용
  - `updatedAt`: 업데이트 시간
  - **문제점**: 현재는 단일 데이터만 저장 (국가별 구분 없음)

### 2. LocalStorage (사용자 데이터)

- **visitedCountries**: 방문한 국가 목록
  - `code`: 국가 코드
  - `visits`: 방문 횟수
- **countryRatings**: 국가별 평점 및 한줄평

  - `code`: 국가 코드
  - `rating`: 별점 (1-5)
  - `review`: 한줄평

- **statsCardPosition**: 통계 카드 위치 (UI 상태)
- **statsCardCollapsed**: 통계 카드 접힘 상태 (UI 상태)

---

## 🗄️ Supabase 데이터베이스 스키마 설계

### 테이블 1: `users` (Supabase Auth 자동 생성)

- `id` (uuid, PK) - Supabase Auth에서 자동 생성
- `email` (text, unique) - 이메일 (아이디)
- `created_at` (timestamp) - 가입일시
- `updated_at` (timestamp) - 수정일시

### 테이블 2: `visited_countries`

```sql
CREATE TABLE visited_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  visits INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

CREATE INDEX idx_visited_countries_user_id ON visited_countries(user_id);
CREATE INDEX idx_visited_countries_country_code ON visited_countries(country_code);
```

### 테이블 3: `country_ratings`

```sql
CREATE TABLE country_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

CREATE INDEX idx_country_ratings_user_id ON country_ratings(user_id);
CREATE INDEX idx_country_ratings_country_code ON country_ratings(country_code);
```

### 테이블 4: `travel_memories` (여행 일기)

```sql
CREATE TABLE travel_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  photo_url TEXT, -- Supabase Storage에 저장된 이미지 URL
  title TEXT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

CREATE INDEX idx_travel_memories_user_id ON travel_memories(user_id);
CREATE INDEX idx_travel_memories_country_code ON travel_memories(country_code);
```

### 테이블 5: `user_preferences` (UI 상태 - 선택사항)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stats_card_position JSONB, -- {x: number, y: number}
  stats_card_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Storage 버킷: `travel-photos`

- 국가별 여행 사진 저장
- 경로: `{user_id}/{country_code}/photo.jpg`

---

## 🔐 Row Level Security (RLS) 정책

모든 테이블에 RLS 활성화 및 정책 설정:

```sql
-- visited_countries
ALTER TABLE visited_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visited countries"
  ON visited_countries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visited countries"
  ON visited_countries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visited countries"
  ON visited_countries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visited countries"
  ON visited_countries FOR DELETE
  USING (auth.uid() = user_id);

-- country_ratings (동일한 패턴)
-- travel_memories (동일한 패턴)
-- user_preferences (동일한 패턴)
```

---

## 📦 필요한 패키지 설치

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 🏗️ 구현 단계

### Phase 1: Supabase 프로젝트 설정 및 인증

1. ✅ Supabase 프로젝트 생성
2. ✅ 환경 변수 설정 (`.env.local`)
3. ✅ Supabase 클라이언트 초기화 (`src/lib/supabase/client.ts`, `server.ts`)
4. ✅ 회원가입 페이지 생성 (`src/app/signup/page.tsx`)
5. ✅ 로그인 페이지 생성 (`src/app/login/page.tsx`)
6. ✅ 인증 상태 관리 (`src/lib/auth.ts`)

### Phase 2: 데이터베이스 스키마 생성

1. ✅ SQL 스크립트 실행 (Supabase Dashboard)
2. ✅ RLS 정책 설정
3. ✅ Storage 버킷 생성 및 정책 설정

### Phase 3: 데이터 마이그레이션 유틸리티

1. ✅ 기존 LocalStorage/IndexedDB 데이터 읽기 함수
2. ✅ Supabase로 데이터 업로드 함수
3. ✅ 마이그레이션 페이지/컴포넌트 생성

### Phase 4: API 레이어 생성

1. ✅ `src/lib/supabase/visitedCountries.ts` - 방문 국가 CRUD
2. ✅ `src/lib/supabase/ratings.ts` - 평점 CRUD
3. ✅ `src/lib/supabase/memories.ts` - 여행 일기 CRUD
4. ✅ `src/lib/supabase/storage.ts` - 이미지 업로드/다운로드

### Phase 5: 기존 코드 리팩토링

1. ✅ `src/app/page.tsx` - 인증 상태 확인 및 데이터 로드
2. ✅ `src/components/CountrySelector.tsx` - Supabase API 사용
3. ✅ `src/components/BoardGame.tsx` - Supabase API 사용
4. ✅ `src/components/FlatMap.tsx` - Supabase API 사용

### Phase 6: 마이그레이션 및 테스트

1. ✅ 기존 사용자 데이터 마이그레이션
2. ✅ 오프라인 지원 고려 (선택사항)
3. ✅ 에러 핸들링 및 로딩 상태
4. ✅ 테스트 및 버그 수정

---

## 🔄 마이그레이션 전략

### 전략 1: 점진적 마이그레이션 (권장)

- 로그인한 사용자: Supabase 사용
- 비로그인 사용자: 기존 LocalStorage/IndexedDB 사용
- 로그인 시 기존 데이터 자동 마이그레이션

### 전략 2: 완전 마이그레이션

- 모든 사용자에게 Supabase 사용 강제
- 로그인 필수

---

## 📝 파일 구조

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # 클라이언트 Supabase 인스턴스
│   │   ├── server.ts          # 서버 Supabase 인스턴스
│   │   ├── visitedCountries.ts
│   │   ├── ratings.ts
│   │   ├── memories.ts
│   │   └── storage.ts
│   ├── auth.ts                # 인증 유틸리티
│   ├── migration.ts           # 데이터 마이그레이션 유틸리티
│   ├── indexedDB.ts           # (deprecated, 마이그레이션 후 제거)
│   └── localStorage.ts        # (deprecated, 마이그레이션 후 제거)
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── page.tsx               # 메인 페이지 (인증 확인)
└── components/
    └── AuthGuard.tsx          # 인증 보호 컴포넌트
```

---

## 🔑 환경 변수

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ⚠️ 주의사항

1. **이미지 저장**: base64 → Supabase Storage로 변경 필요
2. **오프라인 지원**: 현재는 오프라인 미지원, 향후 고려
3. **데이터 동기화**: 여러 기기 간 동기화 자동 지원
4. **보안**: RLS 정책으로 사용자별 데이터 격리
5. **마이그레이션**: 기존 사용자 데이터 손실 방지

---

## 🚀 다음 단계

1. Supabase 프로젝트 생성 및 설정
2. 데이터베이스 스키마 생성
3. Supabase 클라이언트 설치 및 초기화
4. 회원가입/로그인 페이지 구현
5. API 레이어 구현
6. 기존 코드 리팩토링
