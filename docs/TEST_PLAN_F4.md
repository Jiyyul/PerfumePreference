# F4 테스트 플랜 - 규칙 기반 추천 엔진

작성일: 2026-01-29  
대상: Phase 2 - F4 (규칙 기반 추천 엔진 및 저장)

---

## 1. 테스트 목표

- 규칙 기반 추천 엔진이 올바르게 점수를 계산하는지 검증
- API 엔드포인트가 정상적으로 동작하는지 검증
- UI에서 추천 결과가 올바르게 표시되는지 검증
- Database 스키마와 타입 호환성 검증

---

## 2. 환경 준비

### 2.1 필수 환경 변수
`.env.local` 파일에 다음 환경 변수가 설정되어 있어야 합니다:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2.2 데이터베이스 마이그레이션
Supabase Dashboard에서 다음 마이그레이션이 적용되어 있어야 합니다:
- `supabase/migrations/20260129_000001_schema_v1.sql`

### 2.3 시드 데이터 (선택)
테스트용 샘플 데이터를 삽입하려면:
- `docs/seed_data.sql` 실행 (Supabase Dashboard → SQL Editor, service_role 권한)

---

## 3. 단위 테스트 - 규칙 엔진

### 3.1 테스트 파일 실행
```bash
# TypeScript 직접 실행 (ts-node 필요)
npx ts-node lib/recommendation-engine.test.ts
```

### 3.2 예상 결과
```
=== Test Case 1: Strong Recommendation ===
Verdict: recommend
Score: 65
Pass: ✅

=== Test Case 2: Not Recommended (Disliked Notes) ===
Verdict: not_recommend
Score: -40
Pass: ✅

=== Test Case 3: Borderline Case ===
Verdict: recommend
Score: 65
Pass: ✅

=== Test Case 4: No Matching Notes ===
Verdict: not_recommend
Score: 0
Pass: ✅

=== Test Case 5: Case-Insensitive Matching ===
Verdict: recommend
Score: 65
Pass: ✅
```

### 3.3 규칙 검증

| 규칙 | 가중치 | 검증 방법 |
|-----|-------|---------|
| 선호 노트 매칭 | +20점/노트 | Test Case 1, 3, 5 |
| 비선호 노트 감지 | -30점/노트 | Test Case 2 |
| 사용 상황 일치 | +10점 | Test Case 1, 3 |
| 계열(family) 매칭 | +15점 | Test Case 1, 3 |
| 판정 기준 | ≥50점=추천 | 모든 케이스 |

---

## 4. API 테스트

### 4.1 추천 생성 API
**Endpoint:** `POST /api/recommendations/generate`

**준비 조건:**
1. Supabase Google OAuth로 로그인
2. 취향 데이터 설정 (`/dashboard/preferences`)
3. 최소 1개 향수 등록 (`/dashboard/perfumes/new`)

**테스트 시나리오:**

#### 4.1.1 성공 케이스
```bash
# cURL 예시
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**예상 응답:**
```json
{
  "data": {
    "count": 3,
    "results": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_perfume_id": "uuid",
        "verdict": "recommend",
        "score": 65,
        "reasons": ["종합 점수 65점으로 추천", "선호하는 노트 3개 포함 (+60점)", ...],
        "rule_version": "v1",
        "input_snapshot": {...},
        "created_at": "2026-01-29T..."
      },
      ...
    ]
  }
}
```

#### 4.1.2 실패 케이스

| 케이스 | 상태 코드 | 예상 응답 |
|-------|---------|----------|
| 미인증 사용자 | 401 | `{"error": "Unauthorized"}` |
| 취향 미설정 | 404 | `{"error": "User preferences not found..."}` |
| 향수 미등록 | 404 | `{"error": "No perfumes found..."}` |

---

## 5. UI 테스트

### 5.1 페이지 접근
**URL:** `http://localhost:3000/dashboard/recommendations`

### 5.2 시나리오 1: 데이터 미설정
**조건:** 취향 또는 향수 미설정

**예상 UI:**
- 노란색 안내 박스 표시
- "취향 설정하기" 또는 "향수 추가하기" 버튼 표시
- 추천 생성 버튼 숨김

### 5.3 시나리오 2: 추천 생성
**조건:** 취향 + 향수 모두 설정됨

**예상 UI:**
1. "추천 생성 (N개 향수 분석)" 버튼 표시
2. 버튼 클릭 → "생성 중..." 표시
3. 완료 후 페이지 자동 새로고침
4. 추천 결과 카드 목록 표시

### 5.4 시나리오 3: 추천 결과 표시
**조건:** 추천 생성 완료

**예상 카드 내용:**
- 향수 이름, 브랜드
- "추천" 또는 "비추천" 뱃지
- 점수 (숫자)
- 노트 정보 (Top, Middle, Base)
- 분석 근거 (bullet points)
- 규칙 버전, 생성일

### 5.5 시나리오 4: 중복 생성
**조건:** 추천을 여러 번 생성

**예상 동작:**
- 향수별 최신 결과만 표시 (중복 제거)
- 히스토리는 DB에 보존 (향후 분석용)

---

## 6. 데이터베이스 검증

### 6.1 추천 결과 저장 확인
**SQL:**
```sql
SELECT 
  rr.id,
  rr.verdict,
  rr.score,
  rr.reasons,
  rr.rule_version,
  up.name as perfume_name,
  rr.created_at
FROM public.recommendation_results rr
JOIN public.user_perfumes up ON up.id = rr.user_perfume_id
WHERE rr.user_id = auth.uid()
ORDER BY rr.created_at DESC;
```

**예상 결과:**
- 각 향수에 대한 추천 결과 존재
- `verdict`가 'recommend' 또는 'not_recommend'
- `score`가 숫자값 (예: 65, -40)
- `reasons` 배열에 판정 근거 포함
- `rule_version`이 'v1'

### 6.2 RLS 정책 검증
**테스트:**
1. 사용자 A로 로그인하여 추천 생성
2. 사용자 B로 로그인하여 추천 조회 시도

**예상 결과:**
- 사용자 B는 사용자 A의 추천 결과를 볼 수 없음 (RLS 차단)
- 각 사용자는 자신의 데이터만 조회 가능

---

## 7. 성능 테스트 (선택)

### 7.1 배치 INSERT 성능
**테스트:** 향수 100개에 대한 추천 생성

**예상 소요 시간:**
- 규칙 계산: < 1초
- DB INSERT: < 2초
- 총 < 3초

### 7.2 페이지 로딩 성능
**테스트:** 추천 결과 100개 표시

**예상 성능:**
- 초기 로딩: < 500ms (Server Component)
- 렌더링: < 100ms

---

## 8. 에러 처리 검증

### 8.1 네트워크 에러
**시뮬레이션:** 브라우저 개발자 도구에서 네트워크 차단

**예상 UI:**
- 에러 메시지 표시: "오류: Failed to fetch"
- 버튼 다시 활성화
- 사용자가 재시도 가능

### 8.2 Database 에러
**시뮬레이션:** Supabase 서비스 중단

**예상 UI:**
- 에러 메시지 표시: "추천 결과를 불러오는 중 오류가 발생했습니다"
- 500 상태 코드 반환

---

## 9. 타입 안정성 검증

### 9.1 TypeScript 컴파일
```bash
npx tsc --noEmit
```

**예상 결과:** 에러 없음

### 9.2 Linter 검증
```bash
npx eslint lib/recommendation-engine.ts app/api/recommendations/ hooks/use-recommendations.ts
```

**예상 결과:** 에러 없음

---

## 10. 체크리스트

### 10.1 기능 검증
- [ ] 규칙 엔진이 올바른 점수 계산
- [ ] API가 정상 응답 (200, 401, 404, 500)
- [ ] UI에 추천 결과 올바르게 표시
- [ ] 향수별 최신 결과만 표시 (중복 제거)
- [ ] 히스토리가 DB에 보존

### 10.2 품질 검증
- [ ] TypeScript 타입 에러 없음
- [ ] Linter 에러 없음
- [ ] Database 스키마 호환
- [ ] RLS 정책 정상 동작

### 10.3 PRD 원칙 준수
- [ ] 규칙 엔진만 추천 결정 (AI 미개입)
- [ ] 재현성 보장 (동일 입력 → 동일 출력)
- [ ] 설명 가능성 (reasons 필드 저장)
- [ ] 입력 스냅샷 저장 (input_snapshot)

---

## 11. 알려진 제한 사항

1. **Mood 매칭 미구현**
   - 현재 규칙 1-4만 적용
   - Phase 3에서 고도화 예정

2. **히스토리 관리**
   - 추천 재생성 시 기존 결과 삭제하지 않음
   - UI에서 최신 결과만 표시로 처리
   - 향후 DB 용량 관리 필요

3. **DELETE RLS 정책 없음**
   - 사용자가 직접 추천 결과 삭제 불가
   - 필요 시 스키마 마이그레이션 추가 필요

---

## 12. 다음 단계

F4 검증 완료 후 다음 작업:
- **F5:** AI 설명 생성 모듈 구현
- **F6:** 추천 결과 + AI 설명 통합 UI

---

**작성자:** AI Assistant  
**검토자:** (개발자 이름)  
**승인일:** (날짜)
