
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT right(regexp_replace(coalesce(p,''), '[^0-9]', '', 'g'), 10);
$$;

CREATE TABLE IF NOT EXISTS public.admin_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_normalized text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_phones TO authenticated;
GRANT ALL ON public.admin_phones TO service_role;
ALTER TABLE public.admin_phones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin phones read" ON public.admin_phones;
CREATE POLICY "admin phones read" ON public.admin_phones
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_phones (phone_normalized, label) VALUES
  (public.normalize_phone('+923133221347'), 'Main Owner'),
  (public.normalize_phone('+923485374133'), 'Co-Admin')
ON CONFLICT (phone_normalized) DO NOTHING;

UPDATE public.profiles p
SET phone = public.normalize_phone(split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.id = p.id AND p.phone IS NULL;

CREATE OR REPLACE FUNCTION public.claim_admin_access()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT public.normalize_phone(coalesce(p.phone, split_part(u.email,'@',1)))
    INTO v_phone
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = v_uid;

  IF v_phone IS NULL OR length(v_phone) < 10 THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_phones WHERE phone_normalized = v_phone) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles SET phone = v_phone WHERE id = v_uid AND coalesce(phone,'') <> v_phone;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_access() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_access() TO authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_profile(p_username text DEFAULT NULL::text, p_ref_code text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_code text;
  v_ref uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN RETURN; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  LOOP
    v_code := upper(substr(md5(gen_random_uuid()::text),1,8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
  END LOOP;
  IF p_ref_code IS NOT NULL AND length(trim(p_ref_code)) > 0 THEN
    SELECT id INTO v_ref FROM public.profiles WHERE referral_code = upper(trim(p_ref_code));
  END IF;
  INSERT INTO public.profiles (id, email, username, phone, referral_code, referred_by)
  VALUES (v_uid, v_email,
    COALESCE(NULLIF(trim(coalesce(p_username,'')),''), split_part(coalesce(v_email,'user'),'@',1)),
    public.normalize_phone(split_part(coalesce(v_email,''),'@',1)),
    v_code, v_ref);
  IF v_ref IS NOT NULL AND v_ref <> v_uid THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (v_ref, v_uid)
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;
END;
$function$;
