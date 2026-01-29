## 005 - API Routes: Perfume/Preference CRUD 및 권한 경계 확정

### 1) 날짜 및 작업자
- **작업 날짜**: 2026-01-29
- **작업자**: 시니어 개발자 & AI 파트너(Cursor)

### 2) 변경 내용 (What)
- **Perfume CRUD API Routes 구현**
  - `app/api/perfumes/route.ts`: 
    - `GET`: 사용자 소유 향수 목록 조회 (최신순)
    - `POST`: 새 향수 등록 (user_id는 서버에서 주입)
  - `app/api/perfumes/[id]/route.ts`:
    - `GET`: 단일 향수 조회
    - `PATCH`: 향수 수정
    - `DELETE`: 향수 삭제

- **Preference UPSERT API Route 구현**
  - `app/api/preferences/route.ts`:
    - `GET`: 현재 사용자 취향 조회
    - `PUT`: 취향 데이터 UPSERT (user_id 기준 onConflict)

- **공유 헬퍼 모듈 구현**
  - `app/api/_shared/auth.ts`:
    - `requireUser()`: 모든 API에서 세션 확인, 401 반환 또는 user/supabase 반환
    - `ensureProfileRow()`: FK 제약(`user_id → profiles`) 대비 최소 profile row 보장
  - `app/api/_shared/response.ts`:
    - API 응답 헬퍼 (ok/created/badRequest/unauthorized/notFound/serverError)

- **클라이언트 연결**
  - `hooks/use-perfumes.ts`: API 호출 래퍼 (`listPerfumes`, `addPerfume`, `updatePerfume`, `deletePerfume`)
  - `hooks/use-preferences.ts`: API 호출 래퍼 (`getPreferences`, `updatePreferences`)
  - `app/(dashboard)/dashboard/perfumes/page.tsx`: API 목록 조회 연결 (임시 JSON 표시)
  - `app/(dashboard)/dashboard/preferences/page.tsx`: 저장 버튼이 API upsert 호출

- **타입 정의 보강**
  - `types/api.ts`: `PerfumeCreateInput`, `PerfumeUpdateInput`, `PreferenceUpsertInput` 추가

### 3) 구조 확정 이유 (Why)
- **"API Route" 방식 선택 (Server Actions 대비)**
  - 권한 경계가 명확: Route Handler에서 `auth.getUser()` + RLS 이중 보호
  - 책임 분리: 클라이언트(fetch)와 서버(mutation) 역할이 선명
  - 향후 배치/재시도/로깅 운영에 유리 (Step 3~4: 추천 생성/설명 생성 API도 동일 패턴)

- **user_id는 서버에서만 주입**
  - 클라이언트 payload에 user_id를 포함하지 않음
  - Route Handler에서 `auth.getUser().id`로 확정 후 DB에 저장
  - 결과: "다른 사용자 user_id로 저장" 시도를 API 레벨에서 1차 차단 + RLS로 2차 차단

- **profiles 부트스트랩 안정화**
  - `user_perfumes.user_id`, `user_preferences.user_id`가 FK로 `profiles(id)` 참조
  - OAuth 로그인 직후 profiles row가 없으면 FK violation으로 쓰기 실패 가능
  - `ensureProfileRow()`로 mutation 전에 최소 profile(id만) 생성 → 안정성 확보

### 4) API 엔드포인트 설계 (Specification)

#### Perfumes (user_perfumes)
| Method | Path | 역할 | Request Body | Response |
|--------|------|------|--------------|----------|
| GET | `/api/perfumes` | 목록 조회 | - | `{ data: Perfume[] }` |
| POST | `/api/perfumes` | 생성 | `PerfumeCreateInput` | `{ data: Perfume }` (201) |
| GET | `/api/perfumes/:id` | 단건 조회 | - | `{ data: Perfume }` |
| PATCH | `/api/perfumes/:id` | 수정 | `PerfumeUpdateInput` | `{ data: Perfume }` |
| DELETE | `/api/perfumes/:id` | 삭제 | - | `{ data: { id } }` |

**PerfumeCreateInput**
```typescript
{
  name: string;
  brand: string;
  notes_top?: string[];
  notes_middle?: string[];
  notes_base?: string[];
  family: string;
  mood: string;
  usage_context?: string[] | null;
}
```

#### Preferences (user_preferences)
| Method | Path | 역할 | Request Body | Response |
|--------|------|------|--------------|----------|
| GET | `/api/preferences` | 조회 | - | `{ data: Preference \| null }` |
| PUT | `/api/preferences` | UPSERT | `PreferenceUpsertInput` | `{ data: Preference }` |

**PreferenceUpsertInput**
```typescript
{
  preferred_notes?: string[];
  disliked_notes?: string[];
  usage_context?: string[];
}
```

### 5) 권한/보안 정책 (운영 관점)

**서버 측 (API Route)**
1. `requireUser()`로 세션 확인 → 없으면 401
2. `ensureProfileRow()`로 FK 제약 대비 profile 보장
3. DB mutation 시 `user_id`는 `auth.getUser().id`로 주입 (클라이언트 payload 무시)

**DB 측 (RLS)**
- `user_perfumes`: `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE 모두)
- `user_preferences`: `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE 모두)

**결과**: API + RLS 이중 보호로 "다른 사용자 데이터 접근/수정" 원천 차단

### 6) 검증 결과 (Verification)
- `pnpm lint`: 에러 0
- `pnpm build`: 성공
- `pnpm dev`: 로컬 개발 서버 기동 확인
- **API 권한 경계 테스트**: 인증 없이 모든 엔드포인트 호출 시 `401` 반환 확인
  - `GET /api/perfumes` → 401
  - `POST /api/perfumes` → 401
  - `GET/PATCH/DELETE /api/perfumes/:id` → 401
  - `GET/PUT /api/preferences` → 401

### 7) 관련 이슈/에러
- **이슈: Client Component directive 누락**
  - `app/(dashboard)/dashboard/perfumes/page.tsx`에서 `useEffect/useState` 사용하는데 `"use client"` 누락으로 빌드 실패
- **해결**: 페이지 상단에 `"use client"` 추가

### 8) 추가 완료: F1 - 사용자 프로필 조회 (profiles 테이블)
- **작업**: `hooks/use-auth.ts` 확장
- **구현**:
  - `auth.getUser()` 후 `profiles` 테이블 조회 로직 추가
  - `profile` 필드를 hook 반환 타입에 포함
  - `onAuthStateChange` 시마다 profile 재조회
  - Mock 모드에서도 가상 profile 객체 생성
- **UI 연결**: `components/common/Header.tsx`에서 `profile.display_name` 우선 표시 (fallback: email)

### 9) 다음 단계 (Step 3)
- Perfume/Preference UI(폼) 완성 및 실제 create/update/delete 연결
- 에러 처리/로딩 상태/Toast 피드백 추가 (Phase 3 일부 선행)
- Server Component에서 초기 데이터 조회 (SSR 최적화)
