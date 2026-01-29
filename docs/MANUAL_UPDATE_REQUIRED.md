# ⚠️ 수동 업데이트 필요 - roadmap.md

**작성일**: 2026-01-29

---

## 문제 상황

`roadmap.md` 파일의 일부 라인이 파일 인코딩 또는 특수 문자 이슈로 자동 수정이 실패했습니다.

---

## 수정이 필요한 부분

### 📍 위치: `roadmap.md` 18번째 줄

**현재 내용** (오래된 설명):
```markdown
  - `app/(auth)/login/page.tsx`는 "Google로 로그인" UI를 제공하지만 실제 OAuth 호출 없이 mock user 생성.
```

**수정 필요** (F1 완료 후 정확한 설명):
```markdown
  - `app/(auth)/login/page.tsx`: Google OAuth 시작 또는 Mock 로그인
```

---

### 📍 추가 필요: F1 완료 항목

**위치**: 20번째 줄 다음에 추가

**추가할 내용**:
```markdown
- **프로필 조회** ✅ **완료 (F1)**:
  - `hooks/use-auth.ts`에서 `profiles` 테이블 조회 추가
  - user + profile 모두 반환 (display_name, avatar_url 등)
  - Mock 모드에서도 가상 profile 객체 생성
  - Header에서 `profile.display_name` 우선 표시
```

---

## 수정 방법

### 옵션 1: 직접 편집

1. VSCode에서 `roadmap.md` 파일 열기
2. 18번째 줄 찾기 (`app/(auth)/login/page.tsx`가 포함된 줄)
3. 위 "수정 필요" 내용으로 교체
4. 20번째 줄 다음에 "추가할 내용" 삽입
5. 저장

### 옵션 2: 검색/교체 사용

1. VSCode에서 `Ctrl+H` (Find and Replace)
2. Find: `는 "Google로 로그인" UI를 제공하지만 실제 OAuth 호출 없이 mock user 생성.`
3. Replace: `: Google OAuth 시작 또는 Mock 로그인`
4. Replace
5. F1 항목 수동 추가

---

## 검증 방법

수정 후 다음을 확인하세요:

```bash
# 파일 내용 확인
cat roadmap.md | Select-String -Pattern "login/page.tsx" -Context 2

# F1 항목 추가 확인
cat roadmap.md | Select-String -Pattern "프로필 조회"
```

---

## 참고

다른 모든 문서는 자동 업데이트가 완료되었습니다:
- ✅ `functional_flow.md` - Phase 1 체크리스트 완료
- ✅ `docs/history/006-*.md` - F1 히스토리 문서 생성
- ✅ `docs/PHASE1_COMPLETION_SUMMARY.md` - Phase 1 완료 요약

roadmap.md만 수동 수정 후 **Phase 1 문서 sync 100% 완료**됩니다.
