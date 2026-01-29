/**
 * 규칙 기반 추천 엔진 테스트
 * 
 * 실행: Node.js 환경에서 직접 실행 가능
 * 목적: 규칙 로직의 정확성 검증
 */

import { calculateRecommendation } from './recommendation-engine';

// 테스트 케이스 1: 강력한 추천 (선호 노트 다수 포함)
console.log('\n=== Test Case 1: Strong Recommendation ===');
const result1 = calculateRecommendation({
  userPreferences: {
    preferredNotes: ['Citrus', 'Bergamot', 'Mint'],
    dislikedNotes: ['Patchouli', 'Oud'],
    usageContext: ['daily', 'work'],
  },
  perfume: {
    notes: ['Citrus', 'Bergamot', 'Mint', 'Cedar'], // 3개 선호 노트 매칭
    family: 'Fresh',
    mood: 'Professional',
    usageContext: ['daily', 'work'],
  },
});
console.log('Verdict:', result1.verdict); // 예상: 'recommend'
console.log('Score:', result1.score); // 예상: 60 (선호3*20) + 10 (usage) + 15 (family) = 85
console.log('Reasons:', result1.reasons);
console.log('Expected: recommend with score >= 50');
console.log('Pass:', result1.verdict === 'recommend' && result1.score >= 50 ? '✅' : '❌');

// 테스트 케이스 2: 비추천 (비선호 노트 포함)
console.log('\n=== Test Case 2: Not Recommended (Disliked Notes) ===');
const result2 = calculateRecommendation({
  userPreferences: {
    preferredNotes: ['Citrus', 'Bergamot'],
    dislikedNotes: ['Patchouli', 'Oud'],
    usageContext: ['daily'],
  },
  perfume: {
    notes: ['Citrus', 'Patchouli', 'Oud', 'Sandalwood'], // 1개 선호, 2개 비선호
    family: 'Woody',
    mood: 'Intense',
    usageContext: ['evening'],
  },
});
console.log('Verdict:', result2.verdict); // 예상: 'not_recommend'
console.log('Score:', result2.score); // 예상: 20 (선호1*20) - 60 (비선호2*30) = -40
console.log('Reasons:', result2.reasons);
console.log('Expected: not_recommend with score < 50');
console.log('Pass:', result2.verdict === 'not_recommend' && result2.score < 50 ? '✅' : '❌');

// 테스트 케이스 3: 경계선 케이스 (점수 50 근처)
console.log('\n=== Test Case 3: Borderline Case ===');
const result3 = calculateRecommendation({
  userPreferences: {
    preferredNotes: ['Rose', 'Jasmine'],
    dislikedNotes: [],
    usageContext: ['date'],
  },
  perfume: {
    notes: ['Rose', 'Jasmine', 'Vanilla'], // 2개 선호 노트
    family: 'Floral',
    mood: 'Romantic',
    usageContext: ['date'],
  },
});
console.log('Verdict:', result3.verdict);
console.log('Score:', result3.score); // 예상: 40 (선호2*20) + 10 (usage) + 15 (family) = 65
console.log('Reasons:', result3.reasons);
console.log('Expected: recommend (score >= 50)');
console.log('Pass:', result3.verdict === 'recommend' && result3.score >= 50 ? '✅' : '❌');

// 테스트 케이스 4: 노트 없음 (최소 점수)
console.log('\n=== Test Case 4: No Matching Notes ===');
const result4 = calculateRecommendation({
  userPreferences: {
    preferredNotes: ['Citrus', 'Mint'],
    dislikedNotes: ['Patchouli'],
    usageContext: ['daily'],
  },
  perfume: {
    notes: ['Vanilla', 'Amber', 'Tonka Bean'], // 매칭 없음
    family: 'Sweet',
    mood: 'Cozy',
    usageContext: ['evening'],
  },
});
console.log('Verdict:', result4.verdict);
console.log('Score:', result4.score); // 예상: 0 (매칭 없음)
console.log('Reasons:', result4.reasons);
console.log('Expected: not_recommend (score < 50)');
console.log('Pass:', result4.verdict === 'not_recommend' && result4.score < 50 ? '✅' : '❌');

// 테스트 케이스 5: 대소문자 무관 매칭 테스트
console.log('\n=== Test Case 5: Case-Insensitive Matching ===');
const result5 = calculateRecommendation({
  userPreferences: {
    preferredNotes: ['citrus', 'BERGAMOT'], // 소문자/대문자 혼합
    dislikedNotes: [],
    usageContext: ['daily'],
  },
  perfume: {
    notes: ['Citrus', 'Bergamot', 'Mint'], // 정규화된 대소문자
    family: 'Fresh',
    mood: 'Clean',
    usageContext: ['daily'],
  },
});
console.log('Verdict:', result5.verdict);
console.log('Score:', result5.score); // 예상: 40 (선호2*20) + 10 (usage) + 15 (family) = 65
console.log('Reasons:', result5.reasons);
console.log('Expected: recommend (case-insensitive match)');
console.log('Pass:', result5.verdict === 'recommend' && result5.score >= 50 ? '✅' : '❌');

console.log('\n=== Summary ===');
console.log('All tests completed. Review results above.');
