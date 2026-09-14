
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "admin profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost numeric(12,2) NOT NULL,
  daily_return numeric(12,2) NOT NULL,
  validity_days int NOT NULL DEFAULT 15,
  total_return numeric(12,2) NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.plans FOR SELECT USING (true);

INSERT INTO public.plans (name, cost, daily_return, validity_days, total_return, sort_order) VALUES
 ('Plan 1', 1.00, 0.15, 15, 2.25, 1),
 ('Plan 2', 2.00, 0.25, 15, 3.75, 2),
 ('Plan 3', 5.00, 0.50, 15, 7.50, 3),
 ('Plan 4', 10.00, 1.00, 15, 15.00, 4);

-- INVESTMENTS
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  total_earned numeric(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investments read" ON public.investments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.daily_profits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  profit_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Karachi')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investment_id, profit_date)
);
GRANT SELECT ON public.daily_profits TO authenticated;
GRANT ALL ON public.daily_profits TO service_role;
ALTER TABLE public.daily_profits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profits read" ON public.daily_profits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  reward numeric(12,2) NOT NULL DEFAULT 0.15,
  task_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Karachi')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investment_id, task_date)
);
GRANT SELECT ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks read" ON public.task_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_paid boolean NOT NULL DEFAULT false,
  bonus_amount numeric(12,2) NOT NULL DEFAULT 0.10,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals read" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PAYMENTS
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL UNIQUE,
  account_title text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  qr_url text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "methods read" ON public.payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin methods write" ON public.payment_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.payment_methods (method, account_title, account_number) VALUES
 ('EasyPaisa','DollarCash Admin','03000000000'),
 ('JazzCash','DollarCash Admin','03010000000');

CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
GRANT SELECT ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin settings write" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.settings (key, value) VALUES ('usd_pkr_rate','280');

CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usd_amount numeric(12,2) NOT NULL,
  pkr_amount numeric(12,2) NOT NULL,
  rate numeric(12,2) NOT NULL,
  method text NOT NULL,
  tid text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'PENDING',
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deposits read" ON public.deposits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own deposits insert" ON public.deposits FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING');

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usd_amount numeric(12,2) NOT NULL,
  method text NOT NULL,
  account_title text NOT NULL,
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- BOOTSTRAP PROFILE
CREATE OR REPLACE FUNCTION public.bootstrap_profile(p_username text DEFAULT NULL, p_ref_code text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  INSERT INTO public.profiles (id, email, username, referral_code, referred_by)
  VALUES (v_uid, v_email, COALESCE(NULLIF(trim(coalesce(p_username,'')),''), split_part(coalesce(v_email,'user'),'@',1)), v_code, v_ref);
  IF v_ref IS NOT NULL AND v_ref <> v_uid THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (v_ref, v_uid)
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;
END;
$$;

-- BUY PLAN
CREATE OR REPLACE FUNCTION public.buy_plan(p_plan_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan public.plans;
  v_bal numeric;
  v_inv uuid;
  v_ref uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id AND is_active;
  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'Plan unavailable'; END IF;
  SELECT balance INTO v_bal FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF v_bal < v_plan.cost THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance = balance - v_plan.cost WHERE id = v_uid;
  INSERT INTO public.investments (user_id, plan_id, expires_at)
  VALUES (v_uid, v_plan.id, now() + (v_plan.validity_days || ' days')::interval)
  RETURNING id INTO v_inv;

  SELECT referrer_id INTO v_ref FROM public.referrals WHERE referred_id = v_uid AND NOT bonus_paid;
  IF v_ref IS NOT NULL THEN
    UPDATE public.referrals SET bonus_paid = true WHERE referred_id = v_uid;
    UPDATE public.profiles SET balance = balance + 0.10 WHERE id = v_ref;
  END IF;
  RETURN v_inv;
END;
$$;

-- COMPLETE TASK
CREATE OR REPLACE FUNCTION public.complete_task(p_investment_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ok boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT true INTO v_ok FROM public.investments
   WHERE id = p_investment_id AND user_id = v_uid AND status = 'ACTIVE' AND expires_at > now();
  IF NOT COALESCE(v_ok,false) THEN RAISE EXCEPTION 'No active plan for this task'; END IF;
  IF EXISTS (SELECT 1 FROM public.task_completions
              WHERE investment_id = p_investment_id
                AND task_date = (now() AT TIME ZONE 'Asia/Karachi')::date) THEN
    RAISE EXCEPTION 'Task already completed today';
  END IF;
  INSERT INTO public.task_completions (user_id, investment_id) VALUES (v_uid, p_investment_id);
  UPDATE public.profiles SET balance = balance + 0.15 WHERE id = v_uid;
  RETURN 0.15;
END;
$$;

-- DEPOSIT
CREATE OR REPLACE FUNCTION public.submit_deposit(p_usd numeric, p_method text, p_tid text, p_screenshot_url text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rate numeric;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_usd IS NULL OR p_usd <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT value::numeric INTO v_rate FROM public.settings WHERE key = 'usd_pkr_rate';
  INSERT INTO public.deposits (user_id, usd_amount, pkr_amount, rate, method, tid, screenshot_url)
  VALUES (v_uid, p_usd, round(p_usd * v_rate, 2), v_rate, p_method, p_tid, p_screenshot_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- WITHDRAW
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_usd numeric, p_method text, p_title text, p_number text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bal numeric;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_usd IS NULL OR p_usd < 0.15 THEN RAISE EXCEPTION 'Minimum withdrawal is $0.15'; END IF;
  SELECT balance INTO v_bal FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_bal < p_usd THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance = balance - p_usd WHERE id = v_uid;
  INSERT INTO public.withdrawals (user_id, usd_amount, method, account_title, account_number)
  VALUES (v_uid, p_usd, p_method, p_title, p_number) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ADMIN ACTIONS
CREATE OR REPLACE FUNCTION public.admin_review_deposit(p_id uuid, p_approve boolean, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = p_id FOR UPDATE;
  IF d.id IS NULL OR d.status <> 'PENDING' THEN RAISE EXCEPTION 'Deposit not pending'; END IF;
  IF p_approve THEN
    UPDATE public.deposits SET status = 'APPROVED' WHERE id = p_id;
    UPDATE public.profiles SET balance = balance + d.usd_amount WHERE id = d.user_id;
  ELSE
    UPDATE public.deposits SET status = 'REJECTED', reject_reason = p_reason WHERE id = p_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_withdrawal(p_id uuid, p_approve boolean, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = p_id FOR UPDATE;
  IF w.id IS NULL OR w.status <> 'PENDING' THEN RAISE EXCEPTION 'Withdrawal not pending'; END IF;
  IF p_approve THEN
    UPDATE public.withdrawals SET status = 'APPROVED' WHERE id = p_id;
  ELSE
    UPDATE public.withdrawals SET status = 'REJECTED', reject_reason = p_reason WHERE id = p_id;
    UPDATE public.profiles SET balance = balance + w.usd_amount WHERE id = w.user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_balance(p_user uuid, p_balance numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET balance = p_balance WHERE id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_banned(p_user uuid, p_banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET banned = p_banned WHERE id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_expire_investment(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.investments SET status = 'EXPIRED' WHERE id = p_id;
END;
$$;

-- ADMIN STATS
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r json;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'active_plans', (SELECT count(*) FROM public.investments WHERE status='ACTIVE' AND expires_at > now()),
    'pending_deposits', (SELECT count(*) FROM public.deposits WHERE status='PENDING'),
    'pending_withdrawals', (SELECT count(*) FROM public.withdrawals WHERE status='PENDING'),
    'total_balance', (SELECT COALESCE(sum(balance),0) FROM public.profiles)
  ) INTO r;
  RETURN r;
END;
$$;

-- DAILY DISTRIBUTION
CREATE OR REPLACE FUNCTION public.distribute_daily_profits()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row record;
  v_count int := 0;
  v_today date := (now() AT TIME ZONE 'Asia/Karachi')::date;
BEGIN
  FOR v_row IN
    SELECT i.id, i.user_id, p.daily_return
    FROM public.investments i
    JOIN public.plans p ON p.id = i.plan_id
    WHERE i.status = 'ACTIVE' AND i.expires_at > now()
      AND NOT EXISTS (SELECT 1 FROM public.daily_profits d WHERE d.investment_id = i.id AND d.profit_date = v_today)
  LOOP
    INSERT INTO public.daily_profits (investment_id, user_id, amount, profit_date)
    VALUES (v_row.id, v_row.user_id, v_row.daily_return, v_today);
    UPDATE public.profiles SET balance = balance + v_row.daily_return WHERE id = v_row.user_id;
    UPDATE public.investments SET total_earned = total_earned + v_row.daily_return WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;
  UPDATE public.investments SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at <= now();
  RETURN v_count;
END;
$$;
