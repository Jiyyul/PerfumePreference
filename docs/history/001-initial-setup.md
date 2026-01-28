## 001 - Initial setup (프로젝트 부트스트랩)

### 프로젝트 개요
- **서비스 비전(PRD)**: “향수를 추천하는 것이 아니라, 사용자의 취향을 이해시키는 서비스”
- **핵심 원칙**:
  - 추천/비추천 판단은 **규칙 기반 로직**에서만 수행
  - 생성형 AI는 판단이 아니라 **결과 해석(Explanation)**만 수행
  - 결과보다 **설명 가능성/납득 가능성**을 우선
- **기준 사용자 흐름(FLOW)**:
  - Google Login → 보유 향수 등록 → 취향 입력 → 규칙 기반 추천 계산 → AI 설명 생성 → 결과+설명 UI → AI 설명 저장

### 기술 스택 선정 이유
`docs/tech-stack.md`와 PRD/Flow 요구사항을 기준으로 “재현성 있는 추천 + 설명 UX + 영속 저장”을 구현하기 위한 선택이다.

- **Next.js (App Router)**:
  - 인증/세션과 데이터 로딩(SSR)을 포함한 전체 흐름을 페이지 구조로 고정(FLOW)하기 용이
  - 라우팅/서버 컴포넌트/미들웨어 구성으로 인증 흐름을 명확히 분리 가능
- **TypeScript**:
  - 취향/향수/추천 결과/AI 설명 등 도메인 데이터가 많아지는 구조에서 타입 안정성이 유지보수성에 직접적으로 기여
- **Tailwind CSS (+ shadcn/ui 스타일 방식)**:
  - v0 UI 이식 및 컴포넌트 단위 스타일 확장에 적합
  - `cn()` 유틸 패턴(조건부 클래스 + Tailwind 충돌 해결)을 통한 일관된 스타일 운용
- **Supabase (Auth + PostgreSQL)**:
  - PRD가 요구하는 영속 데이터(취향/추천/AI 설명)를 저장하기 위한 백엔드 기반
  - 인증(Auth)과 RLS를 통한 사용자별 데이터 보호를 기본 제공

> 참고: `docs/tech-stack.md`에는 “Next.js 15+”로 기재되어 있으나, 현재 실제 프로젝트 의존성은 `next@16.1.6`이다(`package.json` 기준). 문서/실제 버전은 추후 정합성 점검 대상.

### 초기 환경 구축 내역
#### 1) 로컬 개발 환경
- **OS**: Windows 10
- **패키지 매니저**: pnpm (`pnpm -v` → `10.28.2`)

#### 2) Next.js 프로젝트 생성
다음 명령으로 프로젝트를 부트스트랩했다.

- **명령**: `pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app`
- **선택 옵션**:
  - React Compiler: Yes
  - `src/` 디렉터리: Yes
  - import alias 커스터마이즈: No
- **생성 시 설치된 기본 의존성(요약)**:
  - dependencies: `next`, `react`, `react-dom`
  - devDependencies: `typescript`, `tailwindcss`, `eslint`, `eslint-config-next`, `@tailwindcss/postcss`, `@types/*`

#### 3) Git 저장소 초기화 및 원격 연결
- 초기 커밋 생성 후 원격을 추가하고, 기본 브랜치를 `main`으로 전환했다.
- 원격에 기존 히스토리가 있어 `git push -u origin main`이 거절되었고,
  - **해결**: `git push -u origin main --force`로 원격을 현재 히스토리로 동기화(강제 업데이트).

#### 4) 현재 기준 핵심 버전(요약)
`package.json` 기준(현재 상태):
- **Next.js**: `16.1.6`
- **React / React DOM**: `19.2.3`
- **TypeScript**: `^5`
- **Tailwind CSS**: `^4`

> UI 이식 과정에서 추가된 라이브러리 및 에러/해결은 `docs/history/002-ui-migration-and-dependencies.md`에 별도 기록.

### 주요 문서화 현황
초기 세팅 단계에서 “서비스 철학/흐름/기술/데이터”를 문서로 고정해, 구현 과정에서 의도(왜 존재하는지)가 흔들리지 않도록 했다.

- **`docs/PRD.md`**:
  - 서비스 비전, 핵심 기능, AI 역할 제한(판단 금지/설명 전용), 데이터 모델링 철학을 명시
- **`docs/FLOW.md`**:
  - 사용자 여정(Sequence)과 페이지 구조(Flowchart)로 서비스 흐름을 고정
- **`docs/tech-stack.md`**:
  - 기술 스택 및 설계 원칙(컴포넌트 계층 구조, 라우팅 개요, 확장성 고려)을 정리
- **`docs/db-schema.md`**:
  - PRD 데이터 모델(프로필/보유향수/취향/추천결과/AI설명) 및 RLS 정책 요약
- **`.cursor/rules/*.mdc`**:
  - PRD/Flow 무결성, AI 역할 분리, 데이터 영속 저장, UI/UX 톤 등 “프로젝트 불변 규칙”을 IDE 규칙으로 고정
