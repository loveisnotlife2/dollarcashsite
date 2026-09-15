import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Users, Wallet, Shield } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
  });

  return (
    <AppShell title="Dashboard" subtitle="Welcome to DollarCash">
      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value={usd(profile?.balance ?? 0)}
            icon={Wallet}
          />
          <StatCard
            title="Total Earnings"
            value={usd(profile?.total_earned ?? 0)}
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

        {/* Navigation Quick Links */}
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

        {/* Admin Exclusive Button (Only for Admin) */}
        <div className="mt-8 pt-4 border-t border-border/40 text-center">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <Shield className="size-4" /> Open Admin Superpower Panel
          </a>
        </div>
      </div>
    </AppShell>
  );
}
