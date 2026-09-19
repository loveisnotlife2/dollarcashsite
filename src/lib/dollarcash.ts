import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MIN_WITHDRAWAL = 0.15;
export const TASK_REWARD = 0.15;
export const REFERRAL_BONUS = 0.1;

export const usd = (n: number | string | null | undefined) =>
  `$${Number(n ?? 0).toFixed(2)}`;

export type Plan = {
  id: string;
  name: string;
  cost: number;
  daily_return: number;
  validity_days: number;
  total_return: number;
  sort_order: number;
  is_active: boolean;
};

export type Investment = {
  id: string;
  plan_id: string;
  activated_at: string;
  expires_at: string;
  status: string;
  total_earned: number;
  plans: Plan | null;
};

export function useSessionUser() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Admin check. Authorization is enforced in the database (RLS + SECURITY DEFINER
 * functions); this only decides whether the admin UI is offered.
 */
export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      // Owner phone numbers listed in the database can claim the admin role.
      await supabase.rpc("claim_admin_access");
      const { data, error } = await supabase.rpc("is_admin");
      if (error) return false;
      return Boolean(data);
    },
    staleTime: 60_000,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, plans(*)")
        .order("activated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Investment[];
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").order("method");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRate() {
  return useQuery({
    queryKey: ["usd-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "usd_pkr_rate")
        .maybeSingle();
      if (error) throw error;
      return Number(data?.value ?? 280);
    },
  });
}

export const isActive = (inv: Investment) =>
  inv.status === "ACTIVE" && new Date(inv.expires_at).getTime() > Date.now();

export const karachiToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

export const daysLeft = (expiresAt: string) =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
