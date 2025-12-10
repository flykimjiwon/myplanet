-- My Planet Supabase 데이터베이스 스키마

-- 1. visited_countries 테이블
CREATE TABLE IF NOT EXISTS visited_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  visits INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

-- 2. country_ratings 테이블
CREATE TABLE IF NOT EXISTS country_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

-- 3. travel_memories 테이블
CREATE TABLE IF NOT EXISTS travel_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  photo_url TEXT,
  title TEXT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

-- 4. user_preferences 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stats_card_position JSONB,
  stats_card_collapsed BOOLEAN DEFAULT false,
  travel_preferences JSONB, -- 여행 성향 저장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_visited_countries_user_id ON visited_countries(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_countries_country_code ON visited_countries(country_code);
CREATE INDEX IF NOT EXISTS idx_country_ratings_user_id ON country_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_country_ratings_country_code ON country_ratings(country_code);
CREATE INDEX IF NOT EXISTS idx_travel_memories_user_id ON travel_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_memories_country_code ON travel_memories(country_code);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_visited_countries_updated_at BEFORE UPDATE ON visited_countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_ratings_updated_at BEFORE UPDATE ON country_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_memories_updated_at BEFORE UPDATE ON travel_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE visited_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS 정책: visited_countries
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

-- RLS 정책: country_ratings
CREATE POLICY "Users can view their own country ratings"
  ON country_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own country ratings"
  ON country_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own country ratings"
  ON country_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own country ratings"
  ON country_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 정책: travel_memories
CREATE POLICY "Users can view their own travel memories"
  ON travel_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel memories"
  ON travel_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel memories"
  ON travel_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel memories"
  ON travel_memories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 정책: user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 환율 정보 테이블
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL, -- 기준 통화 (KRW)
  target_currency VARCHAR(3) NOT NULL, -- 대상 통화 (USD, EUR, etc.)
  rate DECIMAL(20, 6) NOT NULL, -- 환율 (1 기준 통화 = rate 대상 통화)
  date DATE NOT NULL, -- 날짜
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('daily', 'monthly')), -- 일별 또는 월별
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, date, period_type)
);

-- 환율 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_period ON exchange_rates(period_type, date DESC);

-- 환율 테이블 RLS 정책 (모든 사용자가 읽기 가능)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

-- 관리자만 쓰기 가능 (서비스 역할 키 사용)
CREATE POLICY "Only service role can insert exchange rates"
  ON exchange_rates FOR INSERT
  WITH CHECK (false); -- RLS를 우회하려면 service_role 키 사용

CREATE POLICY "Only service role can update exchange rates"
  ON exchange_rates FOR UPDATE
  USING (false); -- RLS를 우회하려면 service_role 키 사용

-- 환율 테이블 updated_at 트리거
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 여행 추천 사용 횟수 테이블 (하루 3회 제한)
CREATE TABLE IF NOT EXISTS travel_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_travel_recommendations_user_date ON travel_recommendations(user_id, date DESC);

-- RLS 정책
ALTER TABLE travel_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON travel_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON travel_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON travel_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_travel_recommendations_updated_at BEFORE UPDATE ON travel_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

