# Scentory — 향수 취향 분석 및 추천 설명 서비스

**"향수를 추천하는 것이 아니라, 사용자의 취향을 이해시키는 서비스"**

Scentory는 향수 추천 결과보다 **설명 가능성과 납득 가능성**을 우선하는 향수 취향 분석 서비스입니다.  
규칙 기반 로직으로 일관성과 재현성을 확보하고, 생성형 AI는 판단이 아닌 **설명만** 담당합니다.

---

## 🎯 서비스 핵심 철학

### 문제 인식
기존 향수 추천 서비스는 "이 향수가 당신에게 잘 어울려요"라는 단순 추천만 제공하여:
- 왜 추천되었는지 이해할 수 없음
- 알고리즘 기준이 불투명하여 신뢰하기 어려움
- 사용자가 자신의 취향을 명확히 인식하지 못함

### 해결 방식
- **규칙 기반 추천**: AI가 아닌 명확한 로직으로 추천/비추천 판단
- **설명 우선**: 모든 판정에 대해 "왜 그런지" 자연어로 설명
- **취향 구조화**: 선호/비선호 노트, 사용 상황을 체계적으로 기록
- **투명성**: 판정 이유와 점수 계산 과정을 모두 공개

---

## 🚀 기술 스택

- **Frontend**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Auth**: Supabase Auth (Google OAuth)
- **AI**: Google Gemini (Generative AI), Vercel AI SDK
- **Validation**: Zod 3.23
- **Package Manager**: pnpm

---

## 📁 프로젝트 구조

```text
workspace/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # 인증 관련 라우트
│   │   ├── callback/              # OAuth callback handler
│   │   └── login/                 # 로그인 페이지
│   ├── (dashboard)/               # 대시보드 및 주요 기능
│   │   ├── dashboard/
│   │   │   ├── perfumes/          # 향수 관리 (CRUD)
│   │   │   ├── preferences/       # 취향 입력/수정
│   │   │   ├── recommendations/   # 추천 결과 및 AI 설명
│   │   │   └── page.tsx           # Dashboard 허브
│   │   └── chat/                  # AI 챗 기능 (실험적)
│   └── api/                       # API Routes
│       ├── perfumes/              # 향수 CRUD API
│       ├── preferences/           # 취향 CRUD API
│       ├── recommendations/       # 추천 생성 및 설명 API
│       └── ai/                    # AI 챗 API
├── components/
│   ├── ui/                        # 공통 UI 컴포넌트 (Button, Card 등)
│   ├── domain/                    # 도메인별 비즈니스 컴포넌트
│   │   ├── auth/                  # 인증 관련 (LoginButton, UserMenu)
│   │   ├── perfume/               # 향수 관련 (PerfumeCard, PerfumeForm)
│   │   ├── preference/            # 취향 관련 (PreferenceForm, NoteSelector)
│   │   └── recommendation/        # 추천 관련 (RecommendationResult, AIExplanationView)
│   └── common/                    # 공통 레이아웃 (Header, Footer)
├── hooks/                         # 커스텀 훅
│   ├── use-auth.ts                # 인증 및 프로필 조회
│   ├── use-perfumes.ts            # 향수 CRUD
│   ├── use-preferences.ts         # 취향 CRUD
│   └── use-recommendations.ts     # 추천 결과 조회
├── lib/                           # 유틸리티 및 핵심 로직
│   ├── supabase/                  # Supabase 클라이언트 (client, server)
│   ├── recommendation-engine.ts   # 규칙 기반 추천 엔진 (핵심)
│   ├── ai-explanation.ts          # AI 설명 생성 모듈
│   ├── ai-chat.ts                 # AI 챗 로직
│   └── utils.ts                   # 유틸리티 함수
├── types/
│   ├── database.ts                # Supabase 자동 생성 타입
│   └── api.ts                     # API 요청/응답 타입
├── supabase/
│   └── migrations/                # DB 마이그레이션 파일
├── docs/                          # 프로젝트 문서
│   ├── PRD.md                     # Product Requirements Document (핵심)
│   ├── FLOW.md                    # 사용자 흐름 및 아키텍처
│   ├── PHASE1_COMPLETION_SUMMARY.md  # Phase 1 완료 보고서
│   ├── db_schema.sql              # 데이터베이스 스키마
│   ├── tech-stack.md              # 기술 스택 상세
│   ├── TEST_PLAN_F4.md            # F4 테스트 계획
│   ├── VERIFICATION_REPORT_F4.md  # F4 검증 보고서
│   └── history/                   # 변경 이력
│       ├── 001-initial-setup.md
│       ├── 002-ui-migration-and-dependencies.md
│       ├── 003-supabase-schema-v1.md
│       ├── 004-supabase-auth-oauth-callback.md
│       ├── 005-api-routes-perfume-preference-crud.md
│       ├── 006-f1-profile-query-implementation.md
│       ├── 007-build-stabilization-and-code-cleanup.md
│       └── 008-gemini-ai-explanation-integration.md
└── .cursor/
    └── rules/                     # Cursor AI 개발 규칙 (중요)
        ├── 01_prd_and_flow.mdc    # 서비스 핵심 철학 및 흐름
        ├── 02_ai_role_and_logic.mdc  # AI 역할 분리 규칙
        ├── 03_ui_ux_style.mdc     # UI/UX 원칙
        ├── 04_data_and_storage.mdc   # 데이터 저장 규칙
        ├── 05_cursor_standard_practices.mdc  # 개발 표준
        ├── 06_temp_rules.mdc      # temp-v0 폴더 정책
        └── 07_database_operations.mdc  # 데이터베이스 운영 규칙
```

---

## 🏁 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API 설정 (Gemini 사용 시)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# AI API 설정 (OpenAI 사용 시, 선택)
OPENAI_API_KEY=your_openai_api_key
```

> **개발 모드**: Supabase 환경 변수가 없으면 자동으로 **Mock Login** 모드로 동작합니다.

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `docs/db_schema.sql` 또는 `supabase/migrations/` 파일을 SQL Editor에서 실행
3. 인증 설정:
   - Authentication > Providers > Google 활성화
   - Redirect URLs에 `http://localhost:3000/callback` 추가

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 5. 프로덕션 빌드

```bash
# 타입 체크
pnpm tsc --noEmit

# ESLint 검사
pnpm lint

# 프로덕션 빌드
pnpm build

# 빌드 결과 실행
pnpm start
```

**빌드 상태**: ✅ Production Ready (2026-01-30 검증 완료)

---

## 📊 주요 기능 및 구현 상태

### Phase 1: Foundation ✅ 완료 (2026-01-29)

| 기능 | 상태 | 설명 |
|------|------|------|
| **F1: Google OAuth 인증** | ✅ | Google 로그인, 세션 관리, 프로필 자동 생성 |
| **F2: 취향 입력/저장** | ✅ | 선호/비선호 노트, 사용 상황 입력 (UPSERT) |
| **F3: 향수 등록/관리** | ✅ | 향수 CRUD (노트, 계열, 분위기 구조화) |
| **프로필 조회** | ✅ | `profiles` 테이블 조회 및 표시 |

**완료 항목**:
- ✅ Supabase Auth (OAuth callback handler)
- ✅ RLS 기반 데이터 보안
- ✅ API Routes 인프라 (`requireUser`, 응답 헬퍼)
- ✅ 커스텀 훅 (`use-auth`, `use-perfumes`, `use-preferences`)

### Phase 2: Core Business Logic ✅ 부분 완료 (2026-01-30)

| 기능 | 상태 | 설명 |
|------|------|------|
| **F4: 규칙 기반 추천 엔진** | ✅ | 선호/비선호 노트 기반 점수 계산 및 판정 |
| **추천 결과 생성 API** | ✅ | `POST /api/recommendations/generate` |
| **추천 결과 조회** | ✅ | `use-recommendations` 훅 |
| **F5: AI 설명 생성** | ✅ | Gemini API 연동, 설명 생성 및 저장 |
| **AI 설명 조회** | ✅ | `POST /api/recommendations/[id]/explain` |

**핵심 로직**:
- **추천 판단**: `lib/recommendation-engine.ts` (규칙 기반, AI 미사용)
- **AI 설명**: `lib/ai-explanation.ts` (Gemini API, 설명만 담당)
- **데이터 저장**: `recommendation_results`, `ai_explanations` 테이블

### Phase 3: Interaction & Polish 📋 예정

- ⏳ 에러 처리 및 검증 강화
- ⏳ 로딩 상태 및 스켈레톤 UI
- ⏳ 사용자 피드백 (Toast, 알림)
- ⏳ 데이터 갱신 최적화 (React Query 도입 검토)

---

## 🛡️ 보안 및 데이터 정책

### Row Level Security (RLS)
모든 테이블에 RLS 정책이 적용되어 있으며, 사용자는 본인 데이터만 접근 가능합니다.

```sql
-- 예시: user_perfumes 테이블 RLS 정책
CREATE POLICY "Users can view own perfumes"
ON user_perfumes FOR SELECT
USING (auth.uid() = user_id);
```

### API 권한 검증
- 모든 API Route에서 `requireUser()` 함수로 인증 확인
- `user_id`는 서버에서만 주입 (클라이언트 payload 무시)
- 이중 보호: API 레벨 + DB 레벨 (RLS)

### 데이터 저장 원칙
- **AI 설명은 서비스 자산**: 캐시가 아닌 영속 저장
- **재현성 보장**: 동일 입력 → 동일 추천 결과
- **스냅샷 저장**: 추천 생성 당시의 취향 데이터 보존 (`input_snapshot`)

---

## 📚 문서

### 핵심 문서
- **[PRD.md](docs/PRD.md)**: Product Requirements Document (서비스 철학 필독)
- **[FLOW.md](docs/FLOW.md)**: 사용자 흐름 및 시스템 아키텍처
- **[PHASE1_COMPLETION_SUMMARY.md](docs/PHASE1_COMPLETION_SUMMARY.md)**: Phase 1 완료 보고서

### 기술 문서
- **[tech-stack.md](docs/tech-stack.md)**: 기술 스택 상세 버전 정보
- **[db_schema.sql](docs/db_schema.sql)**: 데이터베이스 스키마 정의
- **[TEST_PLAN_F4.md](docs/TEST_PLAN_F4.md)**: F4 기능 테스트 계획
- **[VERIFICATION_REPORT_F4.md](docs/VERIFICATION_REPORT_F4.md)**: F4 검증 보고서

### 변경 이력
`docs/history/` 폴더에서 모든 주요 변경 사항을 확인할 수 있습니다.

---

## 🎨 개발 가이드

### Cursor Rules
이 프로젝트는 `.cursor/rules/` 디렉토리에 정의된 **엄격한 개발 규칙**을 따릅니다:

1. **서비스 핵심 철학 보존** (`01_prd_and_flow.mdc`)
   - 추천 판단은 규칙 로직만 수행
   - AI는 설명만 담당
   - 사용자 흐름 변경 금지

2. **AI 역할 분리** (`02_ai_role_and_logic.mdc`)
   - AI는 판단하지 않음
   - 입력값: 이미 구조화된 데이터만
   - 출력: 설명만 (추천/판단 금지)

3. **데이터베이스 운영** (`07_database_operations.mdc`)
   - 파괴적 변경 금지 (DROP, TRUNCATE 엄격 제한)
   - 마이그레이션 이력 필수 기록
   - RLS 정책 검토 필수

### 코드 스타일
- **파일명**: `kebab-case.ts`
- **컴포넌트**: `PascalCase`
- **함수/변수**: `camelCase`
- **타입/인터페이스**: `PascalCase`

### 타입 생성
Supabase 타입을 자동 생성하려면:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

### History 기록 규칙
- 새 라이브러리 설치 시 `docs/history/NNN-description.md` 작성
- 아키텍처 변경 시 이력 기록
- 형식: `[날짜, 변경 내용, 변경 이유, 관련 이슈]`

---

## 🧪 테스트

### 자동 검증
```bash
# 린트 검사
pnpm lint

# 타입 체크
pnpm tsc --noEmit

# 빌드 검증
pnpm build
```

### 수동 테스트
- **테스트 페이지**: `/dashboard/profile-test` (F1 검증용)
- **API 테스트**: `docs/VERIFICATION_REPORT_F4.md` 참고

---

## 🗺️ 로드맵

### 단기 (Phase 2 완료 목표)
- ✅ F4: 규칙 기반 추천 엔진
- ✅ F5: AI 설명 생성
- ⏳ F6: Dashboard 허브 완성
- ⏳ 에러 처리 및 UX 개선

### 중기 (Phase 3 이후)
- 향수 이미지 갤러리
- 향수 간 유사도 계산 (벡터 기반)
- 취향 변화 추적/분석
- 공유 기능 (내 취향 프로필 링크)

### 장기
- AI 챗봇 (대화형 추천)
- 소셜 기능 (친구 취향 공유)
- 모바일 앱
- 다국어 지원

자세한 내용은 `roadmap.md` 참고.

---

## 🤝 기여 가이드

1. `.cursor/rules/` 디렉토리의 개발 규칙 숙지 필수
2. `docs/PRD.md`의 서비스 철학 이해
3. 기능 추가 시 `docs/history/` 문서 작성
4. 타입 안정성 유지 (TypeScript strict mode)
5. RLS 정책 준수

---

## 📄 라이선스

MIT License

---

## 📞 문의

프로젝트 관련 문의는 Repository Issues를 이용해주세요.

---

**Last Updated**: 2026-01-30  
**Current Version**: Phase 2 (F4, F5 완료)  
**Build Status**: ✅ Production Ready
