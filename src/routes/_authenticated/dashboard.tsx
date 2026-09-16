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
  UserX,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [isAdminView, setIsAdminView] = useState(false);
  const [customRate, setCustomRate] = useState("280");
  const [actionLoading, setActionLoading] = useState(false);

  // User Profile & Authentication Query
  const { data: userData } = useQuery({
    queryKey: ["user-profile-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return { user, profile };
    },
  });

  const profile = userData?.profile;
  const userObj = userData?.user;

  const phoneString = `${userObj?.phone || ""} ${profile?.phone || ""} ${profile?.mobile || ""}`;
  const isAuthorizedPhone = 
    phoneString.includes("03133221347") || 
    phoneString.includes("3133221347") || 
    phoneString.includes("+923133221347");

  const isAdminUser = isAuthorizedPhone || Boolean(profile?.is_admin) || ; 

  // Admin Queries: Deposits, Withdrawals & Users with Plans
  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: isAdminView && isAdminUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: isAdminView && isAdminUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  const { data: usersList = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users-list"],
    enabled: isAdminView && isAdminUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  // Action Handlers
  const handleUpdateDepositStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from("deposits").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Deposit ${status.toLowerCase()} successfully`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateWithdrawalStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Withdrawal ${status.toLowerCase()} successfully`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivatePlan = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate/delete active plan for this user?")) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active_plan_id: null })
        .eq("id", userId);

      if (error) throw error;
      toast.success("User plan deactivated successfully!");
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRate = () => {
    localStorage.setItem("dollarcash_rate", customRate);
    toast.success(`Exchange rate set to 1 USD = ${customRate} PKR`);
  };

  const formatUsd = (val?: number | null) => `$${Number(val || 0).toFixed(2)}`;

  return (
    <AppShell 
      title={isAdminView && isAdminUser ? "Admin Control Panel" : "Dashboard"} 
      subtitle={isAdminView && isAdminUser ? "Superpower Controls Active" : "Welcome to DollarCash"}
    >
      <div className="space-y-6">
        {isAdminUser && (
          <div className="flex justify-end">
            <Button
              variant={isAdminView ? "default" : "outline"}
              className={isAdminView ? "bg-amber-600 hover:bg-amber-700 text-white font-bold" : "border-amber-500/50 text-amber-500 font-bold"}
              onClick={() => setIsAdminView(!isAdminView)}
            >
              {isAdminView ? (
                <><LayoutDashboard className="mr-2 size-4" /> Switch to User View</>
              ) : (
                <><ShieldAlert className="mr-2 size-4 text-amber-500" /> 👑 Open Admin Panel</>
              )}
            </Button>
          </div>
        )}

        {/* FULL ADMIN VIEW */}
        {isAdminView && isAdminUser ? (
          <div className="space-y-6">
            {/* Exchange Rate Override */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <RefreshCw className="size-5 text-emerald-500" /> Exchange Rate Override
              </h2>
              <div className="mt-4 flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="rate">1 USD Rate in PKR</Label>
                  <Input id="rate" type="number" value={customRate} onChange={(e) => setCustomRate(e.target.value)} />
                </div>
                <Button className="self-end" onClick={handleUpdateRate}>Save Rate</Button>
              </div>
            </div>

            {/* Deposit Requests */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4">Deposit Requests</h2>
              {loadingDeposits ? (
                <p className="text-sm text-muted-foreground">Loading deposits...</p>
              ) : deposits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deposit requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">User / TID</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {deposits.map((d: any) => (
                        <tr key={d.id}>
                          <td className="py-3">
                            <div className="font-semibold">{d.user_id?.slice(0, 8)}...</div>
                            <div className="text-xs text-muted-foreground">TID: {d.tid}</div>
                          </td>
                          <td className="py-3 font-semibold">{formatUsd(d.usd_amount)}</td>
                          <td className="py-3">{d.method}</td>
                          <td className="py-3"><Badge>{d.status}</Badge></td>
                          <td className="py-3 text-right">
                            {d.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" className="bg-emerald-600" disabled={actionLoading} onClick={() => handleUpdateDepositStatus(d.id, "APPROVED")}><Check className="size-4" /></Button>
                                <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleUpdateDepositStatus(d.id, "REJECTED")}><X className="size-4" /></Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Withdrawal Requests */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <ArrowUpRight className="size-5 text-amber-500" /> Withdrawal Requests
              </h2>
              {loadingWithdrawals ? (
                <p className="text-sm text-muted-foreground">Loading withdrawals...</p>
              ) : withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No withdrawal requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">User / Account</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {withdrawals.map((w: any) => (
                        <tr key={w.id}>
                          <td className="py-3">
                            <div className="font-semibold">{w.account_number || w.user_id?.slice(0, 8)}</div>
                            <div className="text-xs text-muted-foreground">{w.method || "EasyPaisa/JazzCash"}</div>
                          </td>
                          <td className="py-3 font-semibold">{formatUsd(w.amount)}</td>
                          <td className="py-3"><Badge>{w.status}</Badge></td>
                          <td className="py-3 text-right">
                            {w.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" className="bg-emerald-600 text-white" disabled={actionLoading} onClick={() => handleUpdateWithdrawalStatus(w.id, "APPROVED")}><Check className="size-4" /> Approve</Button>
                                <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleUpdateWithdrawalStatus(w.id, "REJECTED")}><X className="size-4" /> Reject</Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Plan Deactivation & Management */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <UserX className="size-5 text-rose-500" /> User Plan Management
              </h2>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">User ID / Phone</th>
                        <th className="py-2">Active Plan</th>
                        <th className="py-2 text-right">Plan Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersList.map((u: any) => (
                        <tr key={u.id}>
                          <td className="py-3 font-medium">
                            {u.phone || u.id?.slice(0, 8)}
                          </td>
                          <td className="py-3">
                            {u.active_plan_id ? (
                              <Badge className="bg-emerald-600">Active ({u.active_plan_id})</Badge>
                            ) : (
                              <Badge variant="outline">No Plan</Badge>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {u.active_plan_id && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                disabled={actionLoading} 
                                onClick={() => handleDeactivatePlan(u.id)}
                              >
                                Deactivate Plan
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* REGULAR USER DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Balance</p>
                  <h3 className="text-2xl font-bold mt-1">{formatUsd(profile?.balance)}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-primary"><Wallet className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Earnings</p>
                  <h3 className="text-2xl font-bold mt-1">{formatUsd(profile?.total_earned)}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><TrendingUp className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Plan</p>
                  <h3 className="text-2xl font-bold mt-1">{profile?.active_plan_id ? "Active" : "No Plan"}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><DollarSign className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Referrals</p>
                  <h3 className="text-2xl font-bold mt-1">{profile?.referral_count ?? 0}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users className="size-5" /></div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a href="/deposit" className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Deposit Funds</h3>
                  <p className="text-xs text-muted-foreground mt-1">Add funds via EasyPaisa / JazzCash</p>
                </div>
                <Button size="sm">Deposit</Button>
              </a>

              <a href="/withdraw" className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Withdraw Earnings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Cash out your profits</p>
                </div>
                <Button size="sm" variant="outline">Withdraw</Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
    }
        
