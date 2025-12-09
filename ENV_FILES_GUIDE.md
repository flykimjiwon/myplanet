# Next.js 환경 변수 파일 가이드

Next.js에서는 여러 환경 변수 파일을 사용할 수 있으며, 우선순위가 있습니다.

## 환경 변수 파일 종류

### 1. `.env.local` (현재 사용 중) ⭐
- **용도**: 로컬 개발 환경 전용
- **Git 커밋**: ❌ 제외됨 (`.gitignore`에 포함)
- **우선순위**: 가장 높음
- **사용 시기**: 로컬 개발 시

### 2. `.env.development`
- **용도**: 개발 환경 전용
- **Git 커밋**: ⚠️ 선택적 (보안 정보는 제외)
- **우선순위**: `.env.local` 다음
- **사용 시기**: `npm run dev` 실행 시

### 3. `.env.production`
- **용도**: 프로덕션 빌드 전용
- **Git 커밋**: ⚠️ 선택적 (보안 정보는 제외)
- **우선순위**: `.env.local` 다음
- **사용 시기**: `npm run build` 실행 시

### 4. `.env`
- **용도**: 모든 환경에서 공통으로 사용
- **Git 커밋**: ✅ 가능 (공개해도 되는 값만)
- **우선순위**: 가장 낮음
- **사용 시기**: 모든 환경에서 공통으로 필요한 값

## 우선순위 (높은 순서)

1. `.env.local` (항상 로드, 모든 환경에서 최우선)
2. `.env.development` 또는 `.env.production` (환경에 따라)
3. `.env` (기본값)

## 현재 프로젝트 설정

현재는 `.env.local`만 사용하고 있습니다. 이는 로컬 개발에 충분합니다.

### 필요한 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Vercel 배포 시

Vercel에서는 **대시보드에서 환경 변수를 직접 설정**해야 합니다:
- `.env.local` 파일은 Vercel에 자동으로 업로드되지 않습니다
- Vercel 대시보드 → Settings → Environment Variables에서 설정
- 자세한 내용은 `VERCEL_ENV_SETUP.md` 참고

## 추천 설정 방법

### 로컬 개발
- `.env.local` 파일 사용 (현재 방식 유지)

### 팀 협업 시
- `.env.example` 파일 생성 (값 없이 키만)
- `.env.local`은 각자 로컬에서 생성
- `.gitignore`에 `.env.local` 포함 (이미 설정됨)

### 예시: `.env.example`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
```

## 주의사항

⚠️ **절대 Git에 커밋하지 말 것:**
- `.env.local` (이미 `.gitignore`에 포함됨)
- 실제 API 키나 비밀번호가 포함된 파일

✅ **Git에 커밋 가능:**
- `.env.example` (값 없이 키만)
- 공개해도 되는 기본 설정값

## 현재 상태

- ✅ `.env.local` 파일 존재
- ✅ `.gitignore`에 `.env*` 포함 (모든 env 파일 제외)
- ✅ Vercel 대시보드에서 환경 변수 설정 완료

**결론**: 현재 설정이 적절합니다. `.env.local`만 사용해도 충분하며, Vercel에서는 대시보드에서 별도로 설정하면 됩니다.

