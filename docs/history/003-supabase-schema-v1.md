## 003 - Supabase schema v1 (UI-driven DB 설계 반영)

### 1) 날짜 및 작업자
- **작업 날짜**: 2026-01-29
- **작업자**: 시니어 개발자 & AI 파트너(Cursor)

### 2) 변경 내용
- **Supabase 초기 스키마(v1) 마이그레이션 추가**
  - 경로: `supabase/migrations/20260129_000001_schema_v1.sql`
  - 포함: 테이블/제약조건/인덱스/updated_at 트리거 + RLS 정책
- **DB 타입 정의 갱신**
  - 경로: `types/database.ts`
  - UI에서 실제로 렌더링되는 필드(예: `brand`, 구조화 노트, 설명 summary/full)에 맞춰 컬럼/타입 반영

### 3) 변경 이유
- **UI 렌더링 필드 정합성 확보**
  - 카드/상세 화면에서 `brand` 및 `notes.top/middle/base` 구조가 필수인데, 기존 DB 타입은 `brand`가 없고 `notes`가 flat 배열이라 불일치가 발생
- **AI 설명을 서비스 자산으로 영속 저장**
  - PRD 원칙에 따라 추천 결과와 AI 설명은 재사용/감사 가능하도록 저장
  - UI가 사용하는 `aiExplanation(요약)` + `fullExplanation(상세)` 2단 구조를 DB에 반영
- **재현성(동일 입력 → 동일 결과) 대비**
  - 추천 결과에 `rule_version`, `input_snapshot`를 포함해 룰 변경/버전업 시 호환성과 추적성을 확보

### 4) 관련 이슈/에러
- **스키마/타입 불일치 리스크**
  - `types/database.ts`의 `user_perfumes.notes: string[]` ↔ UI의 `notes.top/middle/base`
  - `user_perfumes`에 `brand` 누락
  - `ai_explanations.explanation_text` 단일 필드 ↔ UI의 요약/상세 분리 필요

