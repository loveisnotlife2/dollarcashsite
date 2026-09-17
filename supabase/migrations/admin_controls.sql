-- ============================================
-- DOLLARCASH - ADMIN CONTROLS
-- Uses private.has_role() for authorization
-- ============================================

-- PLAN: activate / deactivate
CREATE OR REPLACE FUNCTION public.admin_set_plan_active(
  p_plan_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.plans
  SET is_active = p_is_active
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
END;
$$;


-- PLAN: edit details
CREATE OR REPLACE FUNCTION public.admin_update_plan(
  p_plan_id uuid,
  p_name text,
  p_cost numeric,
  p_daily_return numeric,
  p_validity_days integer,
  p_total_return numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_cost < 0
     OR p_daily_return < 0
     OR p_validity_days <= 0
     OR p_total_return < 0 THEN
    RAISE EXCEPTION 'Invalid plan values';
  END IF;

  UPDATE public.plans
  SET
    name = p_name,
    cost = p_cost,
    daily_return = p_daily_return,
    validity_days = p_validity_days,
    total_return = p_total_return
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
END;
$$;


-- USER INVESTMENT: activate / deactivate / expire
CREATE OR REPLACE FUNCTION public.admin_set_investment_status(
  p_investment_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_status NOT IN ('ACTIVE', 'DEACTIVATED', 'EXPIRED') THEN
    RAISE EXCEPTION 'Invalid investment status';
  END IF;

  UPDATE public.investments
  SET status = p_status
  WHERE id = p_investment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment not found';
  END IF;
END;
$$;


-- EXCHANGE RATE
CREATE OR REPLACE FUNCTION public.admin_set_rate(
  p_rate numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_rate <= 0 THEN
    RAISE EXCEPTION 'Invalid exchange rate';
  END IF;

  UPDATE public.settings
  SET value = p_rate::text
  WHERE key = 'usd_pkr_rate';

  IF NOT FOUND THEN
    INSERT INTO public.settings (key, value)
    VALUES ('usd_pkr_rate', p_rate::text);
  END IF;
END;
$$;


-- ADMIN READ: USERS
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.profiles
  ORDER BY created_at DESC;
END;
$$;


-- ADMIN READ: DEPOSITS
CREATE OR REPLACE FUNCTION public.admin_get_deposits()
RETURNS SETOF public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.deposits
  ORDER BY created_at DESC;
END;
$$;


-- ADMIN READ: WITHDRAWALS
CREATE OR REPLACE FUNCTION public.admin_get_withdrawals()
RETURNS SETOF public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.withdrawals
  ORDER BY created_at DESC;
END;
$$;


-- ADMIN READ: INVESTMENTS
CREATE OR REPLACE FUNCTION public.admin_get_investments()
RETURNS SETOF public.investments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.investments
  ORDER BY activated_at DESC;
END;
$$;


-- ADMIN READ: PLANS
CREATE OR REPLACE FUNCTION public.admin_get_plans()
RETURNS SETOF public.plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.plans
  ORDER BY sort_order ASC;
END;
$$;


-- ============================================
-- PERMISSIONS
-- ============================================

REVOKE ALL ON FUNCTION public.admin_set_plan_active(uuid, boolean)
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_update_plan(
  uuid, text, numeric, numeric, integer, numeric
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_set_investment_status(uuid, text)
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_set_rate(numeric)
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_get_users()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_get_deposits()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_get_withdrawals()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_get_investments()
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.admin_get_plans()
FROM PUBLIC, anon;


GRANT EXECUTE ON FUNCTION public.admin_set_plan_active(uuid, boolean)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_plan(
  uuid, text, numeric, numeric, integer, numeric
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_set_investment_status(uuid, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_set_rate(numeric)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_users()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_deposits()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_withdrawals()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_investments()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_plans()
TO authenticated;
