import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  ShieldAlert,
  RefreshCw,
  Check,
  X,
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  UserCheck,
  Save,
  Power,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type Tab =
  | "overview"
  | "deposits"
  | "withdrawals"
  | "plans"
  | "investments"
  | "users";

type AdminRpcArgs = Record<string, unknown>;

async function adminRpc(functionName: string, args: AdminRpcArgs = {}) {
  const rpc = (supabase as any).rpc;
  const result = await rpc(functionName, args);

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

function DashboardPage() {
  const queryClient = useQueryClient();

  const [isAdminView, setIsAdminView] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [actionLoading, setActionLoading] = useState(false);

  const [customRate, setCustomRate] = useState("");
  const [rateLoading, setRateLoading] = useState(false);

  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    cost: "",
    daily_return: "",
    validity_days: "",
    total_return: "",
  });

  // =========================================================
  // CURRENT USER + PROFILE
  // =========================================================

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      return {
        ...data,
        auth_phone: user.phone || "",
        email: user.email || data?.email || "",
      };
    },
  });

  const currentUserId = profile?.id || null;

  // =========================================================
  // ADMIN ACCESS
  // claim_admin_access() checks the authorized phone numbers
  // and creates the admin role when appropriate.
  // =========================================================

  const { data: isAdminUser = false, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-access", currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: async () => {
      try {
        const claimResult = await adminRpc("claim_admin_access");

        if (claimResult !== true) {
          return false;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUserId!)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Admin role check:", error);
          return false;
        }

        return data?.role === "admin";
      } catch (error) {
        console.error("Admin access check:", error);
        return false;
      }
    },
  });

  // =========================================================
  // USER DASHBOARD DATA
  // =========================================================

  const { data: userInvestments = [] } = useQuery({
    queryKey: ["user-investments", currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", currentUserId!)
        .order("activated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: userReferrals = [] } = useQuery({
    queryKey: ["user-referrals", currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", currentUserId!);

      if (error) throw error;
      return data ?? [];
    },
  });

  const totalEarned = userInvestments.reduce(
    (sum: number, investment: any) =>
      sum + Number(investment.total_earned || 0),
    0
  );

  const activeInvestment = userInvestments.find(
    (investment: any) =>
      investment.status === "ACTIVE" &&
      new Date(investment.expires_at).getTime() > Date.now()
  );

  // =========================================================
  // ADMIN STATS
  // =========================================================

  const { data: adminStats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return await adminRpc("admin_stats");
    },
  });

  // =========================================================
  // ADMIN DATA
  // =========================================================

  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return (await adminRpc("admin_get_deposits")) || [];
    },
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return (await adminRpc("admin_get_withdrawals")) || [];
    },
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["admin-plans"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return (await adminRpc("admin_get_plans")) || [];
    },
  });

  const { data: investments = [], isLoading: loadingInvestments } = useQuery({
    queryKey: ["admin-investments"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return (await adminRpc("admin_get_investments")) || [];
    },
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      return (await adminRpc("admin_get_users")) || [];
    },
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    enabled: Boolean(isAdminUser && isAdminView),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "usd_pkr_rate")
        .maybeSingle();

      if (error) throw error;

      return data ? [data] : [];
    },
  });

  // =========================================================
  // HELPERS
  // =========================================================

  const formatUsd = (value?: number | string | null) =>
    `$${Number(value || 0).toFixed(2)}`;

  const formatDate = (value?: string | null) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-PK", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const refreshAdmin = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-investments"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
    ]);
  };

  // =========================================================
  // DEPOSIT APPROVE / REJECT
  // =========================================================

  const handleDepositReview = async (
    id: string,
    approve: boolean
  ) => {
    let reason: string | null = null;

    if (!approve) {
      reason = window.prompt("Enter rejection reason:") || null;
    }

    setActionLoading(true);

    try {
      await adminRpc("admin_review_deposit", {
        p_id: id,
        p_approve: approve,
        p_reason: reason,
      });

      toast.success(
        approve ? "Deposit approved successfully" : "Deposit rejected"
      );

      await refreshAdmin();
    } catch (error: any) {
      toast.error(error?.message || "Deposit action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // WITHDRAW APPROVE / REJECT
  // =========================================================

  const handleWithdrawalReview = async (
    id: string,
    approve: boolean
  ) => {
    let reason: string | null = null;

    if (!approve) {
      reason = window.prompt("Enter rejection reason:") || null;
    }

    setActionLoading(true);

    try {
      await adminRpc("admin_review_withdrawal", {
        p_id: id,
        p_approve: approve,
        p_reason: reason,
      });

      toast.success(
        approve
          ? "Withdrawal approved successfully"
          : "Withdrawal rejected"
      );

      await refreshAdmin();
    } catch (error: any) {
      toast.error(error?.message || "Withdrawal action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // EXCHANGE RATE
  // =========================================================

  const currentRate =
    customRate ||
    settings?.find((item: any) => item.key === "usd_pkr_rate")?.value ||
    "280";

  const handleUpdateRate = async () => {
    const rate = Number(customRate);

    if (!rate || rate <= 0) {
      toast.error("Enter a valid exchange rate");
      return;
    }

    setRateLoading(true);

    try {
      await adminRpc("admin_set_rate", {
        p_rate: rate,
      });

      toast.success(`1 USD = ${rate} PKR`);

      setCustomRate(String(rate));

      await queryClient.invalidateQueries({
        queryKey: ["settings"],
      });
    } catch (error: any) {
      toast.error(error?.message || "Could not update rate");
    } finally {
      setRateLoading(false);
    }
  };

  // =========================================================
  // PLAN ACTIVE / DEACTIVE
  // =========================================================

  const handlePlanToggle = async (
    planId: string,
    active: boolean
  ) => {
    setActionLoading(true);

    try {
      await adminRpc("admin_set_plan_active", {
        p_plan_id: planId,
        p_is_active: active,
      });

      toast.success(
        active ? "Plan activated" : "Plan deactivated"
      );

      await queryClient.invalidateQueries({
        queryKey: ["admin-plans"],
      });
    } catch (error: any) {
      toast.error(error?.message || "Plan action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // PLAN EDIT
  // =========================================================

  const startPlanEdit = (plan: any) => {
    setEditingPlan(plan.id);

    setPlanForm({
      name: String(plan.name || ""),
      cost: String(plan.cost || ""),
      daily_return: String(plan.daily_return || ""),
      validity_days: String(plan.validity_days || ""),
      total_return: String(plan.total_return || ""),
    });
  };

  const cancelPlanEdit = () => {
    setEditingPlan(null);

    setPlanForm({
      name: "",
      cost: "",
      daily_return: "",
      validity_days: "",
      total_return: "",
    });
  };

  const savePlan = async (planId: string) => {
    const cost = Number(planForm.cost);
    const dailyReturn = Number(planForm.daily_return);
    const validityDays = Number(planForm.validity_days);
    const totalReturn = Number(planForm.total_return);

    if (
      !planForm.name.trim() ||
      cost < 0 ||
      dailyReturn < 0 ||
      validityDays <= 0 ||
      totalReturn < 0
    ) {
      toast.error("Enter valid plan details");
      return;
    }

    setActionLoading(true);

    try {
      await adminRpc("admin_update_plan", {
        p_plan_id: planId,
        p_name: planForm.name.trim(),
        p_cost: cost,
        p_daily_return: dailyReturn,
        p_validity_days: validityDays,
        p_total_return: totalReturn,
      });

      toast.success("Plan updated successfully");

      cancelPlanEdit();

      await queryClient.invalidateQueries({
        queryKey: ["admin-plans"],
      });
    } catch (error: any) {
      toast.error(error?.message || "Could not update plan");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // INVESTMENT ACTIVATE / DEACTIVATE / EXPIRE
  // =========================================================

  const handleInvestmentStatus = async (
    investmentId: string,
    status: "ACTIVE" | "DEACTIVATED" | "EXPIRED"
  ) => {
    setActionLoading(true);

    try {
      await adminRpc("admin_set_investment_status", {
        p_investment_id: investmentId,
        p_status: status,
      });

      toast.success(`Investment set to ${status}`);

      await queryClient.invalidateQueries({
        queryKey: ["admin-investments"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-stats"],
      });
    } catch (error: any) {
      toast.error(error?.message || "Investment action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // USER BALANCE
  // =========================================================

  const handleBalance = async (
    userId: string,
    currentBalance: number
  ) => {
    const value = window.prompt(
      "Enter new USD balance:",
      String(currentBalance)
    );

    if (value === null) return;

    const balance = Number(value);

    if (!Number.isFinite(balance) || balance < 0) {
      toast.error("Invalid balance");
      return;
    }

    setActionLoading(true);

    try {
      await adminRpc("admin_set_balance", {
        p_user: userId,
        p_balance: balance,
      });

      toast.success("User balance updated");

      await refreshAdmin();
    } catch (error: any) {
      toast.error(error?.message || "Could not update balance");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // BAN / UNBAN
  // =========================================================

  const handleBan = async (
    userId: string,
    banned: boolean
  ) => {
    setActionLoading(true);

    try {
      await adminRpc("admin_set_banned", {
        p_user: userId,
        p_banned: banned,
      });

      toast.success(
        banned ? "User banned" : "User unbanned"
      );

      await queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    } catch (error: any) {
      toast.error(error?.message || "User action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingProfile || checkingAdmin) {
    return (
      <AppShell
        title="Dashboard"
        subtitle="Loading DollarCash..."
      >
        <div className="surface-card p-8 border border-border rounded-xl text-center">
          <RefreshCw className="mx-auto size-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading your dashboard...
          </p>
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // ADMIN PANEL
  // =========================================================

  if (isAdminView && isAdminUser) {
    return (
      <AppShell
        title="Admin Control Panel"
        subtitle="Secure database-protected administrator controls"
      >
        <div className="space-y-6">

          {/* ADMIN HEADER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                👑 DollarCash Admin
              </h2>
              <p className="text-sm text-muted-foreground">
                Only users with the admin database role can perform these actions.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setIsAdminView(false);
                setActiveTab("overview");
              }}
            >
              <LayoutDashboard className="mr-2 size-4" />
              User Dashboard
            </Button>
          </div>

          {/* ADMIN NAV */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["overview", "Overview"],
              ["deposits", "Deposits"],
              ["withdrawals", "Withdrawals"],
              ["plans", "Plans"],
              ["investments", "Investments"],
              ["users", "Users"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={
                  activeTab === value ? "default" : "outline"
                }
                onClick={() => setActiveTab(value as Tab)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* =================================================
              OVERVIEW
          ================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div className="surface-card p-5 border border-border rounded-xl">
                  <Users className="size-5 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Users
                  </p>
                  <h3 className="text-2xl font-bold">
                    {adminStats?.users ?? 0}
                  </h3>
                </div>

                <div className="surface-card p-5 border border-border rounded-xl">
                  <Package className="size-5 text-emerald-500" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Active Investments
                  </p>
                  <h3 className="text-2xl font-bold">
                    {adminStats?.active_plans ?? 0}
                  </h3>
                </div>

                <div className="surface-card p-5 border border-border rounded-xl">
                  <ArrowDownToLine className="size-5 text-amber-500" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Pending Deposits
                  </p>
                  <h3 className="text-2xl font-bold">
                    {adminStats?.pending_deposits ?? 0}
                  </h3>
                </div>

                <div className="surface-card p-5 border border-border rounded-xl">
                  <ArrowUpFromLine className="size-5 text-red-500" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Pending Withdrawals
                  </p>
                  <h3 className="text-2xl font-bold">
                    {adminStats?.pending_withdrawals ?? 0}
                  </h3>
 
