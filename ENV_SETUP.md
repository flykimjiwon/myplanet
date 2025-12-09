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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-13YY8m5yuvBK2LhiosdNA_xaLf0zl9
```

### 예시 (Project URL을 확인한 후)

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-13YY8m5yuvBK2LhiosdNA_xaLf0zl9
```

## Project URL 찾는 방법

1. Supabase Dashboard에서 프로젝트 선택
2. Settings > API로 이동
3. 페이지 상단에 "Project URL" 또는 "API URL"이 표시됩니다
4. 또는 왼쪽 사이드바 하단에 프로젝트 이름 옆에 URL이 표시될 수 있습니다

## 주의사항

- ⚠️ **Secret key는 사용하지 마세요!** 서버 사이드에서만 사용하는 키입니다.
- ✅ **Publishable key**를 사용하세요. 이것이 클라이언트에서 사용하는 안전한 키입니다.
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## 설정 확인

환경 변수를 설정한 후:

1. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

2. 브라우저 콘솔에서 에러가 없는지 확인

3. 연결 테스트 (선택사항):
   - 임시로 테스트 페이지를 만들어 연결 확인 가능

