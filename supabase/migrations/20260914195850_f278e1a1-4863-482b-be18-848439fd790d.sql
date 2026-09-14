
REVOKE EXECUTE ON FUNCTION public.bootstrap_profile(text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.buy_plan(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.complete_task(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_deposit(numeric,text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric,text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_review_deposit(uuid,boolean,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_review_withdrawal(uuid,boolean,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_balance(uuid,numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_banned(uuid,boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_expire_investment(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.distribute_daily_profits() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_task(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_deposit(numeric,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_deposit(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_withdrawal(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_balance(uuid,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_banned(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_expire_investment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.distribute_daily_profits() TO service_role;
