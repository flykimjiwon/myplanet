# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: myplanet (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: 가장 가까운 리전 선택
4. 프로젝트 생성 완료 대기 (약 2분)

## 2. 환경 변수 설정

1. Supabase Dashboard에서 프로젝트 선택
2. Settings > API로 이동
3. 다음 정보를 복사:

   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** key

4. 프로젝트 루트에 `.env.local` 파일 생성하고 다음 내용 입력:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## 3. 데이터베이스 스키마 생성

1. Supabase Dashboard에서 **SQL Editor**로 이동
2. `supabase/schema.sql` 파일의 내용을 복사
3. SQL Editor에 붙여넣고 **Run** 클릭
4. 모든 테이블과 정책이 생성되었는지 확인

## 4. Storage 버킷 생성 (이미지 저장용)

1. Supabase Dashboard에서 **Storage**로 이동
2. "New bucket" 클릭
3. 설정:
   - **Name**: `travel-photos`
   - **Public bucket**: ✅ 체크 (이미지 공개 접근)
4. "Create bucket" 클릭

### Storage 정책 설정

Storage > Policies > travel-photos에서 다음 정책 추가:

**정책 1: 사용자는 자신의 폴더에 업로드 가능**

```sql
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'travel-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**정책 2: 사용자는 자신의 폴더에서 읽기 가능**

```sql
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'travel-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**정책 3: 사용자는 자신의 폴더에서 삭제 가능**

```sql
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'travel-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 5. 타입 생성 (선택사항)

1. Supabase Dashboard > Settings > API
2. "Generate TypeScript types" 클릭
3. 생성된 타입을 `src/lib/supabase/database.types.ts`에 붙여넣기

## 6. 확인 사항

- [ ] `.env.local` 파일이 생성되고 값이 입력됨
- [ ] 데이터베이스 스키마가 성공적으로 생성됨
- [ ] Storage 버킷 `travel-photos`가 생성됨
- [ ] Storage 정책이 설정됨
- [ ] 개발 서버 재시작 (`npm run dev`)

## 다음 단계

이제 회원가입/로그인 페이지를 구현할 수 있습니다!
