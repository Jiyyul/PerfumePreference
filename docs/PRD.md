# Scentory — 향수 취향 분석 및 추천 설명 서비스
Product Requirements Document (PRD)

**작성일**: 2026-01-29  
**버전**: 2.0 (실무 구현 기준)  
**대상**: 개발팀, PM, 디자이너

---

## 1. Service Vision & Problem Definition

### 1.1 해결하려는 문제

기존 향수 추천 서비스는 다음과 같은 한계를 가진다:

- **결과만 제시**: "이 향수가 당신에게 잘 어울려요" 같은 단순 추천만 나열
- **설명 부재**: 왜 추천되었는지, 어떤 점이 내 취향과 맞는지 이해할 수 없음
- **신뢰 부족**: 알고리즘이 무엇을 기준으로 판단했는지 불투명
- **취향 파악 실패**: 사용자 스스로 자신의 취향을 명확히 인식하지 못함

이로 인해 사용자는:
- 추천 결과를 신뢰하지 못하고
- 중복 구매를 반복하며
- 향수 선택에서 항상 불확실성을 경험한다

### 1.2 서비스 핵심 철학

**"향수를 추천하는 것이 아니라, 사용자의 취향을 이해시키는 서비스"**

본 서비스의 목표는:
- 추천 결과보다 **설명 가능성과 납득 가능성**이 우선
- 규칙 기반 로직으로 **일관성과 재현성** 확보
- 생성형 AI는 **판단이 아닌 설명**만 담당
- 사용자가 자신의 취향 구조를 **이해하고 기억**하도록 돕는 것

---

## 2. Target Users & Use Cases

### 2.1 핵심 사용자 유형

#### Persona A: 취향은 있지만 언어화하지 못하는 사용자
- **특징**: 향수에 관심은 있으나 전문 지식 없음
- **현재 상태**: "플로럴은 싫고 머스크는 좋은데…" 수준으로만 표현 가능
- **문제**: 기존 추천 서비스 결과를 신뢰하지 못함
- **변화**: 자신의 취향이 구조화된 언어로 정리되고, 추천 이유를 납득함

#### Persona B: 향수를 많이 보유했지만 정리가 안 된 사용자
- **특징**: 이미 여러 향수 보유
- **현재 상태**: 어떤 향수가 어떤 상황에 어울리는지 혼란스러움
- **문제**: 중복 구매 경험, 보유 향수 간 차이를 모름
- **변화**: 보유 향수의 포지션이 명확해지고, 취향의 범위와 한계를 인지

#### Persona C: 향수 구매 전 확신이 필요한 사용자
- **특징**: 고가의 향수 구매를 망설임
- **현재 상태**: 온라인 후기만으로는 판단 어려움
- **문제**: 구매 후 후회 경험
- **변화**: 자신의 취향과 맞는지 논리적으로 판단 가능

### 2.2 Use Cases

1. **첫 향수 구매 전**: 자신의 취향을 먼저 파악하고 싶을 때
2. **보유 향수 정리**: 가지고 있는 향수들의 특성을 정리하고 싶을 때
3. **신규 향수 탐색**: 새로운 향수가 내 취향과 맞는지 확인하고 싶을 때
4. **선물 고민**: 상대방의 취향을 분석하여 선물하고 싶을 때

---

## 3. Core User Flow (상태 기반)

### 3.1 사용자 상태 정의

사용자 경험은 다음 두 축으로 구분된다:

**인증 상태**
- `미인증`: 로그인하지 않은 상태
- `인증됨`: Google OAuth 로그인 완료

**데이터 상태**
- `프로필 없음`: 첫 로그인 직후 (profiles 자동 생성되지만 실질적 데이터 없음)
- `취향 없음`: 프로필은 있으나 `user_preferences` 미입력
- `향수 없음`: 취향은 있으나 `user_perfumes` 미등록
- `데이터 완료`: 취향 + 향수 1개 이상 등록
- `추천 생성됨`: `recommendation_results` 존재

### 3.2 상태별 사용자 흐름

#### 상태 1: 미인증 → Landing Page
- **화면**: `/` (랜딩 페이지)
- **표시 내용**:
  - 서비스 소개: "향수 추천이 아니라 취향 설명"
  - Google 로그인 버튼
  - 서비스 핵심 가치 간단 설명
- **사용자 액션**: "Google로 로그인" 클릭
- **다음 상태**: Google OAuth → `/callback` → `/dashboard` (인증됨)

#### 상태 2: 인증됨 + 데이터 없음 → Dashboard (온보딩 모드)
- **화면**: `/dashboard`
- **표시 내용**:
  - 환영 메시지
  - "시작하기" 안내: 취향 입력 → 향수 등록 순서 안내
  - 각 단계 상태 표시 (미완료 상태)
- **사용자 액션**:
  - "취향 입력하기" → `/dashboard/preferences`
  - "향수 등록하기" → `/dashboard/perfumes`
- **다음 상태**: 취향 입력 또는 향수 등록

#### 상태 3: 취향 입력 중 → Preferences Page
- **화면**: `/dashboard/preferences`
- **표시 내용**:
  - 선호 노트 선택 (체크박스/칩 UI)
  - 비선호 노트 선택
  - 사용 상황 입력 (출근, 데이트, 휴식 등)
  - 추가 정보 입력 (선택)
- **사용자 액션**: 
  - 노트 선택 → 실시간 선택 상태 반영
  - "저장" 클릭
- **시스템 동작**:
  - `POST /api/preferences` 호출
  - `user_preferences` 테이블 UPSERT
  - 성공 시 저장 완료 안내
- **다음 화면**: `/dashboard` (저장 후 자동 이동)
- **실패 처리**:
  - 네트워크 오류: 재시도 버튼 표시
  - 인증 만료: `/login`으로 리다이렉트
  - 필수 항목 누락: 인라인 경고 메시지

#### 상태 4: 향수 등록 → Perfumes Page
- **화면**: `/dashboard/perfumes`
- **표시 내용**:
  - 등록된 향수 목록 (없으면 빈 상태 안내)
  - "향수 추가" 버튼
- **사용자 액션**: 
  - "향수 추가" 클릭 → `/dashboard/perfumes/new`
  - 기존 향수 클릭 → `/dashboard/perfumes/[id]`
- **빈 상태**: "아직 등록된 향수가 없습니다" + 추가 유도 버튼

#### 상태 5: 향수 상세 입력 → Perfume Form
- **화면**: `/dashboard/perfumes/new` 또는 `/dashboard/perfumes/[id]/edit`
- **표시 내용**:
  - 향수명 입력
  - 브랜드 입력
  - 탑 노트 선택 (다중 선택)
  - 미들 노트 선택
  - 베이스 노트 선택
  - 계열 선택 (플로럴, 우디, 시트러스 등)
  - 분위기 선택 (산뜻한, 무거운 등)
- **사용자 액션**:
  - 폼 작성 → "저장" 클릭
- **시스템 동작**:
  - `POST /api/perfumes` 또는 `PATCH /api/perfumes/[id]`
  - `user_perfumes` 테이블 INSERT/UPDATE
  - 성공 시 향수 목록으로 이동
- **다음 화면**: `/dashboard/perfumes` (저장 후)
- **실패 처리**:
  - 필수 항목(name, brand) 누락: 인라인 에러
  - 중복 향수명: 경고 + 계속 진행 여부 확인

#### 상태 6: 데이터 완료 → 추천 생성 가능
- **화면**: `/dashboard/recommendations`
- **표시 내용** (추천 결과 없을 때):
  - "추천 생성하기" 버튼
  - 필요한 데이터 상태 확인 메시지
    - 취향 입력 완료: ✅
    - 향수 등록 완료: ✅
- **사용자 액션**: "추천 생성하기" 클릭
- **시스템 동작**:
  - `POST /api/recommendations/generate` 호출
  - 규칙 엔진이 등록된 모든 향수에 대해 추천/비추천 판단
  - `recommendation_results` 테이블 배치 INSERT
  - 로딩 상태 표시 (스피너)
- **다음 상태**: 추천 결과 표시
- **실패 처리**:
  - 데이터 부족 (취향 또는 향수 없음): 해당 페이지로 이동 유도
  - 서버 오류: 재시도 버튼

#### 상태 7: 추천 결과 확인 → Recommendation Result
- **화면**: `/dashboard/recommendations`
- **표시 내용**:
  - 추천 결과 카드 목록
    - 향수 정보 (이름, 브랜드)
    - 추천/비추천 판정 (verdict)
    - 점수 (score)
    - 규칙 기반 이유 (reasons 배열)
  - AI 설명 보기 버튼 (각 카드마다)
- **사용자 액션**: "AI 설명 보기" 클릭
- **시스템 동작**:
  - AI 설명이 이미 있으면: 즉시 표시
  - AI 설명이 없으면:
    - `POST /api/recommendations/[id]/explain` 호출 (구현 예정)
    - AI API로 설명 생성 요청
    - `ai_explanations` 테이블 저장
    - 설명 UI 표시
- **AI 설명 표시 형식**:
  - 요약 (summary): 1-2문장
  - 상세 설명 (full_explanation): 취향과 향수 노트 간 관계 자연어 설명
  - 톤: 친절하지만 논리적, 확률적 표현 금지

#### 상태 8: Dashboard 허브 → 모든 데이터 존재
- **화면**: `/dashboard`
- **표시 내용**:
  - 내 프로필 요약
  - 등록된 향수 개수
  - 취향 입력 상태
  - 추천 결과 상태
  - 각 섹션으로 바로가기 카드
- **사용자 액션**:
  - "내 향수 관리" → `/dashboard/perfumes`
  - "취향 수정" → `/dashboard/preferences`
  - "추천 결과 보기" → `/dashboard/recommendations`

### 3.3 Navigation Rules 정리

| 액션 | 시작 페이지 | 종료 페이지 | 조건 |
|------|------------|------------|------|
| 로그인 | `/login` | `/dashboard` | OAuth 성공 |
| 로그아웃 | 어디서든 | `/` | - |
| 취향 저장 | `/dashboard/preferences` | `/dashboard` | 저장 성공 |
| 향수 저장 | `/dashboard/perfumes/new` | `/dashboard/perfumes` | 저장 성공 |
| 향수 수정 | `/dashboard/perfumes/[id]/edit` | `/dashboard/perfumes` | 저장 성공 |
| 추천 생성 | `/dashboard/recommendations` | 동일 페이지 (갱신) | 생성 성공 |

---

## 4. Core Features (MVP 기준)

### 4.1 F1: Google OAuth 인증

#### 목적
- 사용자별 데이터 격리 (RLS 기반)
- 간편한 로그인 경험 제공

#### 사용자 액션
1. 랜딩 페이지에서 "Google로 로그인" 클릭
2. Google consent 화면에서 권한 승인
3. 자동으로 서비스 복귀

#### 시스템 동작
1. `supabase.auth.signInWithOAuth({ provider: 'google' })` 호출
2. Google OAuth 화면으로 리다이렉트
3. 승인 후 `/callback` 라우트로 code 반환
4. `exchangeCodeForSession`으로 세션 확립
5. `auth.users` 테이블에 사용자 생성 (Supabase 자동)
6. DB 트리거로 `public.profiles` 자동 생성
7. `/dashboard`로 리다이렉트

#### 실패/예외 처리
- **Google 승인 거부**: 랜딩 페이지로 복귀, 에러 메시지 표시
- **Callback 오류**: "로그인에 실패했습니다. 다시 시도해주세요" 안내
- **중복 계정**: Supabase가 자동 처리 (이메일 기준 병합)

#### 관련 파일
- `app/(auth)/login/page.tsx`
- `app/auth/callback/route.ts`
- `hooks/use-auth.ts`
- `middleware.ts` (라우트 가드)

---

### 4.2 F2: 취향 입력 및 저장

#### 목적
- 사용자의 선호/비선호 노트를 구조화
- 추천 로직의 입력 데이터 확보

#### 사용자 액션
1. `/dashboard/preferences` 진입
2. 선호 노트 선택 (다중)
3. 비선호 노트 선택 (다중)
4. 사용 상황 선택 (출근, 데이트, 휴식 등)
5. "저장" 버튼 클릭

#### 시스템 동작
1. `POST /api/preferences` API 호출
2. `user_preferences` 테이블 UPSERT
   - 기존 데이터 있으면 UPDATE
   - 없으면 INSERT
3. RLS로 `auth.uid()` 기반 권한 검증
4. 저장 성공 응답
5. Dashboard로 리다이렉트

#### 데이터 구조 (`user_preferences`)
```typescript
{
  id: uuid (PK, FK to auth.users)
  preferred_notes: string[] (예: ['rose', 'vanilla', 'musk'])
  disliked_notes: string[] (예: ['patchouli', 'oud'])
  usage_contexts: string[] (예: ['work', 'date', 'casual'])
  additional_info: jsonb (자유 형식 추가 정보)
  updated_at: timestamp
}
```

#### 실패/예외 처리
- **미인증 상태**: Middleware가 `/login`으로 리다이렉트
- **빈 폼 제출**: "최소 1개 이상의 선호 노트를 선택해주세요" 경고
- **네트워크 오류**: "저장에 실패했습니다" 토스트 + 재시도 버튼

#### 관련 파일
- `app/(dashboard)/dashboard/preferences/page.tsx`
- `app/api/preferences/route.ts`
- `hooks/use-preferences.ts`
- `components/domain/preference/PreferenceForm.tsx`

---

### 4.3 F3: 향수 등록 및 관리

#### 목적
- 보유 향수를 노트/계열/분위기 기준으로 구조화
- 추천 대상 데이터 확보

#### 사용자 액션
1. `/dashboard/perfumes` 진입
2. "향수 추가" 클릭 → `/dashboard/perfumes/new`
3. 향수 정보 입력:
   - 이름 (필수)
   - 브랜드 (필수)
   - 탑/미들/베이스 노트 (선택)
   - 계열 (선택)
   - 분위기 (선택)
4. "저장" 클릭

#### 시스템 동작
1. `POST /api/perfumes` 호출
2. `user_perfumes` 테이블 INSERT
3. RLS로 사용자 권한 검증
4. 저장 성공 시 향수 목록으로 이동

#### 데이터 구조 (`user_perfumes`)
```typescript
{
  id: uuid (PK)
  user_id: uuid (FK to auth.users)
  name: string
  brand: string
  top_notes: string[]
  middle_notes: string[]
  base_notes: string[]
  family: string (예: 'floral', 'woody', 'citrus')
  mood: string (예: 'fresh', 'warm', 'sensual')
  created_at: timestamp
}
```

#### 추가 기능 (MVP 범위)
- **향수 수정**: `/dashboard/perfumes/[id]/edit` → `PATCH /api/perfumes/[id]`
- **향수 삭제**: 향수 상세 페이지에서 "삭제" → `DELETE /api/perfumes/[id]`
- **향수 목록 조회**: `GET /api/perfumes` (본인 향수만)

#### 실패/예외 처리
- **필수 항목 누락**: 인라인 에러 메시지 (name, brand)
- **중복 등록**: 경고 표시하되 저장 허용 (동일 향수 여러 개 보유 가능)
- **삭제 시 추천 결과 존재**: "이 향수에 대한 추천 결과가 삭제됩니다" 확인 다이얼로그

#### 관련 파일
- `app/(dashboard)/dashboard/perfumes/page.tsx`
- `app/(dashboard)/dashboard/perfumes/new/page.tsx`
- `app/(dashboard)/dashboard/perfumes/[id]/edit/page.tsx`
- `app/api/perfumes/route.ts`
- `app/api/perfumes/[id]/route.ts`
- `hooks/use-perfumes.ts`
- `components/domain/perfume/PerfumeForm.tsx`

---

### 4.4 F4: 규칙 기반 추천 생성

#### 목적
- 사용자 취향과 향수 노트를 비교하여 추천/비추천 판정
- AI가 아닌 **규칙 로직**으로 결정을 내림
- 일관성과 재현성 확보

#### 사용자 액션
1. `/dashboard/recommendations` 진입
2. "추천 생성하기" 버튼 클릭
3. 로딩 대기 (1-5초)
4. 결과 확인

#### 시스템 동작

**API 흐름** (`POST /api/recommendations/generate`)
1. 사용자 인증 확인 (`requireUser`)
2. `user_preferences` 조회
3. `user_perfumes` 전체 조회
4. 각 향수에 대해 `recommendation-engine.ts` 실행:
   - 선호 노트 매칭 점수 계산
   - 비선호 노트 페널티 계산
   - 총점 기준 verdict 결정 (recommended / not_recommended)
   - 판정 이유 생성 (reasons 배열)
5. `recommendation_results` 테이블에 배치 저장
6. 결과 반환

**규칙 로직 예시** (`lib/recommendation-engine.ts`)
```typescript
// 점수 계산
preferredMatchScore = 향수의 노트 중 선호 노트와 겹치는 개수 * 10
dislikedPenalty = 향수의 노트 중 비선호 노트와 겹치는 개수 * -15
totalScore = preferredMatchScore + dislikedPenalty

// 판정
if (totalScore >= 20) → verdict = 'recommended'
else if (totalScore <= -10) → verdict = 'not_recommended'
else → verdict = 'neutral'
```

#### 데이터 구조 (`recommendation_results`)
```typescript
{
  id: uuid (PK)
  user_id: uuid (FK to auth.users)
  perfume_id: uuid (FK to user_perfumes)
  verdict: 'recommended' | 'not_recommended' | 'neutral'
  score: number
  reasons: string[] (예: ['선호 노트 rose 포함', '비선호 노트 oud 포함'])
  input_snapshot: jsonb (추천 생성 당시 취향 데이터 스냅샷)
  created_at: timestamp
}
```

#### 실패/예외 처리
- **취향 미입력**: "취향을 먼저 입력해주세요" → `/dashboard/preferences` 이동 유도
- **향수 미등록**: "등록된 향수가 없습니다" → `/dashboard/perfumes` 이동 유도
- **이미 추천 결과 존재**: 기존 결과 삭제 후 재생성 (확인 다이얼로그)
- **서버 오류**: "추천 생성에 실패했습니다" 토스트 + 재시도

#### 관련 파일
- `app/api/recommendations/generate/route.ts`
- `lib/recommendation-engine.ts`
- `hooks/use-recommendations.ts`
- `components/recommendation/GenerateRecommendationsButton.tsx`

---

### 4.5 F5: AI 기반 추천 설명 생성

#### 목적
- 규칙 로직이 내린 판정을 **사용자가 이해할 수 있는 자연어로 설명**
- AI는 판단하지 않고 **설명만** 담당

#### 사용자 액션
1. 추천 결과 카드에서 "AI 설명 보기" 클릭
2. 설명 생성 대기 (2-10초, 첫 생성 시)
3. 설명 읽기

#### 시스템 동작

**API 흐름** (`POST /api/recommendations/[id]/explain`, 구현 예정)
1. `recommendation_results`에서 해당 추천 결과 조회
2. AI 설명이 이미 존재하면 즉시 반환
3. 존재하지 않으면:
   - 사용자 취향 요약 생성
   - 향수 노트 정보 조회
   - AI API 호출 (예: OpenAI GPT-4)
     - 입력: 취향 요약 + 향수 노트 + verdict + reasons
     - 출력: summary (1-2문장) + full_explanation (3-5문장)
   - `ai_explanations` 테이블 저장
   - 결과 반환

**AI 프롬프트 구조 예시**
```
사용자 취향:
- 선호 노트: rose, vanilla, musk
- 비선호 노트: patchouli, oud
- 사용 상황: 데이트, 휴식

향수 정보:
- 이름: Chanel No.5
- 노트: rose, jasmine, ylang-ylang, vanilla, sandalwood

추천 판정: recommended
이유:
- 선호 노트 rose, vanilla 포함
- 비선호 노트 없음
- 총점: 20

위 정보를 바탕으로 사용자에게 이 향수가 왜 추천되었는지 설명하세요.
- 요약: 1-2문장
- 상세 설명: 3-5문장
- 톤: 친절하지만 논리적
- 금지 표현: "아마도", "~일 것 같아요", "추천드려요" (이미 판정됨)
```

#### 데이터 구조 (`ai_explanations`)
```typescript
{
  id: uuid (PK)
  recommendation_id: uuid (FK to recommendation_results)
  summary: string (1-2문장 요약)
  full_explanation: string (3-5문장 상세 설명)
  model_version: string (예: 'gpt-4o-2024-05-13')
  created_at: timestamp
}
```

#### 실패/예외 처리
- **AI API 오류**: "설명 생성에 실패했습니다" 토스트 + 재시도
- **타임아웃**: 30초 이상 소요 시 "시간이 오래 걸리고 있습니다" 안내
- **토큰 부족**: 입력 데이터 축약 후 재시도
- **부적절한 응답**: 필터링 후 "설명을 생성할 수 없습니다" 표시

#### AI 설명 톤 & 규칙
- ✅ **허용**: "선호하시는 rose와 vanilla가 모두 포함되어 있습니다"
- ✅ **허용**: "비선호 노트인 oud가 포함되어 있어 맞지 않을 수 있습니다"
- ❌ **금지**: "이 향수가 당신에게 잘 어울릴 것 같아요"
- ❌ **금지**: "추천드립니다"
- ❌ **금지**: "아마도 좋아하실 거예요"

#### 관련 파일
- `app/api/recommendations/[id]/explain/route.ts` (구현 예정)
- `lib/ai-explanation.ts`
- `components/recommendation/AIExplanationBlock.tsx`
- `components/domain/recommendation/AIExplanationView.tsx`

---

### 4.6 F6: Dashboard 허브

#### 목적
- 서비스 진입점 역할
- 사용자 상태에 따른 다음 행동 안내
- 전체 기능으로의 네비게이션

#### 사용자 액션
1. 로그인 후 자동 진입
2. 각 섹션 카드 클릭하여 상세 페이지 이동

#### 표시 내용

**데이터 없음 상태**
- 환영 메시지: "Scentory에 오신 것을 환영합니다"
- 안내: "취향을 입력하고 향수를 등록하여 시작하세요"
- CTA: "취향 입력하기" → `/dashboard/preferences`

**취향 있음, 향수 없음**
- "취향 입력 완료 ✅"
- "향수를 등록하여 추천을 받아보세요"
- CTA: "향수 등록하기" → `/dashboard/perfumes`

**데이터 완료**
- 요약 카드:
  - 등록된 향수: N개
  - 취향 상태: 완료
  - 추천 결과: M개
- 바로가기 카드:
  - 내 향수 → `/dashboard/perfumes`
  - 취향 수정 → `/dashboard/preferences`
  - 추천 결과 → `/dashboard/recommendations`

#### 관련 파일
- `app/(dashboard)/dashboard/page.tsx`

---

## 5. Navigation & UX Rules

### 5.1 저장 후 이동 규칙

| 기능 | 저장 완료 후 이동 | 이유 |
|------|------------------|------|
| 취향 입력 | `/dashboard` | 다음 단계(향수 등록) 유도 |
| 향수 추가 | `/dashboard/perfumes` | 추가한 향수 확인 |
| 향수 수정 | `/dashboard/perfumes` | 목록에서 변경 확인 |
| 추천 생성 | 동일 페이지 (갱신) | 결과 즉시 확인 |

### 5.2 로그아웃 규칙

- **로그아웃 버튼 위치**: Header 우측 (UserMenu 내)
- **로그아웃 후 이동**: `/` (랜딩 페이지)
- **세션 정리**: Supabase `signOut()` 호출 → 쿠키 삭제

### 5.3 뒤로가기 UX

- **브라우저 뒤로가기**: 자연스럽게 이전 페이지로 (히스토리 기반)
- **명시적 취소 버튼**: 
  - 향수 등록/수정 폼: "취소" → `/dashboard/perfumes`
  - 취향 입력 폼: "취소" → `/dashboard`

### 5.4 Dashboard의 역할 정의

- **진입 허브**: 로그인 후 첫 화면
- **상태 표시**: 사용자의 현재 데이터 상태 요약
- **다음 행동 안내**: 데이터 상태에 따른 CTA 제공
- **네비게이션 중심**: 모든 주요 기능으로의 링크 제공
- **❌ 금지**: Dashboard에서 추천 결과를 직접 표시하지 않음 (별도 페이지)

### 5.5 인증 가드 (Middleware)

- **보호 경로**: `/dashboard/*` 전체
- **미인증 시**: `/login`으로 리다이렉트
- **이미 인증된 상태에서 `/login` 접근**: `/dashboard`로 리다이렉트

### 5.6 데이터 상태 가드 (페이지 레벨)

- **추천 생성 시 필수 조건**:
  - `user_preferences` 존재
  - `user_perfumes` 1개 이상
  - 조건 미충족 시: 해당 입력 페이지로 유도 (에러 아님)

---

## 6. Data & System Design (High-level)

### 6.1 핵심 엔티티

#### 6.1.1 User (Supabase Auth)
- **역할**: 인증 및 사용자 식별
- **관리**: Supabase Auth (`auth.users`)
- **확장**: `public.profiles` (1:1 관계, DB 트리거로 자동 생성)

#### 6.1.2 User Preferences
- **역할**: 사용자 취향 저장
- **테이블**: `user_preferences`
- **관계**: User 1:1 Preference
- **왜 필요한가**: 추천 로직의 입력 데이터, 사용자 취향 기억

#### 6.1.3 User Perfumes
- **역할**: 보유 향수 정보 저장
- **테이블**: `user_perfumes`
- **관계**: User 1:N Perfumes
- **왜 필요한가**: 추천 대상 데이터, 향수 관리

#### 6.1.4 Recommendation Results
- **역할**: 규칙 엔진의 추천 판정 저장
- **테이블**: `recommendation_results`
- **관계**: 
  - User 1:N Results
  - Perfume 1:N Results (같은 향수에 대해 여러 추천 기록 가능)
- **왜 필요한가**: 
  - 추천 판정 이력 보존
  - AI 설명의 근거 데이터
  - 취향 변화 추적

#### 6.1.5 AI Explanations
- **역할**: AI가 생성한 설명 저장
- **테이블**: `ai_explanations`
- **관계**: Recommendation Result 1:1 Explanation
- **왜 필요한가**: 
  - **서비스 자산**으로 취급 (캐시 아님)
  - 동일 추천에 대해 매번 AI 호출 방지 (비용 절감)
  - 설명 품질 관리 및 개선 기준 데이터

### 6.2 데이터 흐름 요약

```
User (Auth)
  ↓ (1:1)
Profiles (자동 생성)
  ↓
  ├─ (1:1) → User Preferences
  └─ (1:N) → User Perfumes
             ↓
          (규칙 엔진 실행)
             ↓
      Recommendation Results (N개)
             ↓
          (AI 설명 생성)
             ↓
        AI Explanations (N개)
```

### 6.3 RLS (Row Level Security) 원칙

- **모든 테이블에 RLS 활성화**
- **기본 정책**: `user_id = auth.uid()`로 본인 데이터만 접근
- **이중 보호**: API Route에서도 `requireUser()` 검증

### 6.4 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **AI**: OpenAI GPT-4 API (또는 유사 모델)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

---

## 7. Non-goals & Out of Scope (MVP)

본 단계에서 **하지 않는 것**:

### 7.1 Phase 1에서 제외

- **향수 이미지 갤러리**: 시각적 탐색 기능 (Phase 2)
- **향수 간 유사도 계산**: 벡터 기반 추천 (Phase 2)
- **소셜 기능**: 친구와 취향 공유, 댓글, 좋아요
- **결제/구매 연동**: 커머스 기능
- **향수 데이터베이스 자동 입력**: 사용자가 직접 입력
- **모바일 앱**: 웹 반응형으로 대응
- **다국어 지원**: 한국어만
- **취향 변화 추적/분석**: 이력 기능 (향후 고려)
- **AI 챗봇**: 대화형 추천 (Phase 2 이후)

### 7.2 의도적으로 단순화한 부분

- **향수 노트 입력**: 자유 입력 (자동완성 없음, Phase 2에서 개선)
- **추천 알고리즘**: 단순 점수 기반 (머신러닝 없음)
- **AI 설명 개인화**: 모든 사용자에게 동일 톤 (A/B 테스트 없음)

---

## 8. Success Criteria

### 8.1 기능 완성 기준

각 기능은 다음 조건을 만족해야 "완성"으로 간주한다:

#### F1 (인증)
- [ ] Google 로그인 → `/dashboard` 진입 성공
- [ ] 로그아웃 → 랜딩 페이지 복귀
- [ ] 미인증 상태에서 `/dashboard` 접근 → `/login` 리다이렉트
- [ ] 프로필 자동 생성 확인 (`profiles` 테이블)

#### F2 (취향 입력)
- [ ] 선호/비선호 노트 선택 후 저장 성공
- [ ] 저장 후 Dashboard에서 "취향 입력 완료" 표시
- [ ] 다시 입력 시 기존 값 불러오기 (UPSERT)

#### F3 (향수 관리)
- [ ] 향수 추가 → 목록에 표시
- [ ] 향수 수정 → 변경 사항 반영
- [ ] 향수 삭제 → 목록에서 제거
- [ ] 빈 상태일 때 안내 메시지 표시

#### F4 (추천 생성)
- [ ] "추천 생성하기" 클릭 → 로딩 → 결과 표시
- [ ] 각 향수마다 verdict, score, reasons 표시
- [ ] 취향/향수 없을 때 안내 메시지

#### F5 (AI 설명)
- [ ] "AI 설명 보기" 클릭 → 설명 표시
- [ ] Summary + Full Explanation 구분 표시
- [ ] 동일 추천에 대해 재클릭 시 즉시 표시 (캐싱)
- [ ] AI 오류 시 재시도 가능

#### F6 (Dashboard)
- [ ] 데이터 상태별로 적절한 안내 표시
- [ ] 모든 주요 기능으로 링크 제공

### 8.2 UX 성공 조건

사용자 관점에서 다음을 만족해야 한다:

- **명확성**: 각 화면에서 "지금 무엇을 해야 하는지" 즉시 이해 가능
- **신뢰성**: 추천 결과에 대해 "왜 이렇게 판정되었는지" 설명 제공
- **일관성**: 동일 입력 → 동일 추천 결과 (규칙 로직)
- **피드백**: 모든 액션(저장, 생성 등)에 대한 명확한 응답 (성공/실패)
- **복구 가능성**: 오류 발생 시 재시도 또는 이전 단계 복귀 가능

### 8.3 기술 성공 지표

- **빌드 성공**: `pnpm build` 오류 없이 완료
- **타입 안정성**: TypeScript 에러 0개
- **RLS 검증**: 다른 사용자 데이터 접근 차단 확인
- **로딩 성능**: 
  - 추천 생성: 5초 이내
  - AI 설명 생성: 10초 이내
  - 페이지 전환: 1초 이내

---

## 9. 부록: 용어 정리

| 용어 | 의미 | 예시 |
|------|------|------|
| 노트 (Note) | 향수의 향 성분 | rose, vanilla, musk |
| 계열 (Family) | 향수의 대분류 | floral, woody, oriental, fresh |
| 분위기 (Mood) | 향수의 느낌 | fresh, warm, sensual, elegant |
| 탑/미들/베이스 | 향수의 시간대별 향 | top: 첫인상, middle: 중심, base: 잔향 |
| Verdict | 추천 판정 | recommended, not_recommended, neutral |
| RLS | Row Level Security | PostgreSQL의 행 단위 보안 정책 |
| UPSERT | Update + Insert | 있으면 수정, 없으면 생성 |

---

## 10. 다음 단계 (Phase 2 Preview)

Phase 1 완료 후 검토할 기능:

1. **향수 이미지 갤러리**: 시각적 탐색 경험
2. **향수 간 유사도**: "이 향수와 비슷한 향수" 추천
3. **취향 변화 추적**: 시간에 따른 취향 이력 분석
4. **공유 기능**: 내 취향 프로필 공유 링크
5. **향수 DB 자동완성**: 자주 사용되는 향수 데이터베이스 연동

---

**문서 끝**
