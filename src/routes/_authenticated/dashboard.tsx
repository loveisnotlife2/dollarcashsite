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
                </div>

                <div className="surface-card p-5 border border-border rounded-xl">
                  <Wallet className="size-5 text-blue-500" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Total Balance
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatUsd(adminStats?.total_balance)}
                  </h3>
                </div>

              </div>

              {/* RATE */}
              <div className="surface-card p-5 border border-border rounded-xl">
                <h2 className="flex items-center gap-2 font-bold text-lg">
                  <RefreshCw className="size-5 text-emerald-500" />
                  USD / PKR Exchange Rate
                </h2>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <Label htmlFor="admin-rate">
                      1 USD = PKR
                    </Label>

                    <Input
                      id="admin-rate"
                      type="number"
                      min="1"
                      value={customRate || currentRate}
                      onChange={(e) =>
                        setCustomRate(e.target.value)
                      }
                    />
                  </div>

                  <Button
                    className="sm:self-end"
                    disabled={rateLoading}
                    onClick={handleUpdateRate}
                  >
                    <Save className="mr-2 size-4" />
                    {rateLoading ? "Saving..." : "Save Rate"}
                  </Button>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <Button
                  className="h-20"
                  onClick={() => setActiveTab("deposits")}
                >
                  <ArrowDownToLine className="mr-2 size-5" />
                  Deposits
                </Button>

                <Button
                  className="h-20"
                  variant="outline"
                  onClick={() => setActiveTab("withdrawals")}
                >
                  <ArrowUpFromLine className="mr-2 size-5" />
                  Withdrawals
                </Button>

                <Button
                  className="h-20"
                  variant="outline"
                  onClick={() => setActiveTab("plans")}
                >
                  <Package className="mr-2 size-5" />
                  Plans
                </Button>

                <Button
                  className="h-20"
                  variant="outline"
                  onClick={() => setActiveTab("users")}
                >
                  <Users className="mr-2 size-5" />
                  Users
                </Button>

              </div>
            </div>
          )}

          {/* =================================================
              DEPOSITS
          ================================================= */}
          {activeTab === "deposits" && (
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-bold text-lg mb-4">
                Deposit Requests
              </h2>

              {loadingDeposits ? (
                <p className="text-sm text-muted-foreground">
                  Loading deposits...
                </p>
              ) : deposits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deposit requests found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">User</th>
                        <th className="py-3 pr-4">Amount</th>
                        <th className="py-3 pr-4">Method</th>
                        <th className="py-3 pr-4">TID</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {deposits.map((deposit: any) => (
                        <tr key={deposit.id}>
                          <td className="py-3 pr-4">
                            <div className="font-medium">
                              {deposit.user_id?.slice(0, 8)}...
                            </div>
                          </td>

                          <td className="py-3 pr-4 font-semibold">
                            {formatUsd(deposit.usd_amount)}
                            <div className="text-xs text-muted-foreground">
                              Rs {Number(deposit.pkr_amount || 0).toFixed(2)}
                            </div>
                          </td>

                          <td className="py-3 pr-4">
                            {deposit.method}
                          </td>

                          <td className="py-3 pr-4">
                            {deposit.tid}
                          </td>

                          <td className="py-3 pr-4 text-xs">
                            {formatDate(deposit.created_at)}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {deposit.screenshot_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(
                                      deposit.screenshot_url,
                                      "_blank"
                                    )
                                  }
                                >
                                  Proof
                                </Button>
                              )}

                              {deposit.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleDepositReview(
                                        deposit.id,
                                        true
                                      )
                                    }
                                  >
                                    <Check className="mr-1 size-4" />
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleDepositReview(
                                        deposit.id,
                                        false
                                      )
                                    }
                                  >
                                    <X className="mr-1 size-4" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {deposit.status !== "PENDING" && (
                                <Badge
                                  variant={
                                    deposit.status === "APPROVED"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {deposit.status}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              WITHDRAWALS
          ================================================= */}
          {activeTab === "withdrawals" && (
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-bold text-lg mb-4">
                Withdrawal Requests
              </h2>

              {loadingWithdrawals ? (
                <p className="text-sm text-muted-foreground">
                  Loading withdrawals...
                </p>
              ) : withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No withdrawal requests found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">User</th>
                        <th className="py-3 pr-4">Amount</th>
                        <th className="py-3 pr-4">Method</th>
                        <th className="py-3 pr-4">Account</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {withdrawals.map((withdrawal: any) => (
                        <tr key={withdrawal.id}>
                          <td className="py-3 pr-4">
                            {withdrawal.user_id?.slice(0, 8)}...
                          </td>

                          <td className="py-3 pr-4 font-semibold">
                            {formatUsd(withdrawal.usd_amount)}
                          </td>

                          <td className="py-3 pr-4">
                            {withdrawal.method}
                          </td>

                          <td className="py-3 pr-4">
                            <div>
                              {withdrawal.account_title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {withdrawal.account_number}
                            </div>
                          </td>

                          <td className="py-3 pr-4 text-xs">
                            {formatDate(withdrawal.created_at)}
                          </td>

                          <td className="py-3 text-right">
                            {withdrawal.status === "PENDING" ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleWithdrawalReview(
                                      withdrawal.id,
                                      true
                                    )
                                  }
                                >
                                  <Check className="mr-1 size-4" />
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleWithdrawalReview(
                                      withdrawal.id,
                                      false
                                    )
                                  }
                                >
                                  <X className="mr-1 size-4" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant={
                                  withdrawal.status === "APPROVED"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {withdrawal.status}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              PLANS
          ================================================= */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              {loadingPlans ? (
                <div className="surface-card p-5 border border-border rounded-xl">
                  Loading plans...
                </div>
              ) : (
                plans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="surface-card p-5 border border-border rounded-xl"
                  >
                    {editingPlan === plan.id ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={planForm.name}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Cost</Label>
                          <Input
                            type="number"
                            value={planForm.cost}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                cost: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Daily Return</Label>
                          <Input
                            type="number"
                            value={planForm.daily_return}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                daily_return: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Validity Days</Label>
                          <Input
                            type="number"
                            value={planForm.validity_days}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                validity_days: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Total Return</Label>
                          <Input
                            type="number"
                            value={planForm.total_return}
                            onChange={(e) =>
                              setPlanForm({
                                ...planForm,
                                total_return: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
                          <Button
                            disabled={actionLoading}
                            onClick={() => savePlan(plan.id)}
                          >
                            <Save className="mr-2 size-4" />
                            Save Changes
                          </Button>

                          <Button
                            variant="outline"
                            onClick={cancelPlanEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">
                              {plan.name}
                            </h3>

                            <Badge
                              variant={
                                plan.is_active
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.is_active
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                            <div>
                              <span className="text-muted-foreground">
                                Cost
                              </span>
                              <div className="font-semibold">
                                {formatUsd(plan.cost)}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Daily
                              </span>
                              <div className="font-semibold">
                                {formatUsd(plan.daily_return)}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Validity
                              </span>
                              <div className="font-semibold">
                                {plan.validity_days} days
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Total
                              </span>
                              <div className="font-semibold">
                                {formatUsd(plan.total_return)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startPlanEdit(plan)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            disabled={actionLoading}
                            variant={
                              plan.is_active
                                ? "destructive"
                                : "default"
                            }
                            onClick={() =>
                              handlePlanToggle(
                                plan.id,
                                !plan.is_active
                              )
                            }
                          >
                            <Power className="mr-1 size-4" />
                            {plan.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* =================================================
              INVESTMENTS
          ================================================= */}
          {activeTab === "investments" && (
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-bold text-lg mb-4">
                User Investments
              </h2>

              {loadingInvestments ? (
                <p>Loading investments...</p>
              ) : investments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No investments found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">User</th>
                        <th className="py-3 pr-4">Plan ID</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Earned</th>
                        <th className="py-3 pr-4">Expires</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {investments.map((investment: any) => (
                        <tr key={investment.id}>
                          <td className="py-3 pr-4">
                            {investment.user_id?.slice(0, 8)}...
                          </td>

                          <td className="py-3 pr-4">
                            {investment.plan_id?.slice(0, 8)}...
                          </td>

                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                investment.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {investment.status}
                            </Badge>
                          </td>

                          <td className="py-3 pr-4 font-semibold">
                            {formatUsd(investment.total_earned)}
                          </td>

                          <td className="py-3 pr-4 text-xs">
                            {formatDate(investment.expires_at)}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {investment.status !== "ACTIVE" && (
                                <Button
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleInvestmentStatus(
                                      investment.id,
                                      "ACTIVE"
                                    )
                                  }
                                >
                                  <UserCheck className="mr-1 size-4" />
                                  Activate
                                </Button>
                              )}

                              {investment.status === "ACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleInvestmentStatus(
                                      investment.id,
                                      "DEACTIVATED"
                                    )
                                  }
                                >
                                  Deactivate
                                </Button>
                              )}

                              {investment.status !== "EXPIRED" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleInvestmentStatus(
                                      investment.id,
                                      "EXPIRED"
                                    )
                                  }
                                >
                                  Expire
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              USERS
          ================================================= */}
          {activeTab === "users" && (
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-bold text-lg mb-4">
                User Management
              </h2>

              {loadingUsers ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No users found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">User</th>
                        <th className="py-3 pr-4">Phone</th>
                        <th className="py-3 pr-4">Balance</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {users.map((user: any) => (
                        <tr key={user.id}>
                          <td className="py-3 pr-4">
                            <div className="font-semibold">
                              {user.username || "User"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email || "-"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {user.id?.slice(0, 12)}...
                            </div>
                          </td>

                          <td className="py-3 pr-4">
                            {user.phone || "-"}
                          </td>

                          <td className="py-3 pr-4 font-semibold">
                            {formatUsd(user.balance)}
                          </td>

                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                user.banned
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {user.banned
                                ? "BANNED"
                                : "ACTIVE"}
                            </Badge>
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleBalance(
                                    user.id,
                                    Number(user.balance || 0)
                                  )
                                }
                              >
                                <Wallet className="mr-1 size-4" />
                                Balance
                              </Button>

                              <Button
                                size="sm"
                                variant={
                                  user.banned
                                    ? "default"
                                    : "destructive"
                                }
                                disabled={
                                  actionLoading ||
                                  user.id === currentUserId
                                }
                                onClick={() =>
                                  handleBan(
                                    user.id,
                                    !user.banned
                                  )
                                }
                              >
                                {user.banned ? (
                                  <>
                                    <UserCheck className="mr-1 size-4" />
                                    Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-1 size-4" />
                                    Ban
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // NORMAL USER DASHBOARD
  // =========================================================

  return (
    <AppShell
      title="Dashboard"
      subtitle="Welcome to DollarCash"
    >
      <div className="space-y-6">

        {/* ADMIN BUTTON - ONLY DATABASE ADMIN */}
        {isAdminUser && (
          <div className="flex justify-end">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => {
                setIsAdminView(true);
                setActiveTab("overview");
              }}
            >
              <ShieldAlert className="mr-2 size-4" />
              👑 Open Admin Panel
            </Button>
          </div>
        )}

        {/* USER STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Total Balance
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatUsd(profile?.balance)}
              </h3>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Wallet className="size-5" />
            </div>
          </div>

          <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Total Earnings
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatUsd(totalEarned)}
              </h3>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <TrendingUp className="size-5" />
            </div>
          </div>

          <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Active Plan
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {activeInvestment ? "Active" : "No Plan"}
              </h3>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <DollarSign className="size-5" />
            </div>
          </div>

          <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Referrals
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {userReferrals.length}
              </h3>
            </div>

            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <Users className="size-5" />
            </div>
          </div>

        </div>

        {/* ACTIVE PLAN INFO */}
        {activeInvestment && (
          <div className="surface-card p-5 border border-border rounded-xl">
            <h2 className="font-bold text-lg">
              Your Active Investment
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Status
                </p>
                <Badge className="mt-1">
                  ACTIVE
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Earned
                </p>
                <p className="font-bold">
                  {formatUsd(activeInvestment.total_earned)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Expires
                </p>
                <p className="font-bold">
                  {formatDate(activeInvestment.expires_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid gap-4 sm:grid-cols-2">

          <a
            href="/deposit"
            className="surface-card p-5 border border-border rounded-xl hover:border-primary/50 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">
                Deposit Funds
              </h3>

              <p className="text-xs text-muted-foreground mt-1">
                Add funds via EasyPaisa / JazzCash
              </p>
            </div>

            <Button size="sm">
              Deposit
            </Button>
          </a>

          <a
            href="/withdraw"
            className="surface-card p-5 border border-border rounded-xl hover:border-primary/50 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-lg">
                Withdraw Earnings
              </h3>

              <p className="text-xs text-muted-foreground mt-1">
                Cash out your available balance
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
            >
              Withdraw
            </Button>
          </a>

        </div>

        {/* SECURITY INFO */}
        {isAdminUser && (
          <div className="surface-card p-4 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-500 mt-0.5" />

              <div>
                <p className="font-semibold">
                  Administrator access enabled
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Your admin controls are protected by the database
                  admin role.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
