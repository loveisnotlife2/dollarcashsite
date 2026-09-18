CREATE OR REPLACE FUNCTION public.claim_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT public.normalize_phone(
    COALESCE(
      NULLIF(u.phone, ''),
      NULLIF(p.phone, ''),
      NULLIF(split_part(COALESCE(u.email, ''), '@', 1), '')
    )
  )
  INTO v_phone
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = v_uid;

  IF v_phone IS NULL OR length(v_phone) < 10 THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_phones
    WHERE phone_normalized = v_phone
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET phone = v_phone
  WHERE id = v_uid;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_access() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.claim_admin_access()
TO authenticated;
