import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Coins, TrendingUp, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { daysLeft, isActive, useInvestments, useProfile, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
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
          .reduce((sum, r) => sum + Number(r.bonus_amount), 0),
      };
    },
  });

  const { data: earnedTotal } = useQuery({
    queryKey: ["earned-total"],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_profits").select("amount");
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    },
  });

  const active = investments.filter(isActive);

  return (
    <AppShell title={`Hi ${profile?.username ?? "there"}`} subtitle="Your earning overview">
      <div className="gradient-hero mb-5 rounded-2xl p-5 text-navy-foreground">
        <p className="text-xs uppercase tracking-wider text-white/70">Main balance</p>
        <p className="mt-1 font-display text-4xl font-extrabold">{usd(profile?.balance)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/deposit">Deposit</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-white/40 bg-transparent text-navy-foreground hover:bg-white/10"
          >
            <Link to="/withdraw">Withdraw</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={TrendingUp} label="Active plans" value={String(active.length)} />
        <Stat icon={Coins} label="Daily profit earned" value={usd(earnedTotal ?? 0)} />
        <Stat icon={Users} label="Referrals" value={String(referralStats?.count ?? 0)} />
        <Stat icon={Coins} label="Referral earnings" value={usd(referralStats?.earned ?? 0)} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">My plans</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/plans">
            Buy a plan <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {investments.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            You have no plans yet. Activate a plan to start earning daily and unlock daily tasks.
          </p>
          <Button asChild className="mt-4">
            <Link to="/plans">View plans</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {investments.map((inv) => {
            const total = inv.plans?.validity_days ?? 15;
            const left = daysLeft(inv.expires_at);
            const done = Math.min(total, total - left);
            return (
              <div key={inv.id} className="surface-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold">{inv.plans?.name}</p>
                  {isActive(inv) ? (
                    <Badge className="bg-primary/15 text-primary">ACTIVE</Badge>
                  ) : (
                    <Badge variant="secondary">EXPIRED</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usd(inv.plans?.daily_return)} daily · earned {usd(inv.total_earned)}
                </p>
                <Progress className="mt-3" value={(done / total) * 100} />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  {isActive(inv)
                    ? `${left} of ${total} days left · expires ${new Date(inv.expires_at).toLocaleDateString()}`
                    : `Expired on ${new Date(inv.expires_at).toLocaleDateString()}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="surface-card mt-6 p-4 text-sm text-muted-foreground">
        Daily returns are credited automatically every night at 12:00 AM Pakistan time for each
        active plan.
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card p-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  );
}
