import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Users, Wallet, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useInvestments, useIsAdmin, useProfile, isActive, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard | DollarCash" },
      {
        name: "description",
        content:
          "Track your DollarCash balance, active investment plans, daily earnings and referral rewards in one place.",
      },
      { property: "og:title", content: "Dashboard | DollarCash" },
      {
        property: "og:description",
        content: "Your DollarCash balance, plans, earnings and referrals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: investments = [] } = useInvestments();

  const { data: referralStats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { count: 0, earned: 0 };
      const { data, error } = await supabase
        .from("referrals")
        .select("bonus_paid, bonus_amount")
        .eq("referrer_id", auth.user.id);
      if (error) throw error;
      const rows = data ?? [];
      return {
        count: rows.length,
        earned: rows
          .filter((r) => r.bonus_paid)
          .reduce((sum, r) => sum + Number(r.bonus_amount ?? 0), 0),
      };
    },
  });

  const activePlans = investments.filter(isActive);
  const totalEarned = investments.reduce((s, i) => s + Number(i.total_earned ?? 0), 0);

  return (
    <AppShell title="Dashboard" subtitle="Welcome to DollarCash">
      <div className="space-y-6">
        {isAdmin && (
          <div className="flex justify-end">
            <Button asChild className="bg-gold text-navy hover:bg-gold/90">
              <Link to="/admin">
                <ShieldAlert className="mr-2 size-4" /> 👑 Open Admin Panel
              </Link>
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Balance"
            value={usd(profile?.balance)}
            icon={<Wallet className="size-5" />}
            tone="bg-primary/10 text-primary"
          />
          <StatCard
            label="Total Earnings"
            value={usd(totalEarned + Number(referralStats?.earned ?? 0))}
            icon={<TrendingUp className="size-5" />}
            tone="bg-emerald-500/10 text-emerald-500"
          />
          <StatCard
            label="Active Plans"
            value={activePlans.length > 0 ? `${activePlans.length} Active` : "No Plan"}
            icon={<DollarSign className="size-5" />}
            tone="bg-amber-500/10 text-amber-500"
          />
          <StatCard
            label="Referrals"
            value={String(referralStats?.count ?? 0)}
            icon={<Users className="size-5" />}
            tone="bg-blue-500/10 text-blue-500"
          />
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">Your active plans</h2>
          {activePlans.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              You have no active plan yet. Buy a plan to start earning daily.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activePlans.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-semibold">{inv.plans?.name ?? "Plan"}</p>
                    <p className="text-xs text-muted-foreground">
                      Daily {usd(inv.plans?.daily_return)} · Expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{usd(inv.total_earned)} earned</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <QuickLink to="/plans" title="Buy a Plan" text="Start earning daily returns" />
          <QuickLink to="/deposit" title="Deposit Funds" text="EasyPaisa / JazzCash" />
          <QuickLink to="/withdraw" title="Withdraw" text="Cash out your profits" />
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="surface-card flex items-center justify-between p-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <h3 className="mt-1 text-2xl font-bold">{value}</h3>
      </div>
      <div className={`rounded-lg p-3 ${tone}`}>{icon}</div>
    </div>
  );
}

function QuickLink({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link
      to={to}
      className="surface-card p-5 transition-colors hover:border-primary/50"
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}
