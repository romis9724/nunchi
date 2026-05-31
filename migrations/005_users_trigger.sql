-- Migration 005: Auto-create public.users row on new auth.users sign-up
-- Google OAuth 로그인 시 public.users 행이 자동으로 생성된다.
-- role 기본값 'user', onboarding_completed_at NULL (온보딩 미완료 상태)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    role,
    industries,
    channels,
    company,
    brand,
    product_name,
    onboarding_completed_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    '{}',
    '{}',
    NULL,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 트리거: auth.users INSERT 후 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- /onboarding 강제 리다이렉트 헬퍼 함수:
-- API에서 onboarding_completed_at IS NULL이면 온보딩 미완료로 판단
COMMENT ON COLUMN public.users.onboarding_completed_at IS
  'NULL = 온보딩 미완료 (첫 로그인 후 /onboarding 강제). NOT NULL = 온보딩 완료.';
