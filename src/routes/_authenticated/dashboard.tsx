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
  LayoutDashboard 
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const queryClient = useQueryClient();
  const [isAdminView, setIsAdminView] = useState(false);
  const [customRate, setCustomRate] = useState("280");
  const [actionLoading, setActionLoading] = useState(false);

  // User Profile Query
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });

  // Admin Deposits Query
  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: isAdminView,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  // Deposit Status Handler
  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("deposits")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Deposit marked as ${status}`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRate = () => {
    localStorage.setItem("dollarcash_rate", customRate);
    toast.success(`Exchange rate set to 1 USD = ${customRate} PKR`);
  };

  const formatUsd = (val: number) => `$${Number(val || 0).toFixed(2)}`;

  return (
    <AppShell 
      title={isAdminView ? "Admin Control Panel" : "Dashboard"} 
      subtitle={isAdminView ? "Superpower Controls Active" : "Welcome to DollarCash"}
    >
      <div className="space-y-6">
        {/* Toggle Bar Between User Dashboard & Admin Mode */}
        <div className="flex justify-end">
          <Button
            variant={isAdminView ? "default" : "outline"}
            className={isAdminView ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-amber-500/50 text-amber-500"}
            onClick={() => setIsAdminView(!isAdminView)}
          >
            {isAdminView ? (
              <>
                <LayoutDashboard className="mr-2 size-4" /> Switch to User View
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 size-4" /> 👑 Open Admin Panel
              </>
            )}
          </Button>
        </div>

        {/* ADMIN VIEW MODE */}
        {isAdminView ? (
          <div className="space-y-6">
            <div className="surface-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <RefreshCw className="size-5 text-emerald-500" /> Exchange Rate Override
              </h2>
              <div className="mt-4 flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="rate">1 USD Rate in PKR</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                  />
                </div>
                <Button className="self-end" onClick={handleUpdateRate}>
                  Save Rate
                </Button>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="font-display text-lg font-bold mb-4">Deposit Requests Approval</h2>
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
                          <td className="py-3 font-semibold">
                            {formatUsd(d.usd_amount)} <span className="text-xs text-muted-foreground">(Rs {d.pkr_amount})</span>
                          </td>
                          <td className="py-3">{d.method}</td>
                          <td className="py-3">
                            <Badge
                              variant={
                                d.status === "APPROVED"
                                  ? "default"
                                  : d.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {d.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            {d.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateStatus(d.id, "APPROVED")}
                                >
                                  <Check className="size-4" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateStatus(d.id, "REJECTED")}
                                >
                                  <X className="size-4" /> Reject
                                </Button>
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
          </div>
        ) : (
          /* REGULAR USER DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Balance"
                value={formatUsd(profile?.balance)}
                icon={Wallet}
              />
              <StatCard
                title="Total Earnings"
                value={formatUsd(profile?.total_earned)}
                icon={TrendingUp}
              />
              <StatCard
                title="Active Plan"
                value={profile?.active_plan_id ? "Active" : "No Plan"}
                icon={DollarSign}
              />
              <StatCard
                title="Referrals"
                value={profile?.referral_count ?? 0}
                icon={Users}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="/deposit"
                className="surface-card p-5 hover:border-primary/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg">Deposit Funds</h3>
                  <p className="text-xs text-muted-foreground mt-1">Add funds via EasyPaisa / JazzCash</p>
                </div>
                <Button size="sm">Deposit</Button>
              </a>

              <a
                href="/withdraw"
                className="surface-card p-5 hover:border-primary/50 transition-colors flex items-center justify-between"
              >
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
