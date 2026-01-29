-- ============================================================================
-- Scentory Seed Data (Test/Development)
-- ============================================================================
-- 
-- 목적: UI 렌더링 및 기능 흐름 검증을 위한 고품질 샘플 데이터
-- 
-- ⚠️ 중요 사항:
-- 1. 이 데이터는 개발/테스트 전용입니다. 프로덕션 환경에서는 사용하지 마세요.
-- 
-- 2. RLS(Row Level Security) 정책 때문에 일반 사용자로는 실행 불가능합니다.
--    실행 방법:
--    a) Supabase Dashboard → SQL Editor에서 "Run as service_role" 옵션 사용
--    b) 또는 RLS를 일시적으로 비활성화: ALTER TABLE ... DISABLE ROW LEVEL SECURITY;
--       (데이터 삽입 후 다시 활성화: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;)
-- 
-- 3. FK 제약 조건 해결:
--    - profiles.id는 auth.users.id를 FK로 참조합니다
--    - 따라서 auth.users에 먼저 사용자를 삽입한 후 profiles를 삽입해야 합니다
--    - 이 파일은 올바른 삽입 순서를 보장합니다:
--      1) auth.users 삽입 (인증 사용자 생성)
--      2) public.profiles 삽입 (프로필 확장 데이터)
--      3) public.user_preferences 삽입 (취향 데이터)
--      4) public.user_perfumes 삽입 (향수 데이터)
--      5) public.recommendation_results 삽입 (추천 결과)
--      6) public.ai_explanations 삽입 (AI 설명)
-- 
-- 4. UUID 일관성:
--    - 모든 테이블에서 동일한 UUID를 사용하여 관계를 유지합니다
--    - 테스트용 UUID는 고정값을 사용하여 재현 가능성을 보장합니다
-- 
-- ============================================================================

-- ============================================================================
-- 1. 기준 데이터 (참고용)
-- ============================================================================
-- 현재 스키마에는 별도 코드 마스터 테이블이 없지만,
-- 향후 확장을 위한 기준 데이터 정의를 주석으로 남깁니다.
-- 
-- 향수 노트 유형:
--   - TOP: 첫인상, 15-30분 지속 (예: 시트러스, 베르가못, 민트)
--   - MIDDLE: 핵심 성격, 30분-3시간 지속 (예: 장미, 재스민, 라벤더)
--   - BASE: 기반, 3시간 이상 지속 (예: 샌달우드, 머스크, 바닐라)
-- 
-- 사용자 취향 태그 카테고리 (UI에서 사용):
--   - 플로럴 (Floral): Rose, Jasmine, Lily, Peony, Tuberose, Iris, Violet
--   - 우디 (Woody): Sandalwood, Cedar, Oud, Vetiver, Patchouli, Birch
--   - 프레시 (Fresh): Citrus, Bergamot, Grapefruit, Mint, Green Tea, Marine
--   - 스파이시 (Spicy): Cardamom, Cinnamon, Pepper, Clove, Ginger, Saffron
--   - 스위트 (Sweet): Vanilla, Caramel, Honey, Tonka Bean, Amber, Benzoin
--   - 머스키 (Musky): White Musk, Ambroxan, Cashmere, Skin Musk, Clean Musk
-- 
-- 사용 상황 (Usage Context):
--   - daily: 일상 착용
--   - work: 업무/오피스
--   - evening: 저녁 외출
--   - date: 데이트
--   - weekend: 주말 캐주얼
--   - special: 특별한 날

-- ============================================================================
-- 2. 테스트용 사용자 UUID 정의
-- ============================================================================
-- 모든 테이블에서 일관되게 사용할 UUID를 미리 정의합니다.
-- 이 UUID들은 auth.users, profiles, user_preferences 등에서 동일하게 사용됩니다.

DO $$
DECLARE
  user1_id uuid := '00000000-0000-0000-0000-000000000001';
  user2_id uuid := '00000000-0000-0000-0000-000000000002';
  user3_id uuid := '00000000-0000-0000-0000-000000000003';
  user4_id uuid := '00000000-0000-0000-0000-000000000004';
  user5_id uuid := '00000000-0000-0000-0000-000000000005';
BEGIN
  -- 변수는 DO 블록 내에서만 사용 가능하므로, 실제 INSERT에서는 직접 UUID 문자열 사용
  NULL;
END $$;

-- ============================================================================
-- 3. auth.users 테이블에 테스트 사용자 삽입
-- ============================================================================
-- ⚠️ 중요: profiles.id가 auth.users.id를 FK로 참조하므로,
-- 반드시 auth.users에 먼저 사용자를 삽입해야 합니다.
-- 
-- Supabase auth.users 테이블 구조:
--   - id (uuid, PK): 사용자 고유 ID
--   - email (text): 이메일 주소
--   - encrypted_password (text): 암호화된 비밀번호 (OAuth 사용자는 NULL)
--   - email_confirmed_at (timestamptz): 이메일 확인 시간
--   - created_at, updated_at: 생성/수정 시간
--   - raw_app_meta_data, raw_user_meta_data: 메타데이터 (JSONB)
--   - 기타 컬럼들은 기본값 또는 NULL 허용
-- 
-- 개발 환경에서는 최소 필수 컬럼만 포함하여 삽입합니다.

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES
  -- 사용자1: 상큼한 향 선호 (프레시/시트러스 계열)
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'minsu@test.scentory.local',
    NULL, -- OAuth 사용자이므로 비밀번호 없음
    now() - interval '30 days',
    now() - interval '30 days',
    now() - interval '1 day',
    '{"provider": "google", "providers": ["google"]}'::jsonb,
    '{"name": "민수"}'::jsonb,
    false,
    'authenticated'
  ),
  -- 사용자2: 묵직한 향 선호 (우디/머스키 계열)
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'jiyoung@test.scentory.local',
    NULL,
    now() - interval '25 days',
    now() - interval '25 days',
    now() - interval '2 days',
    '{"provider": "google", "providers": ["google"]}'::jsonb,
    '{"name": "지영"}'::jsonb,
    false,
    'authenticated'
  ),
  -- 사용자3: 중성적인 향 선호 (플로럴/스파이시 혼합)
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'hyunwoo@test.scentory.local',
    NULL,
    now() - interval '20 days',
    now() - interval '20 days',
    now() - interval '3 days',
    '{"provider": "google", "providers": ["google"]}'::jsonb,
    '{"name": "현우"}'::jsonb,
    false,
    'authenticated'
  ),
  -- 사용자4: 달콤한 향 선호 (스위트/바닐라 계열)
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'seoyeon@test.scentory.local',
    NULL,
    now() - interval '15 days',
    now() - interval '15 days',
    now() - interval '4 days',
    '{"provider": "google", "providers": ["google"]}'::jsonb,
    '{"name": "서연"}'::jsonb,
    false,
    'authenticated'
  ),
  -- 사용자5: 다양한 향 실험 (모든 계열 혼합)
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'dohyun@test.scentory.local',
    NULL,
    now() - interval '10 days',
    now() - interval '10 days',
    now() - interval '5 days',
    '{"provider": "google", "providers": ["google"]}'::jsonb,
    '{"name": "도현"}'::jsonb,
    false,
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. public.profiles 테이블에 프로필 데이터 삽입
-- ============================================================================
-- ⚠️ 중요: auth.users에 사용자가 삽입된 후에만 실행 가능합니다.
-- profiles.id는 auth.users.id를 FK로 참조하므로, FK 제약 조건을 만족합니다.

INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
VALUES
  -- 사용자1: 상큼한 향 선호 (프레시/시트러스 계열)
  ('00000000-0000-0000-0000-000000000001', '민수', 'https://api.dicebear.com/9.x/initials/svg?seed=민수', now() - interval '30 days', now() - interval '1 day'),
  -- 사용자2: 묵직한 향 선호 (우디/머스키 계열)
  ('00000000-0000-0000-0000-000000000002', '지영', 'https://api.dicebear.com/9.x/initials/svg?seed=지영', now() - interval '25 days', now() - interval '2 days'),
  -- 사용자3: 중성적인 향 선호 (플로럴/스파이시 혼합)
  ('00000000-0000-0000-0000-000000000003', '현우', 'https://api.dicebear.com/9.x/initials/svg?seed=현우', now() - interval '20 days', now() - interval '3 days'),
  -- 사용자4: 달콤한 향 선호 (스위트/바닐라 계열)
  ('00000000-0000-0000-0000-000000000004', '서연', 'https://api.dicebear.com/9.x/initials/svg?seed=서연', now() - interval '15 days', now() - interval '4 days'),
  -- 사용자5: 다양한 향 실험 (모든 계열 혼합)
  ('00000000-0000-0000-0000-000000000005', '도현', 'https://api.dicebear.com/9.x/initials/svg?seed=도현', now() - interval '10 days', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. 사용자 취향 데이터 삽입
-- ============================================================================
-- ⚠️ 중요: profiles에 사용자가 삽입된 후에만 실행 가능합니다.
-- user_preferences.user_id는 profiles.id를 FK로 참조합니다.

-- 사용자1: 상큼한 향 선호
INSERT INTO public.user_preferences (user_id, preferred_notes, disliked_notes, usage_context, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    ARRAY['Citrus', 'Bergamot', 'Grapefruit', 'Mint', 'Green Tea', 'Marine'],
    ARRAY['Patchouli', 'Oud', 'Amber'],
    ARRAY['daily', 'work'],
    now() - interval '28 days',
    now() - interval '1 day'
  )
ON CONFLICT (user_id) DO NOTHING;

-- 사용자2: 묵직한 향 선호
INSERT INTO public.user_preferences (user_id, preferred_notes, disliked_notes, usage_context, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    ARRAY['Sandalwood', 'Cedar', 'Oud', 'Vetiver', 'White Musk', 'Ambroxan'],
    ARRAY['Citrus', 'Grapefruit', 'Mint'],
    ARRAY['evening', 'date', 'weekend'],
    now() - interval '23 days',
    now() - interval '2 days'
  )
ON CONFLICT (user_id) DO NOTHING;

-- 사용자3: 중성적인 향 선호
INSERT INTO public.user_preferences (user_id, preferred_notes, disliked_notes, usage_context, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    ARRAY['Rose', 'Jasmine', 'Cardamom', 'Cinnamon', 'Sandalwood'],
    ARRAY['Vanilla', 'Caramel', 'Honey'],
    ARRAY['daily', 'work', 'weekend'],
    now() - interval '18 days',
    now() - interval '3 days'
  )
ON CONFLICT (user_id) DO NOTHING;

-- 사용자4: 달콤한 향 선호
INSERT INTO public.user_preferences (user_id, preferred_notes, disliked_notes, usage_context, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000004',
    ARRAY['Vanilla', 'Caramel', 'Honey', 'Tonka Bean', 'Amber', 'Benzoin'],
    ARRAY['Oud', 'Vetiver', 'Patchouli'],
    ARRAY['date', 'evening', 'special'],
    now() - interval '13 days',
    now() - interval '4 days'
  )
ON CONFLICT (user_id) DO NOTHING;

-- 사용자5: 다양한 향 실험
INSERT INTO public.user_preferences (user_id, preferred_notes, disliked_notes, usage_context, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000005',
    ARRAY['Rose', 'Jasmine', 'Sandalwood', 'Cedar', 'Citrus', 'Bergamot', 'Vanilla', 'White Musk'],
    ARRAY[]::text[],
    ARRAY['daily', 'work', 'evening', 'date', 'weekend', 'special'],
    now() - interval '8 days',
    now() - interval '5 days'
  )
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 6. 향수 데이터 삽입
-- ============================================================================
-- ⚠️ 중요: profiles에 사용자가 삽입된 후에만 실행 가능합니다.
-- user_perfumes.user_id는 profiles.id를 FK로 참조합니다.

-- 사용자1의 향수 (상큼한 향 선호)
INSERT INTO public.user_perfumes (id, user_id, name, brand, notes_top, notes_middle, notes_base, family, mood, usage_context, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Bleu de Chanel',
    'Chanel',
    ARRAY['Citrus', 'Mint', 'Pink Pepper'],
    ARRAY['Grapefruit', 'Nutmeg', 'Jasmine'],
    ARRAY['Labdanum', 'Cedar', 'Sandalwood'],
    'Fresh',
    'Professional',
    ARRAY['daily', 'work'],
    now() - interval '25 days',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Acqua di Gio',
    'Giorgio Armani',
    ARRAY['Bergamot', 'Marine'],
    ARRAY['Jasmine', 'Green Tea'],
    ARRAY['Cedar', 'Musk'],
    'Fresh',
    'Clean',
    ARRAY['daily', 'work'],
    now() - interval '20 days',
    now() - interval '2 days'
  )
ON CONFLICT DO NOTHING;

-- 사용자2의 향수 (묵직한 향 선호)
INSERT INTO public.user_perfumes (id, user_id, name, brand, notes_top, notes_middle, notes_base, family, mood, usage_context, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'Santal 33',
    'Le Labo',
    ARRAY['Cardamom', 'Iris', 'Violet'],
    ARRAY['Ambrox', 'Australian Sandalwood'],
    ARRAY['Cedarwood', 'Leather', 'Musk'],
    'Woody',
    'Sophisticated',
    ARRAY['evening', 'date'],
    now() - interval '20 days',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'Oud Wood',
    'Tom Ford',
    ARRAY['Oud', 'Rosewood'],
    ARRAY['Cardamom', 'Coriander'],
    ARRAY['Sandalwood', 'Vetiver', 'Tonka Bean'],
    'Woody',
    'Luxurious',
    ARRAY['evening', 'special'],
    now() - interval '15 days',
    now() - interval '2 days'
  )
ON CONFLICT DO NOTHING;

-- 사용자3의 향수 (중성적인 향 선호)
INSERT INTO public.user_perfumes (id, user_id, name, brand, notes_top, notes_middle, notes_base, family, mood, usage_context, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'Portrait of a Lady',
    'Frederic Malle',
    ARRAY['Turkish Rose', 'Raspberry'],
    ARRAY['Clove', 'Cinnamon', 'Patchouli'],
    ARRAY['Sandalwood', 'Musk', 'Amber'],
    'Floral',
    'Elegant',
    ARRAY['evening', 'special'],
    now() - interval '15 days',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'Black Opium',
    'Yves Saint Laurent',
    ARRAY['Pink Pepper', 'Orange Blossom'],
    ARRAY['Coffee', 'Jasmine'],
    ARRAY['Vanilla', 'Patchouli', 'Cedar'],
    'Oriental',
    'Bold',
    ARRAY['evening', 'date'],
    now() - interval '10 days',
    now() - interval '2 days'
  )
ON CONFLICT DO NOTHING;

-- 사용자4의 향수 (달콤한 향 선호)
INSERT INTO public.user_perfumes (id, user_id, name, brand, notes_top, notes_middle, notes_base, family, mood, usage_context, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'Baccarat Rouge 540',
    'Maison Francis Kurkdjian',
    ARRAY['Saffron', 'Jasmine'],
    ARRAY['Amberwood', 'Ambergris'],
    ARRAY['Fir Resin', 'Cedar'],
    'Oriental',
    'Sweet',
    ARRAY['evening', 'date', 'special'],
    now() - interval '10 days',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'La Vie Est Belle',
    'Lancôme',
    ARRAY['Blackcurrant', 'Pear'],
    ARRAY['Jasmine', 'Orange Blossom'],
    ARRAY['Vanilla', 'Praline', 'Patchouli'],
    'Floral',
    'Joyful',
    ARRAY['daily', 'weekend'],
    now() - interval '5 days',
    now() - interval '2 days'
  )
ON CONFLICT DO NOTHING;

-- 사용자5의 향수 (다양한 향 실험)
INSERT INTO public.user_perfumes (id, user_id, name, brand, notes_top, notes_middle, notes_base, family, mood, usage_context, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'Another 13',
    'Le Labo',
    ARRAY['Pear', 'Aldehyde'],
    ARRAY['Ambroxan', 'Jasmine Petals'],
    ARRAY['Moss', 'Musk'],
    'Musky',
    'Minimalist',
    ARRAY['daily', 'work'],
    now() - interval '5 days',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'Good Girl',
    'Carolina Herrera',
    ARRAY['Almond', 'Coffee'],
    ARRAY['Tuberose', 'Jasmine'],
    ARRAY['Tonka Bean', 'Cacao', 'Patchouli'],
    'Oriental',
    'Seductive',
    ARRAY['evening', 'date'],
    now() - interval '3 days',
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. 추천 결과 데이터 삽입
-- ============================================================================
-- ⚠️ 중요: user_perfumes와 user_preferences에 데이터가 삽입된 후에만 실행 가능합니다.
-- recommendation_results는 두 테이블을 모두 참조합니다.

-- 사용자1의 추천 결과
INSERT INTO public.recommendation_results (
  id, user_id, user_perfume_id, verdict, score, reasons, rule_version, input_snapshot, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  up.id,
  'recommend'::public.recommendation_verdict,
  85.50,
  ARRAY['선호하는 시트러스 노트가 포함되어 있음', '일상 착용에 적합한 계열'],
  'v1',
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'preferred_notes', upref.preferred_notes,
      'disliked_notes', upref.disliked_notes,
      'usage_context', upref.usage_context
    ),
    'perfume', jsonb_build_object(
      'name', up.name,
      'notes', jsonb_build_object(
        'top', up.notes_top,
        'middle', up.notes_middle,
        'base', up.notes_base
      ),
      'family', up.family,
      'mood', up.mood
    )
  ),
  now() - interval '24 days'
FROM public.user_perfumes up
JOIN public.user_preferences upref ON upref.user_id = up.user_id
WHERE up.user_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 사용자2의 추천 결과
INSERT INTO public.recommendation_results (
  id, user_id, user_perfume_id, verdict, score, reasons, rule_version, input_snapshot, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  up.id,
  'recommend'::public.recommendation_verdict,
  92.00,
  ARRAY['선호하는 우디 노트가 강하게 나타남', '저녁/데이트 상황에 적합'],
  'v1',
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'preferred_notes', upref.preferred_notes,
      'disliked_notes', upref.disliked_notes,
      'usage_context', upref.usage_context
    ),
    'perfume', jsonb_build_object(
      'name', up.name,
      'notes', jsonb_build_object(
        'top', up.notes_top,
        'middle', up.notes_middle,
        'base', up.notes_base
      ),
      'family', up.family,
      'mood', up.mood
    )
  ),
  now() - interval '19 days'
FROM public.user_perfumes up
JOIN public.user_preferences upref ON upref.user_id = up.user_id
WHERE up.user_id = '00000000-0000-0000-0000-000000000002'
ON CONFLICT DO NOTHING;

-- 사용자3의 추천 결과 (혼합: 추천/비추천)
INSERT INTO public.recommendation_results (
  id, user_id, user_perfume_id, verdict, score, reasons, rule_version, input_snapshot, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003',
  up.id,
  CASE 
    WHEN up.name = 'Portrait of a Lady' THEN 'recommend'::public.recommendation_verdict
    ELSE 'not_recommend'::public.recommendation_verdict
  END,
  CASE 
    WHEN up.name = 'Portrait of a Lady' THEN 78.00
    ELSE 45.00
  END,
  CASE 
    WHEN up.name = 'Portrait of a Lady' THEN ARRAY['선호하는 플로럴 노트가 포함됨', '특별한 날에 적합']
    ELSE ARRAY['비선호하는 바닐라 노트가 포함되어 있음', '과도하게 달콤한 계열']
  END,
  'v1',
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'preferred_notes', upref.preferred_notes,
      'disliked_notes', upref.disliked_notes,
      'usage_context', upref.usage_context
    ),
    'perfume', jsonb_build_object(
      'name', up.name,
      'notes', jsonb_build_object(
        'top', up.notes_top,
        'middle', up.notes_middle,
        'base', up.notes_base
      ),
      'family', up.family,
      'mood', up.mood
    )
  ),
  now() - interval '14 days'
FROM public.user_perfumes up
JOIN public.user_preferences upref ON upref.user_id = up.user_id
WHERE up.user_id = '00000000-0000-0000-0000-000000000003'
ON CONFLICT DO NOTHING;

-- 사용자4의 추천 결과
INSERT INTO public.recommendation_results (
  id, user_id, user_perfume_id, verdict, score, reasons, rule_version, input_snapshot, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000004',
  up.id,
  'recommend'::public.recommendation_verdict,
  88.50,
  ARRAY['선호하는 스위트 노트가 풍부함', '데이트/저녁 상황에 완벽'],
  'v1',
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'preferred_notes', upref.preferred_notes,
      'disliked_notes', upref.disliked_notes,
      'usage_context', upref.usage_context
    ),
    'perfume', jsonb_build_object(
      'name', up.name,
      'notes', jsonb_build_object(
        'top', up.notes_top,
        'middle', up.notes_middle,
        'base', up.notes_base
      ),
      'family', up.family,
      'mood', up.mood
    )
  ),
  now() - interval '9 days'
FROM public.user_perfumes up
JOIN public.user_preferences upref ON upref.user_id = up.user_id
WHERE up.user_id = '00000000-0000-0000-0000-000000000004'
ON CONFLICT DO NOTHING;

-- 사용자5의 추천 결과
INSERT INTO public.recommendation_results (
  id, user_id, user_perfume_id, verdict, score, reasons, rule_version, input_snapshot, created_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000005',
  up.id,
  'recommend'::public.recommendation_verdict,
  75.00,
  ARRAY['다양한 노트가 균형있게 조화됨', '모든 상황에서 활용 가능'],
  'v1',
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'preferred_notes', upref.preferred_notes,
      'disliked_notes', upref.disliked_notes,
      'usage_context', upref.usage_context
    ),
    'perfume', jsonb_build_object(
      'name', up.name,
      'notes', jsonb_build_object(
        'top', up.notes_top,
        'middle', up.notes_middle,
        'base', up.notes_base
      ),
      'family', up.family,
      'mood', up.mood
    )
  ),
  now() - interval '4 days'
FROM public.user_perfumes up
JOIN public.user_preferences upref ON upref.user_id = up.user_id
WHERE up.user_id = '00000000-0000-0000-0000-000000000005'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. AI 설명 데이터 삽입
-- ============================================================================
-- ⚠️ 중요: recommendation_results에 데이터가 삽입된 후에만 실행 가능합니다.
-- ai_explanations.recommendation_result_id는 recommendation_results.id를 FK로 참조합니다.

INSERT INTO public.ai_explanations (
  recommendation_result_id, summary_text, full_text, model, prompt_version, created_at
)
SELECT
  rr.id,
  CASE 
    WHEN rr.verdict = 'recommend' THEN
      CASE 
        WHEN up.name = 'Bleu de Chanel' THEN '상큼한 시트러스 노트가 당신의 선호 취향과 완벽하게 맞아떨어집니다. 일상 착용에 적합한 깔끔한 향으로, 업무 환경에서도 부담 없이 사용할 수 있습니다.'
        WHEN up.name = 'Acqua di Gio' THEN '바다를 연상시키는 프레시한 향이 당신의 취향과 잘 어울립니다. 베르가못과 그린티 노트가 조화를 이루어 상쾌하고 깨끗한 느낌을 줍니다.'
        WHEN up.name = 'Santal 33' THEN '묵직하고 세련된 샌달우드 향이 당신의 취향과 완벽하게 일치합니다. 저녁 시간이나 특별한 날에 착용하면 우아한 분위기를 연출할 수 있습니다.'
        WHEN up.name = 'Oud Wood' THEN '고급스러운 우드 향이 당신의 취향을 충족시킵니다. 우드와 베티버의 조합이 깊이 있는 향을 만들어내며, 특별한 순간에 어울립니다.'
        WHEN up.name = 'Portrait of a Lady' THEN '우아한 플로럴 향이 당신의 중성적인 취향과 잘 맞습니다. 장미와 스파이시 노트의 조화가 세련된 느낌을 줍니다.'
        WHEN up.name = 'Baccarat Rouge 540' THEN '달콤하고 고급스러운 향이 당신의 취향과 완벽하게 어울립니다. 사프란과 앰버의 조합이 특별한 날에 어울리는 향을 만들어냅니다.'
        WHEN up.name = 'La Vie Est Belle' THEN '밝고 즐거운 바닐라 향이 당신의 취향과 잘 맞습니다. 일상에서도 기분 좋게 사용할 수 있는 달콤한 향입니다.'
        WHEN up.name = 'Another 13' THEN '미니멀하고 깔끔한 향이 당신의 다양한 취향과 잘 어울립니다. 모든 상황에서 활용하기 좋은 범용적인 향입니다.'
        WHEN up.name = 'Good Girl' THEN '세련되고 매력적인 향이 당신의 취향과 잘 맞습니다. 저녁 시간이나 데이트에 어울리는 향입니다.'
        ELSE '이 향수는 당신의 취향과 잘 맞습니다.'
      END
    ELSE
      CASE 
        WHEN up.name = 'Black Opium' THEN '과도하게 달콤한 바닐라 노트가 당신의 비선호 취향과 충돌합니다. 달콤한 향을 싫어하는 당신에게는 부담스러울 수 있습니다.'
        ELSE '이 향수는 당신의 취향과 잘 맞지 않을 수 있습니다.'
      END
  END,
  CASE 
    WHEN rr.verdict = 'recommend' THEN
      CASE 
        WHEN up.name = 'Bleu de Chanel' THEN 'Bleu de Chanel은 당신이 선호하는 상큼한 시트러스 노트를 첫인상으로 제공합니다. 민트와 핑크 페퍼가 더해져 깔끔하고 전문적인 느낌을 주며, 이는 당신이 선호하는 일상 착용 및 업무 환경에 완벽하게 맞습니다. 중간 노트의 자스민과 그레이프프루트가 상쾌함을 유지하면서도, 베이스의 시더우드와 샌달우드가 안정감 있는 마무리를 제공합니다. 당신이 싫어하는 패출리나 우드 계열의 무거운 향은 포함되지 않아 부담 없이 사용할 수 있습니다.'
        WHEN up.name = 'Acqua di Gio' THEN 'Acqua di Gio는 당신이 좋아하는 바다와 프레시 계열의 향을 완벽하게 구현합니다. 베르가못과 마린 노트가 조화를 이루어 상쾌하고 깨끗한 첫인상을 주며, 그린티와 자스민이 중간 노트에서 자연스러운 느낌을 더합니다. 베이스의 시더와 머스크는 오래 지속되는 깔끔한 마무리를 제공합니다. 당신이 선호하는 일상 및 업무 착용 상황에 적합하며, 싫어하는 무거운 우드 향은 포함되지 않아 부담이 없습니다.'
        WHEN up.name = 'Santal 33' THEN 'Santal 33은 당신이 선호하는 묵직하고 세련된 우디 향의 대표작입니다. 호주산 샌달우드가 핵심 노트로 작용하여 크리미하고 중독성 있는 향을 만들어내며, 이는 당신이 좋아하는 우디 계열의 완벽한 예시입니다. 카다몬과 아이리스가 초반에 복잡함을 더하지만, 베이스의 시더우드와 레더, 머스크가 안정감 있는 마무리를 제공합니다. 당신이 선호하는 저녁 시간이나 특별한 날에 착용하면 우아하고 세련된 분위기를 연출할 수 있습니다.'
        WHEN up.name = 'Oud Wood' THEN 'Oud Wood는 당신이 선호하는 고급스러운 우디 향의 정점을 보여줍니다. 우드가 첫인상부터 강하게 나타나며, 이는 당신이 좋아하는 우디 계열의 핵심입니다. 카다몬과 코리앤더가 중간 노트에서 스파이시함을 더하지만, 베이스의 샌달우드와 베티버, 통카 빈이 깊이 있는 향을 완성합니다. 당신이 선호하는 저녁이나 특별한 순간에 착용하면 럭셔리하고 매력적인 향을 경험할 수 있습니다.'
        WHEN up.name = 'Portrait of a Lady' THEN 'Portrait of a Lady는 당신이 선호하는 플로럴과 스파이시 노트의 조화를 보여줍니다. 터키 장미가 핵심 노트로 작용하여 우아하고 세련된 느낌을 주며, 클로브와 시나몬이 중간 노트에서 스파이시함을 더합니다. 베이스의 샌달우드와 머스크, 앰버가 안정감 있는 마무리를 제공합니다. 당신이 선호하는 중성적인 취향과 잘 맞으며, 특별한 날에 착용하면 우아한 분위기를 연출할 수 있습니다.'
        WHEN up.name = 'Baccarat Rouge 540' THEN 'Baccarat Rouge 540은 당신이 선호하는 달콤하고 고급스러운 향의 대표작입니다. 사프란과 자스민이 첫인상에서 특별함을 더하며, 앰버우드와 앰버그리스가 중간 노트에서 달콤함을 강화합니다. 베이스의 퍼 레진과 시더가 깊이 있는 마무리를 제공합니다. 당신이 선호하는 데이트나 저녁 시간, 특별한 날에 착용하면 매력적이고 고급스러운 향을 경험할 수 있습니다.'
        WHEN up.name = 'La Vie Est Belle' THEN 'La Vie Est Belle은 당신이 선호하는 밝고 즐거운 바닐라 향을 완벽하게 구현합니다. 블랙커런트와 배가 첫인상에서 상큼함을 더하며, 자스민과 오렌지 블라썸이 중간 노트에서 플로럴함을 강화합니다. 베이스의 바닐라와 프랄린, 패출리가 달콤하고 따뜻한 마무리를 제공합니다. 당신이 선호하는 일상 및 주말 착용 상황에 적합하며, 기분 좋은 향을 경험할 수 있습니다.'
        WHEN up.name = 'Another 13' THEN 'Another 13은 당신이 선호하는 미니멀하고 깔끔한 향의 대표작입니다. 배와 알데하이드가 첫인상에서 깔끔함을 더하며, 앰브록산과 자스민 페탈이 중간 노트에서 미묘한 향을 만들어냅니다. 베이스의 모스와 머스크가 자연스러운 마무리를 제공합니다. 당신이 선호하는 다양한 취향과 잘 어울리며, 모든 상황에서 활용하기 좋은 범용적인 향입니다.'
        WHEN up.name = 'Good Girl' THEN 'Good Girl은 당신이 선호하는 세련되고 매력적인 향을 보여줍니다. 아몬드와 커피가 첫인상에서 독특함을 더하며, 튜베로즈와 자스민이 중간 노트에서 플로럴함을 강화합니다. 베이스의 통카 빈과 카카오, 패출리가 달콤하고 세련된 마무리를 제공합니다. 당신이 선호하는 저녁 시간이나 데이트에 착용하면 매력적이고 세련된 향을 경험할 수 있습니다.'
        ELSE '이 향수는 당신의 취향과 잘 맞습니다. 선호하는 노트가 포함되어 있으며, 선호하는 사용 상황에 적합합니다.'
      END
    ELSE
      CASE 
        WHEN up.name = 'Black Opium' THEN 'Black Opium은 당신이 비선호하는 과도하게 달콤한 바닐라 노트가 베이스에 강하게 포함되어 있습니다. 핑크 페퍼와 오렌지 블라썸이 첫인상에서 상큼함을 주려 하지만, 베이스의 바닐라와 패출리가 전체적으로 달콤한 느낌을 지배합니다. 당신이 싫어하는 바닐라, 캐러멜, 허니 계열의 향이 포함되어 있어 부담스러울 수 있습니다. 중성적인 취향을 선호하는 당신에게는 과도하게 달콤한 향이 부적합할 수 있습니다.'
        ELSE '이 향수는 당신의 취향과 잘 맞지 않을 수 있습니다. 비선호하는 노트가 포함되어 있거나, 선호하는 사용 상황과 맞지 않을 수 있습니다.'
      END
  END,
  'gpt-4',
  'v1',
  rr.created_at + interval '1 minute'
FROM public.recommendation_results rr
JOIN public.user_perfumes up ON up.id = rr.user_perfume_id
ON CONFLICT (recommendation_result_id) DO NOTHING;

-- ============================================================================
-- 데이터 삽입 완료 확인 쿼리
-- ============================================================================
-- 아래 쿼리로 데이터가 정상적으로 삽입되었는지 확인할 수 있습니다.

-- auth.users 사용자 수 확인
-- SELECT COUNT(*) as auth_user_count FROM auth.users WHERE email LIKE '%@test.scentory.local';

-- public.profiles 사용자 수 확인
-- SELECT COUNT(*) as profile_count FROM public.profiles;

-- 향수 수 확인
-- SELECT COUNT(*) as perfume_count FROM public.user_perfumes;

-- 추천 결과 수 확인
-- SELECT COUNT(*) as recommendation_count FROM public.recommendation_results;

-- AI 설명 수 확인
-- SELECT COUNT(*) as explanation_count FROM public.ai_explanations;

-- 사용자별 향수 및 추천 결과 확인
-- SELECT 
--   p.display_name,
--   COUNT(DISTINCT up.id) as perfume_count,
--   COUNT(DISTINCT rr.id) as recommendation_count
-- FROM public.profiles p
-- LEFT JOIN public.user_perfumes up ON up.user_id = p.id
-- LEFT JOIN public.recommendation_results rr ON rr.user_id = p.id
-- GROUP BY p.id, p.display_name
-- ORDER BY p.display_name;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
