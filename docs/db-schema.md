# 데이터베이스 설계 가이드 (DB Schema)

PRD 데이터 모델링 기반 **PostgreSQL (Supabase)** 테이블 구조 및 RLS 정책 요약.

---

## 1. 설계 원칙

- **사용자 기본 정보**: `auth.users` + `public.profiles` 확장.
- **취향·향수·추천·AI 설명**: 모두 `public` 스키마, RLS로 행 단위 접근 제어.
- **코드 중복 최소화**: `types/database.ts`에서 타입 일원화, Supabase generated types 활용.

---

## 2. ER 개요

```
auth.users (Supabase 관리)
     │
     └── profiles (1:1)
              │
              ├── user_perfumes (1:N)   … 보유 향수
              ├── user_preferences (1:1) … 선호/비선호/사용 상황
              │
              └── recommendation_results (1:N)
                        │
                        └── ai_explanations (1:1) … 설명 텍스트
```

---

## 3. 테이블 정의

### 3.1 `profiles`

`auth.users` 확장. 표시명·아바타 등.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, FK → `auth.users.id` | 동일 ID |
| `display_name` | `text` | | 표시 이름 |
| `avatar_url` | `text` | | 아바타 URL |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### 3.2 `user_perfumes`

사용자별 보유 향수. 노트·계열·분위기·사용 상황 등 메타데이터.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | FK → `profiles.id`, NOT NULL | 소유자 |
| `name` | `text` | NOT NULL | 향수 이름 |
| `brand` | `text` | NOT NULL | 브랜드명 |
| `notes_top` | `text[]` | DEFAULT '{}', NOT NULL | 탑 노트 (첫인상) |
| `notes_middle` | `text[]` | DEFAULT '{}', NOT NULL | 미들 노트 (본향) |
| `notes_base` | `text[]` | DEFAULT '{}', NOT NULL | 베이스 노트 (잔향) |
| `family` | `text` | NOT NULL | 계열 (e.g. Fresh, Woody, Floral) |
| `mood` | `text` | NOT NULL | 분위기 (e.g. Professional, Romantic) |
| `usage_context` | `text[]` | | 사용 상황 (e.g. daily, work, evening) |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

- (Phase 2) `image_url` 등 이미지 필드 추가 가능.

### 3.3 `user_preferences`

사용자당 1행. 선호/비선호 노트·사용 상황.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | FK → `profiles.id`, UNIQUE, NOT NULL | |
| `preferred_notes` | `text[]` | DEFAULT '{}' | 선호 노트 |
| `disliked_notes` | `text[]` | DEFAULT '{}' | 비선호 노트 |
| `usage_context` | `text[]` | DEFAULT '{}' | 사용 상황 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### 3.4 `recommendation_results`

규칙 기반 엔진 결과. 향수별 추천/비추천·점수.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | FK → `profiles.id`, NOT NULL | |
| `user_perfume_id` | `uuid` | FK → `user_perfumes.id`, NOT NULL | 대상 향수 |
| `verdict` | `recommendation_verdict` | ENUM, NOT NULL | 'recommend' or 'not_recommend' |
| `score` | `numeric(6,2)` | NOT NULL | 규칙 엔진 점수 |
| `reasons` | `text[]` | DEFAULT '{}', NOT NULL | 판정 근거 목록 |
| `rule_version` | `text` | DEFAULT 'v1', NOT NULL | 규칙 버전 |
| `input_snapshot` | `jsonb` | DEFAULT '{}', NOT NULL | 입력 데이터 스냅샷 |
| `created_at` | `timestamptz` | DEFAULT now() | 실행 시각 |

**특징:**
- 동일 (user, user_perfume)에 대해 실행 시점별 다수 행 가능 (히스토리 보존)  
  “최신 결과”는 `created_at` DESC로 조회.

### 3.5 `ai_explanations`

추천 결과에 대한 AI 설명. 서비스 자산으로 저장 (PRD).

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `recommendation_result_id` | `uuid` | FK → `recommendation_results.id`, UNIQUE, NOT NULL | |
| `summary_text` | `text` | NOT NULL | 간략 설명 (카드 UI용) |
| `full_text` | `text` | | 상세 설명 (전체 페이지용) |
| `model` | `text` | | 사용된 AI 모델 (e.g. gpt-4) |
| `prompt_version` | `text` | | 프롬프트 버전 (재현성) |
| `created_at` | `timestamptz` | DEFAULT now() | |

---

## 4. RLS (Row Level Security) 정책 요약

모든 `public` 테이블에 **RLS 활성화**.

### 4.1 `profiles`

- **SELECT**: `auth.uid() = id`
- **INSERT**: `auth.uid() = id` (회원가입 시 자기 프로필만)
- **UPDATE**: `auth.uid() = id`

### 4.2 `user_perfumes`

- **SELECT, INSERT, UPDATE, DELETE**: `auth.uid() = user_id`

### 4.3 `user_preferences`

- **SELECT, INSERT, UPDATE, DELETE**: `auth.uid() = user_id`

### 4.4 `recommendation_results`

- **SELECT, INSERT**: `auth.uid() = user_id`  
  (INSERT는 규칙 엔진 실행 후 앱에서 수행)
- **UPDATE, DELETE**: 필요 시에만 `auth.uid() = user_id` (기본은 미허용)

### 4.5 `ai_explanations`

- **SELECT**: `ai_explanations` ↔ `recommendation_results` JOIN 후 `recommendation_results.user_id = auth.uid()`
- **INSERT**: 동일하게 `user_id` 검증 (또는 `recommendation_results` FK + 트리거로 간접 보장)

---

## 5. 인덱스 권장

- `user_perfumes(user_id)`, `user_perfumes(user_id, updated_at DESC)`
- `user_preferences(user_id)` (UNIQUE로 이미 인덱스)
- `recommendation_results(user_id)`, `recommendation_results(user_id, created_at DESC)`
- `ai_explanations(recommendation_result_id)` (UNIQUE로 이미 인덱스)

---

## 6. 마이그레이션·타입 연동

- Supabase **Migration**으로 스키마 생성 후, `supabase gen types typescript`로 `types/database.ts` 생성 권장.
- 프로젝트에서는 `types/database.ts` (및 `api.ts`)만 참조하여 **코드 중복 없이** 타입 일원화.

---

## 7. 참고

- PRD: `PRD.md` § Data Modeling Philosophy  
- 기술 스택: `docs/tech-stack.md`
