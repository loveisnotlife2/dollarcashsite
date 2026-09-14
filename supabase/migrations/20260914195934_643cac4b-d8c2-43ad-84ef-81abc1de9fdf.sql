
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "own profile read" ON public.profiles;
DROP POLICY "admin profile update" ON public.profiles;
DROP POLICY "own roles read" ON public.user_roles;
DROP POLICY "own investments read" ON public.investments;
DROP POLICY "own profits read" ON public.daily_profits;
DROP POLICY "own tasks read" ON public.task_completions;
DROP POLICY "own referrals read" ON public.referrals;
DROP POLICY "admin methods write" ON public.payment_methods;
DROP POLICY "admin settings write" ON public.settings;
DROP POLICY "own deposits read" ON public.deposits;
DROP POLICY "own withdrawals read" ON public.withdrawals;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "admin profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own investments read" ON public.investments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own profits read" ON public.daily_profits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own tasks read" ON public.task_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own referrals read" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "admin methods write" ON public.payment_methods FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "admin settings write" ON public.settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "own deposits read" ON public.deposits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_review_deposit(p_id uuid, p_approve boolean, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits;
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
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
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
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
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET balance = p_balance WHERE id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_banned(p_user uuid, p_banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET banned = p_banned WHERE id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_expire_investment(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.investments SET status = 'EXPIRED' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r json;
BEGIN
  IF NOT private.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
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

DROP FUNCTION public.has_role(uuid, public.app_role);
