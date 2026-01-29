
```markdown
# Perfume AI
향수를 구조화된 데이터로 분석하고, AI가 추천 결과를 설명해주는 웹 기반 향수 정리·추천 서비스

🚀 **기술 스택**
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** OpenAI / Google Gemini API

📁 **프로젝트 구조**
```

perfume-ai/
├── app/                     # Next.js App Router
│   ├── (auth)/              # 인증 관련 라우트
│   ├── (dashboard)/         # 대시보드 라우트
│   ├── (perfume)/           # 향수 목록 및 추천 라우트
│   └── api/                 # API Routes
├── components/
│   ├── ui/                  # shadcn/ui 공유 컴포넌트
│   └── domain/              # 도메인별 비즈니스 컴포넌트
├── lib/                     # 유틸리티 및 라이브러리
│   ├── supabase/            # Supabase 클라이언트
│   ├── ai/                  # AI 연동
│   └── utils/               # 유틸리티 함수
├── hooks/                   # 커스텀 훅
├── types/                   # TypeScript 타입 정의
└── docs/                    # 문서
├── tech-stack.md        # 기술 명세서
└── db-schema.md         # 데이터베이스 설계 가이드

````

🛠️ **시작하기**
1. **의존성 설치**
```bash
pnpm install
````

2. **환경 변수 설정**
   `.env.local.example`을 참고하여 `.env.local` 파일 생성 후 다음 변수 설정:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

3. **Supabase 설정**

* 새 프로젝트 생성
* `docs/db-schema.md` 참고하여 데이터베이스 스키마 생성
* Google OAuth 제공자 설정 (인증 > 제공자 > Google)

4. **개발 서버 실행**

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 확인

📚 **문서**

* 기술 스택 명세서 (`docs/tech-stack.md`)
* 데이터베이스 설계 가이드 (`docs/db-schema.md`)
* PRD, FLOW (팀 내부 공유 문서)

🏗️ **개발 가이드**

* **컴포넌트 추가**

  * 공유 UI 컴포넌트: `components/ui/`
  * 도메인 컴포넌트: `components/domain/`
* **타입 생성**

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

* **코드 스타일**

  * 파일: kebab-case
  * 컴포넌트: PascalCase
  * 함수/변수: camelCase

📝 **Phase 1 구현 목표**

* 프로젝트 구조 설계
* Supabase 인증 (Google OAuth)
* 사용자 프로필 관리 (향수 취향 등록/수정)
* 향수 CRUD 및 AI 분석/추천
* 대시보드 (추천 결과, 통계 카드, 최근 향수)
* 상세 향수 페이지 (향수 특징, AI 설명)

🔒 **보안**

* Row Level Security (RLS) 정책으로 데이터 접근 제어
* 환경 변수로 민감 정보 관리
* 서버 사이드 세션 검증

📄 **라이선스**
MIT

```

이거 그대로 `README.md`에 덮어쓰면 바로 적용됩니다.  

원하면 제가 여기서 **조금 더 보기 좋게 이미지/아이콘 참고 포함한 버전**으로도 만들어 드릴 수 있어요.  
혹시 그 버전도 원하시나요?
```
