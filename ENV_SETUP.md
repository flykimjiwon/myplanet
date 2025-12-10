# 환경 변수 설정 가이드

## Supabase 키 정보

Supabase Dashboard에서 확인한 정보를 사용하여 환경 변수를 설정하세요.

### 필요한 정보

1. **Project URL**: Settings > API 페이지 상단에 표시됩니다
   - 형식: `https://xxxxx.supabase.co` 또는 `https://xxxxx.supabase.app`
   
2. **Publishable key**: 이미 확인하셨습니다
   - `sb_publishable_-13YY8m5yuvBK2LhiosdNA_xaLf0zl9`

## .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 형식으로 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://여기에_Project_URL_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_key_입력
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_key_입력
OPENAI_API_KEY=여기에_openai_api_key_입력
ADMIN_EMAILS=admin@example.com,another@example.com
NEXT_PUBLIC_SITE_URL=https://myplanet-ashen.vercel.app
```

### 예시 (Project URL을 확인한 후)

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
ADMIN_EMAILS=admin@example.com,another@example.com
```

**참고:**
- Supabase 키는 `GET_SUPABASE_CREDENTIALS.md` 참고
- OpenAI API 키는 https://platform.openai.com 에서 발급
- `ADMIN_EMAILS`: 관리자 이메일 목록 (쉼표로 구분). 관리자는 하루 100회 추천 가능, 일반 사용자는 10회
- `NEXT_PUBLIC_SITE_URL`: 프로덕션 사이트 URL (예: https://myplanet-ashen.vercel.app). 메일 인증 링크에 사용됩니다.

## Project URL 찾는 방법

1. Supabase Dashboard에서 프로젝트 선택
2. Settings > API로 이동
3. 페이지 상단에 "Project URL" 또는 "API URL"이 표시됩니다
4. 또는 왼쪽 사이드바 하단에 프로젝트 이름 옆에 URL이 표시될 수 있습니다

## 주의사항

- ⚠️ **Secret key는 사용하지 마세요!** 서버 사이드에서만 사용하는 키입니다.
- ✅ **Publishable key**를 사용하세요. 이것이 클라이언트에서 사용하는 안전한 키입니다.
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## Supabase Site URL 설정 (중요!)

메일 인증 링크가 올바르게 작동하려면 Supabase Dashboard에서 Site URL을 설정해야 합니다:

1. Supabase Dashboard 접속
2. Settings > Authentication으로 이동
3. "Site URL" 섹션에서 프로덕션 URL 입력:
   - `https://myplanet-ashen.vercel.app`
4. "Redirect URLs"에 다음 추가:
   - `https://myplanet-ashen.vercel.app/auth/callback`
   - `https://myplanet-ashen.vercel.app/**` (와일드카드 허용)
5. 저장

**참고:** 개발 환경에서는 localhost가 자동으로 사용되지만, 프로덕션에서는 위 설정이 필요합니다.

## 설정 확인

환경 변수를 설정한 후:

1. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

2. 브라우저 콘솔에서 에러가 없는지 확인

3. 연결 테스트 (선택사항):
   - 임시로 테스트 페이지를 만들어 연결 확인 가능

