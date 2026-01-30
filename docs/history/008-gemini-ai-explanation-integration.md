# Google Gemini AI Explanation Integration (비용 최적화)

**날짜:** 2026-01-30  
**작업자:** Senior AI Integration Engineer  
**타입:** Feature Implementation + Cost Optimization

---

## 변경 이유 (Why)

### 비즈니스 목표
- PRD F5 구현: 추천 결과에 대한 AI 설명 생성 기능 완성
- 사용자가 추천 결과를 이해하고 납득할 수 있도록 자연어 설명 제공
- PRD 핵심 철학: "향수를 추천하는 것이 아니라, 사용자의 취향을 이해시키는 서비스"

### 비용 최적화 필요성
- AI API 호출은 비용이 발생하므로 효율적인 사용 전략 필요
- 동일한 추천 결과에 대해 중복 생성 방지
- 응답 토큰 제한으로 비용 절감
- 빠르고 저렴한 모델 선택 (Gemini Flash)

---

## 변경 내용 (What)

### 1. 의존성 추가

#### 1.1 Google AI SDK 설치
```bash
pnpm add @google/generative-ai
```

**버전:** `@google/generative-ai@0.24.1`

**선택 이유:**
- Google Gemini API 공식 SDK
- TypeScript 완전 지원
- Next.js 14+ 호환

---

### 2. 코어 AI 로직 구현 (`lib/ai-explanation.ts`)

#### 2.1 비용 절감 전략
1. **모델 선택:** `gemini-2.0-flash-exp` (빠르고 저렴한 Flash 모델)
2. **토큰 제한:** `maxOutputTokens: 1000` (간결한 응답 강제)
3. **온도 설정:** `temperature: 0.7` (논리적이면서도 자연스러운 설명)
4. **토큰 사용량 로깅:** 입력/출력 토큰 추정치 콘솔 출력

#### 2.2 주요 함수

**`generateExplanation(input: ExplanationInput): Promise<ExplanationOutput>`**
- 입력: 사용자 취향, 향수 정보, 추천 결과
- 출력: summary (요약), fullText (상세 설명), 모델 정보, 토큰 사용량

**프롬프트 설계 원칙 (PRD 준수):**
- ✅ AI는 판단하지 않고 설명만 함
- ✅ 확률적 표현 금지 ("아마도", "~일 것 같아요")
- ✅ 논리적이고 친절한 톤
- ✅ 간결성 (최대 1000 토큰)

#### 2.3 에러 처리
- `QUOTA_EXCEEDED`: API 할당량 초과 감지
- `INVALID_API_KEY`: API 키 오류 감지
- `AI_GENERATION_FAILED`: 일반 생성 실패

**파일:** `lib/ai-explanation.ts`

---

### 3. API 엔드포인트 구현

#### 3.1 POST `/api/recommendations/[id]/explain`

**역할:**
- 추천 결과 ID를 받아 AI 설명 생성
- 이미 설명이 존재하면 즉시 반환 (중복 생성 방지, 비용 절감)
- 생성된 설명은 `ai_explanations` 테이블에 저장

**데이터 흐름:**
```
1. recommendation_results 조회 (user_perfumes JOIN)
2. ai_explanations 존재 여부 확인
   - 존재하면 → 즉시 반환 (캐시 효과)
   - 없으면 → 3단계 진행
3. AI 설명 생성 (lib/ai-explanation.ts 호출)
4. ai_explanations 테이블 저장
5. 저장된 설명 반환
```

**비용 절감 포인트:**
- 캐싱 전략: 기존 설명 재사용
- 토큰 사용량 로깅: 비용 모니터링

**에러 응답:**
- `QUOTA_EXCEEDED` → "AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해 주세요."
- `INVALID_API_KEY` → "AI 서비스 설정 오류가 발생했습니다."
- 기타 → "AI 설명 생성에 실패했습니다. 다시 시도해 주세요."

**파일:** `app/api/recommendations/[id]/explain/route.ts`

---

### 4. 프론트엔드 컴포넌트 개선

#### 4.1 `RecommendationResultCard` 컴포넌트

**추가 기능:**
1. **AI 설명 보기 버튼**
   - 초기 상태: "AI 설명 보기"
   - 로딩 중: 스피너 + "AI 설명 생성 중..."
   - 생성 완료: "설명 숨기기" (토글 기능)

2. **로딩 상태 관리**
   - `isLoadingExplanation`: 로딩 중 버튼 비활성화
   - 중복 클릭 방지

3. **에러 처리**
   - 에러 메시지 표시 (빨간 배경)
   - "다시 시도" 버튼 제공
   - Quota Exceeded 특별 안내

4. **설명 표시 UI**
   - 보라색 배경으로 구분 (AI 생성 콘텐츠 시각적 표시)
   - 요약과 상세 설명 분리
   - 모델 정보 및 생성 시간 표시

**상태 관리:**
```typescript
const [showExplanation, setShowExplanation] = useState(false);
const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
const [explanationError, setExplanationError] = useState<string | null>(null);
const [explanation, setExplanation] = useState<...>(null);
```

**파일:** `components/recommendation/RecommendationResultCard.tsx`

---

## 기술적 세부사항 (How)

### 1. API 키 관리
- 환경 변수: `GOOGLE_GENERATIVE_AI_API_KEY` (.env.local)
- 서버 사이드에서만 사용 (클라이언트 노출 방지)
- 키 없을 경우 명확한 에러 메시지

### 2. 토큰 추정 로직
```typescript
function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherChars = text.length - koreanChars;
  
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
```
- 한글: ~2자 = 1토큰
- 영어: ~4자 = 1토큰
- 대략적인 추정치 (모니터링 목적)

### 3. 응답 파싱
- AI 응답을 `[요약]`과 `[상세 설명]` 섹션으로 분리
- 파싱 실패 시 전체 텍스트를 fullText로 사용 (안전 장치)
- Markdown 볼드 태그 제거

### 4. 데이터베이스 저장
- 테이블: `ai_explanations` (기존 스키마 활용)
- 관계: `recommendation_results` (1:1)
- RLS: `recommendation_results`의 소유권으로 간접 검증

---

## 영향도 분석 (Impact)

### 긍정적 영향
1. **사용자 경험 향상**
   - 추천 결과에 대한 이해도 증가
   - 납득 가능한 설명 제공

2. **비용 효율성**
   - 캐싱으로 중복 호출 방지 (비용 절감)
   - 토큰 제한으로 과도한 응답 방지
   - Flash 모델 사용 (저렴)

3. **PRD 원칙 준수**
   - AI는 설명만 담당 (판단은 규칙 엔진)
   - 확률적 표현 배제
   - 논리적이고 친절한 톤

### 주의사항
1. **API 할당량 관리**
   - Google AI API의 무료 할당량 확인 필요
   - 초과 시 사용자에게 친절한 안내
   - 비용 모니터링 로그 활용

2. **응답 품질**
   - 프롬프트 품질이 설명 품질에 직접 영향
   - 향후 프롬프트 개선 가능성

3. **네트워크 지연**
   - AI 생성은 2-10초 소요 가능
   - 로딩 UI로 사용자 대기 관리

---

## 검증 방법 (Verification)

### 1. 기능 테스트
```bash
# 개발 서버 실행
pnpm dev

# 테스트 시나리오:
1. 추천 결과 페이지 이동 (/dashboard/recommendations)
2. 추천 생성 버튼 클릭 (향수 등록 필요)
3. 추천 결과 카드에서 "AI 설명 보기" 클릭
4. 로딩 상태 확인
5. 설명 생성 및 표시 확인
6. 동일 카드에서 재클릭 시 즉시 표시 확인 (캐싱)
```

### 2. 에러 시나리오 테스트
- API 키 제거 후 테스트 (INVALID_API_KEY)
- 네트워크 오류 시뮬레이션
- Quota 초과 시나리오 (실제 발생 시 확인)

### 3. 비용 모니터링
```bash
# 콘솔 로그 확인
[AI Explanation] Estimated input tokens: XXX
[AI Explanation] Output tokens (estimated): XXX
[AI Explanation] Tokens used (estimated): XXX
```

### 4. 데이터베이스 확인
```sql
-- Supabase SQL Editor
SELECT * FROM ai_explanations ORDER BY created_at DESC LIMIT 10;

-- 각 설명의 길이 확인
SELECT 
  id,
  LENGTH(summary_text) as summary_length,
  LENGTH(full_text) as full_length,
  model,
  created_at
FROM ai_explanations
ORDER BY created_at DESC;
```

---

## 다음 단계 (Next Steps)

### 1. 모니터링 (Phase 1 완료 후)
- API 사용량 추적
- 평균 토큰 소비량 분석
- 비용 최적화 여지 검토

### 2. 프롬프트 개선 (Phase 2)
- 사용자 피드백 수집
- 설명 품질 평가
- 프롬프트 버전 관리 (prompt_version 활용)

### 3. 추가 최적화 (향후 고려)
- Streaming 응답 (사용자 경험 개선)
- 배치 생성 (여러 추천 결과 한 번에 생성)
- 캐시 만료 정책 (취향 변경 시 재생성)

---

## 관련 파일 (Files Changed)

### 새로 생성된 파일
1. `app/api/recommendations/[id]/explain/route.ts` (166줄)
2. `docs/history/008-gemini-ai-explanation-integration.md` (이 문서)

### 수정된 파일
1. `lib/ai-explanation.ts` (34줄 → 208줄)
   - Gemini API 연동
   - 비용 절감 로직
   - 에러 처리

2. `components/recommendation/RecommendationResultCard.tsx` (115줄 → 224줄)
   - AI 설명 버튼 추가
   - 로딩/에러 상태 관리
   - 설명 표시 UI

3. `package.json`
   - `@google/generative-ai@0.24.1` 추가

---

## 참고 자료 (References)

- [Google AI for Developers - Gemini API](https://ai.google.dev/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- PRD Section 4.5: F5 - AI 기반 추천 설명 생성
- DB Schema: `ai_explanations` 테이블 (docs/db_schema.sql)

---

**문서 작성일:** 2026-01-30  
**마지막 업데이트:** 2026-01-30
