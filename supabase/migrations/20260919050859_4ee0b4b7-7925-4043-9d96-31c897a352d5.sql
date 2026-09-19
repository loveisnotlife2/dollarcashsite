
-- 1. No negative balances ever
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_balance_non_negative CHECK (balance >= 0);

-- 2. Admins can manage plans (grants already present; policy was missing)
CREATE POLICY "admin plans write" ON public.plans
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- 3. Server-side referral milestone rewards
CREATE TABLE public.referral_milestone_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone integer NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone)
);

GRANT SELECT ON public.referral_milestone_claims TO authenticated;
GRANT ALL ON public.referral_milestone_claims TO service_role;

ALTER TABLE public.referral_milestone_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own milestone claims read" ON public.referral_milestone_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_referral_milestones()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_qualified integer;
  v_paid numeric := 0;
  v_m record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Qualified invite = referred user who actually activated a plan
  SELECT count(*) INTO v_qualified
  FROM public.referrals r
  WHERE r.referrer_id = v_uid
    AND EXISTS (SELECT 1 FROM public.investments i WHERE i.user_id = r.referred_id);

  FOR v_m IN
    SELECT * FROM (VALUES (5, 1.00), (10, 2.00), (25, 5.00), (50, 10.00))
      AS t(milestone, amount)
  LOOP
    IF v_qualified >= v_m.milestone THEN
      BEGIN
        INSERT INTO public.referral_milestone_claims (user_id, milestone, amount)
        VALUES (v_uid, v_m.milestone, v_m.amount);
        UPDATE public.profiles SET balance = balance + v_m.amount WHERE id = v_uid;
        v_paid := v_paid + v_m.amount;
      EXCEPTION WHEN unique_violation THEN
        NULL; -- already claimed
      END;
    END IF;
  END LOOP;

  RETURN v_paid;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_milestones() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral_milestones() TO authenticated;

-- 4. Admin check helper for the UI (authorization itself still enforced server-side)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT private.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. Validate admin balance adjustments
CREATE OR REPLACE FUNCTION public.admin_set_balance(p_user uuid, p_balance numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_balance IS NULL OR p_balance < 0 THEN RAISE EXCEPTION 'Balance must be zero or more'; END IF;
  IF p_balance > 1000000 THEN RAISE EXCEPTION 'Balance too large'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user) THEN RAISE EXCEPTION 'User not found'; END IF;
  UPDATE public.profiles SET balance = round(p_balance, 2) WHERE id = p_user;
END;
$$;

-- 6. Admin stats: include referral + task totals
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE r json;
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'active_plans', (SELECT count(*) FROM public.investments WHERE status='ACTIVE' AND expires_at > now()),
    'pending_deposits', (SELECT count(*) FROM public.deposits WHERE status='PENDING'),
    'pending_withdrawals', (SELECT count(*) FROM public.withdrawals WHERE status='PENDING'),
    'total_balance', (SELECT COALESCE(sum(balance),0) FROM public.profiles),
    'approved_deposits_usd', (SELECT COALESCE(sum(usd_amount),0) FROM public.deposits WHERE status='APPROVED'),
    'approved_withdrawals_usd', (SELECT COALESCE(sum(usd_amount),0) FROM public.withdrawals WHERE status='APPROVED'),
    'referrals', (SELECT count(*) FROM public.referrals),
    'tasks_today', (SELECT count(*) FROM public.task_completions WHERE task_date = (now() AT TIME ZONE 'Asia/Karachi')::date)
  ) INTO r;
  RETURN r;
END;
$$;
