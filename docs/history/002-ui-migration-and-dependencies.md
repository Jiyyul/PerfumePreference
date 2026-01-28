## 002 - UI migration & dependencies (pnpm add 기록)

### 1) 설치 날짜 및 작업자
- **설치/정리 날짜**: 2026-01-28
- **작업자**: 시니어 개발자 & AI 파트너(Cursor)

> 본 문서는 “`pnpm add`로 추가된 라이브러리”와, UI(v0/shadcn 스타일) 이식 과정에서 발생한 의존성/빌드 이슈의 해결 흐름을 남긴다.

### 2) 설치된 라이브러리 목록 (pnpm add)
`package.json` 기준(직접 의존성):
- **`lucide-react`**: `^0.400.0`
- **`tailwind-merge`**: `^2.2.0`
- **`clsx`**: `^2.1.0`
- **`zod`**: `^3.23.0`
- **`@supabase/ssr`**: `^0.8.0`

### 3) 각 라이브러리를 설치한 이유
- **`lucide-react`**
  - **목적**: v0 UI 이식 시 아이콘 컴포넌트 의존성(예: `ArrowRight`, `Settings` 등)을 만족시키기 위함.
  - **효과**: v0에서 생성된 화면/컴포넌트에서 사용한 아이콘 import를 그대로 유지하면서 UI를 동작시키는 기반 제공.

- **`clsx`**
  - **목적**: 조건부 className 조합을 안전하고 간결하게 처리.
  - **효과**: `cn()` 유틸(일반적으로 `clsx + tailwind-merge` 조합) 구성의 필수 기반.

- **`tailwind-merge`**
  - **목적**: Tailwind 클래스 충돌(예: `p-2` vs `p-4`)을 자동으로 정리/병합.
  - **효과**: v0/shadcn 계열 UI 컴포넌트 스타일을 “컴포넌트 단위로” 유지하면서도, 호출부에서 className 확장을 안정적으로 지원.

- **`zod`**
  - **목적**: 폼/입력/도메인 데이터의 스키마 기반 검증을 위해 도입.
  - **효과**: “입력값이 어떤 구조여야 하는지”를 코드로 고정해두고, 런타임 검증과 타입 추론을 함께 활용 가능.

- **`@supabase/ssr`**
  - **목적**: Next.js(App Router) 환경에서 SSR/미들웨어 컨텍스트에 맞는 Supabase 클라이언트 생성.
  - **효과**: 서버 컴포넌트/미들웨어에서 인증/세션 처리 흐름을 구성하는 기반 제공.

### 4) 발생했던 에러와 해결 과정 요약
- **`@supabase/ssr` 버전 불일치로 `pnpm install` 실패**
  - **증상**: `ERR_PNPM_NO_MATCHING_VERSION No matching version found for @supabase/ssr@^2.0.0`
  - **원인**: 존재하지 않는 메이저 범위(`^2.0.0`)를 직접 의존성으로 지정.
  - **해결**: 사용 가능한 최신 안정 버전인 `@supabase/ssr@0.8.0`으로 버전 정정(현재 `package.json`는 `^0.8.0`).

- **빌드 시 “모듈을 찾을 수 없음” 다발 발생**
  - **증상**: `next build`에서 아래 모듈들이 `Module not found`로 실패
    - `@supabase/ssr`
    - `clsx`
    - `tailwind-merge`
    - `lucide-react`
  - **원인**: v0 UI/유틸 코드를 이식했지만, 실제 프로젝트 의존성이 설치되지 않은 상태.
  - **해결**: 누락된 라이브러리를 `pnpm add`로 설치 후 재빌드 → 빌드 성공 확인.

- **`pnpm run dev`에서 Supabase 환경변수 미설정 에러**
  - **증상**: `Your project's URL and Key are required to create a Supabase client!`
  - **원인**: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` 값이 런타임에 제공되지 않음.
  - **해결**: (구성 작업) `.env.local` 또는 배포 환경 변수에 위 2개 값을 설정해 미들웨어에서 클라이언트 생성이 가능하도록 구성.

- **개발 서버 재시작 시 포트 충돌/락파일로 `next dev` 실패**
  - **증상**:
    - `Port 3000 is in use ... using 3001 instead`
    - `Unable to acquire lock at ... .next\\dev\\lock`
  - **원인**: 기존 `next dev` 프로세스가 남아있거나 `.next` 디렉터리 락이 해제되지 않음.
  - **해결**: 남은 `node.exe` 프로세스 종료 후(예: `taskkill /F /IM node.exe`), 필요 시 `.next` 삭제 후 재실행 → 정상 기동 확인.

---

### 참고
- 본 문서는 “의존성 설치 및 UI 이식 안정화” 관점의 기록이며, 추천 판단/점수화 로직은 규칙 엔진(백엔드/도메인 로직)에서만 수행한다(프로젝트 규칙 준수).
