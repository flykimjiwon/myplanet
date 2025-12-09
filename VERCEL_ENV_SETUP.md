# Vercel 배포 환경 변수 설정 가이드

Vercel에 배포할 때는 `.env.local` 파일이 자동으로 적용되지 않으므로, **Vercel 대시보드에서 환경 변수를 별도로 설정**해야 합니다.

## 설정 방법

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **환경 변수 설정**
   - 프로젝트 → Settings → Environment Variables
   - 아래 환경 변수들을 추가

## 필요한 환경 변수 목록

### 1. Supabase 관련 (필수)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**참고**: 실제 키 값은 `.env.local` 파일이나 Supabase 대시보드에서 확인하세요.

### 2. OpenAI 관련 (필수)

```
OPENAI_API_KEY=your_openai_api_key
```

**참고**: 실제 API 키는 OpenAI 플랫폼(https://platform.openai.com)에서 발급받으세요.

## 환경 변수 설정 단계

1. **Vercel 대시보드** → 프로젝트 선택
2. **Settings** 탭 클릭
3. **Environment Variables** 섹션으로 이동
4. 각 환경 변수를 추가:
   - **Key**: 환경 변수 이름 (예: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: 환경 변수 값
   - **Environment**: 
     - `Production` (프로덕션 배포용)
     - `Preview` (프리뷰 배포용, 선택사항)
     - `Development` (개발용, 선택사항)
5. **Save** 클릭

## 중요 사항

⚠️ **보안 주의사항:**
- `SUPABASE_SERVICE_ROLE_KEY`와 `OPENAI_API_KEY`는 **절대 공개하지 마세요**
- Vercel의 환경 변수는 암호화되어 저장되지만, 코드에 직접 하드코딩하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다

## 배포 후 확인

배포가 완료되면:
1. Vercel 대시보드에서 배포 로그 확인
2. 환경 변수가 제대로 로드되었는지 확인
3. 애플리케이션 테스트:
   - 로그인/회원가입 기능
   - AI 챗봇 기능
   - 데이터 저장 기능

## 문제 해결

환경 변수가 제대로 작동하지 않는 경우:
1. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
2. `NEXT_PUBLIC_` 접두사가 필요한 변수는 있는지 확인
3. Vercel에서 환경 변수를 추가한 후 **재배포** 필요
4. Vercel 대시보드의 배포 로그에서 오류 확인

## 참고

- Vercel 환경 변수 문서: https://vercel.com/docs/concepts/projects/environment-variables
- Next.js 환경 변수 문서: https://nextjs.org/docs/basic-features/environment-variables

