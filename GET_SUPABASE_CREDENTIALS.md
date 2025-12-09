# Supabase 인증 정보 가져오기

## 1. 환경 변수 가져오기

### Step 1: Supabase Dashboard 접속

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. 생성한 프로젝트 선택

### Step 2: API 키 가져오기

1. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **API** 탭 선택
3. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co` 형식
   - **anon public** key: `eyJhbGc...` 로 시작하는 긴 문자열

### Step 3: Service Role Key 가져오기 (관리자 페이지용)

1. **Settings** > **API** 탭에서
2. **service_role** key 찾기 (⚠️ **절대 공개하지 마세요!**)
3. 이 키는 서버 사이드에서만 사용되며, 모든 권한을 가집니다.

### Step 4: 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_key_붙여넣기
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_key_붙여넣기
```

**예시:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**⚠️ 중요:**

- `SUPABASE_SERVICE_ROLE_KEY`는 **절대 클라이언트 사이드 코드나 GitHub에 공개하지 마세요!**
- 이 키는 서버 사이드에서만 사용되며, 모든 데이터베이스 권한을 가집니다.
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## 2. 데이터베이스 스키마 확인

### 현재 테이블 확인

1. Supabase Dashboard에서 **Table Editor** 클릭
2. 다음 테이블들이 있는지 확인:
   - `visited_countries`
   - `country_ratings`
   - `travel_memories`
   - `user_preferences`

### 스키마가 없다면

1. **SQL Editor**로 이동
2. `supabase/schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣고 **Run** 클릭
4. 성공 메시지 확인

## 3. TypeScript 타입 생성

### 방법 1: Supabase Dashboard에서 생성

1. **Settings** > **API**로 이동
2. "Generate TypeScript types" 섹션 찾기
3. "Generate TypeScript types" 버튼 클릭
4. 생성된 타입 코드를 복사
5. `src/lib/supabase/database.types.ts` 파일에 붙여넣기

### 방법 2: Supabase CLI 사용 (선택사항)

```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/database.types.ts
```

## 4. Storage 버킷 확인

1. **Storage** 메뉴 클릭
2. `travel-photos` 버킷이 있는지 확인
3. 없다면 생성:
   - "New bucket" 클릭
   - Name: `travel-photos`
   - Public bucket: ✅ 체크
   - "Create bucket" 클릭

## 5. 연결 테스트

환경 변수를 설정한 후 개발 서버를 재시작:

```bash
npm run dev
```

서버가 정상적으로 시작되면 연결 성공입니다!

## 문제 해결

### 환경 변수를 찾을 수 없다는 에러

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일 이름이 정확한지 확인 (`.env.local`)
- 개발 서버를 재시작했는지 확인

### 타입 에러

- `database.types.ts` 파일에 타입이 제대로 생성되었는지 확인
- Supabase Dashboard에서 타입을 다시 생성해보세요
