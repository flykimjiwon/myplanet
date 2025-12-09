-- user_preferences 테이블에 travel_preferences 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS travel_preferences JSONB;

-- 컬럼이 제대로 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name = 'travel_preferences';

