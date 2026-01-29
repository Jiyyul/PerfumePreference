# 기술 명세서 (Tech Stack)

PRD·FLOW 기반 **향수 취향 분석 및 AI 추천 설명 서비스** 프로젝트 기술 스택 및 설계 원칙.

---

## 1. 핵심 스택

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | Next.js | 16.1.6 (App Router) | SSR, 라우팅, API Routes |
| Runtime | React | 19.2.3 | UI |
| Language | TypeScript | 5.9.3 | 타입 안정성 |
| Backend | Supabase | - | Auth, PostgreSQL, Realtime |
| Styling | Tailwind CSS | 4.1.18 | 유틸리티 기반 스타일 |
| UI Components | shadcn/ui | - | 공통 UI 프리미티브 |
| Icons | Lucide React | 0.400.0 | 아이콘 |
| Validation | Zod | 3.25.76 | 폼·API 스키마 검증 |

---

## 2. 주요 라이브러리

### 2.1 UI·스타일

- **Tailwind CSS**: 전역·컴포넌트 스타일, 반응형, `cn()` 유틸 활용.
- **shadcn/ui**: `components/ui/`에 복사 방식으로 도입. Button, Card, Input, Dialog, Tabs, Select 등.
- **Lucide React**: 아이콘. `lucide-react`에서 필요한 것만 named import.

### 2.2 데이터·인프라

- **@supabase/ssr**: Next.js App Router 기준의 Supabase 연동 핵심.  
  - 브라우저/서버 클라이언트 생성 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)  
  - 쿠키 기반 세션 유지 및 Route Handler에서 세션 검증/교환(`/callback`)에 사용

### 2.3 폼·검증

- **Zod**: 스키마 정의 및 `resolver` 연동 (React Hook Form 도입 시).
- (선택) **React Hook Form**: 취향·향수 등록 등 복잡 폼용.

### 2.4 AI·설명

- **OpenAI API** 또는 **Vercel AI SDK**: 생성형 AI 설명용.  
- AI는 **판단 없이** 규칙 엔진 결과만 자연어로 해석 (PRD 준수).

---

## 3. 컴포넌트 설계 원칙

PRD·FLOW 반영.

### 3.1 계층 구조

```
components/
├── ui/          # 공유 프리미티브 (shadcn)
└── domain/      # 비즈니스 로직 포함 도메인 컴포넌트
```

- **ui/**: 재사용 가능한 기본 블록. 도메인 무지식.
- **domain/**: auth, perfume, preference, recommendation 등 기능별.  
  - `lib/`, `hooks/`, `types/`와 연동해 데이터 fetching·변환·이벤트 처리.

### 3.2 도메인별 역할

| 도메인 | 역할 | 예시 컴포넌트 |
|--------|------|----------------|
| **auth** | 로그인·로그아웃·인증 UI | `LoginButton`, `UserMenu` |
| **perfume** | 보유 향수 등록·수정·목록 | `PerfumeForm`, `PerfumeList`, `PerfumeCard` |
| **preference** | 선호/비선호 노트, 사용 상황 입력 | `PreferenceForm`, `NoteSelector`, `UsageContextForm` |
| **recommendation** | 추천 결과·AI 설명 표시 | `RecommendationResult`, `AIExplanationView` |

### 3.3 원칙

1. **단일 책임**: 컴포넌트당 한 가지 역할.
2. **구성 over 복제**: 공통 패턴은 `ui/` + `domain/` 조합으로 구성. 비슷한 UI 복붙 지양.
3. **데이터 흐름**: 서버/클라이언트 구분 명확.  
   - 서버: Supabase 직접 호출, 초기 데이터.  
   - 클라이언트: `hooks/` 기반 mutation·캐시, 로딩·에러 처리.
4. **접근성**: shadcn 기본 a11y 유지. 포커스·키보드·스크린리더 고려.

---

## 4. 라우팅·페이지 구조 (개요)

- **`/`**: 랜딩.
- **`/(auth)/login`**, **`/(auth)/callback`**: Google 로그인·OAuth 콜백.
- **`/(dashboard)/*`**: 인증 후 대시보드.  
  - `perfumes`, `perfumes/new`, `perfumes/[id]`, `perfumes/[id]/edit`  
  - `preferences`  
  - `recommendations`

상세는 **폴더 구조 설계** 트리 참고.

---

## 5. 유지보수성·확장성

- **공통 로직**: `lib/`(Supabase, 규칙 엔진, AI 설명 클라이언트), `hooks/`, `types/`에 집중.  
  컴포넌트는 가급적 얇게 유지.
- **타입**: `types/database.ts`, `types/api.ts`에서 DB·API 타입 중앙 관리.  
  Supabase generated types 병행 시 `database.ts`에서 re-export.
- **환경 변수**: `NEXT_PUBLIC_SUPABASE_*`, AI API 키 등 `.env.local` 정리.  
  `lib/`에서만 참조, 컴포넌트에는 전달하지 않음.
- **테스트**: (Phase 2) `lib/recommendation-engine`, `lib/ai-explanation` 등 핵심 로직 단위 테스트 우선.

---

## 6. 참고

- PRD: `PRD.md`
- 플로우: `FLOW.md`
- DB 스키마: `docs/db-schema.md`
