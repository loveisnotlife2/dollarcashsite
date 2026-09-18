import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard · DollarCash" }],
  }),
});

type Profile = {
  balance: number | null;
  username: string | null;
  referral_code: string | null;
};

function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Please sign in again.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("balance, username, referral_code")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Dashboard profile error:", error);
        toast.error("Unable to load dashboard.");
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const balance = Number(profile?.balance ?? 0);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Welcome back to DollarCash"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">

        {/* BALANCE */}
        <div className="surface-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">
            Available Balance
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>

            <div>
              <p className="font-display text-3xl font-extrabold">
                ${balance.toFixed(2)}
              </p>

              <p className="text-xs text-muted-foreground">
                Your current DollarCash balance
              </p>
            </div>
          </div>
        </div>

        {/* MAIN DASHBOARD CARDS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

          {/* TOTAL DEPOSIT */}
          <DashboardCard
            icon={<ArrowDownToLine className="size-5" />}
            title="Total Deposit"
            value="$0.00"
            href="/deposit"
          />

          {/* EARNING */}
          <DashboardCard
            icon={<TrendingUp className="size-5" />}
            title="Earning"
            value="$0.00"
            href="/earning"
          />

          {/* WITHDRAW */}
          <DashboardCard
            icon={<ArrowUpFromLine className="size-5" />}
            title="Withdraw"
            value="$0.00"
            href="/withdraw"
          />

          {/* REFER EARNING */}
          <DashboardCard
            icon={<Gift className="size-5" />}
            title="Refer Earning"
            value="$0.00"
            href="/referral"
          />

          {/* NEXT PROFIT */}
          <DashboardCard
            icon={<Clock className="size-5" />}
            title="Next Profit"
            value="Pending"
            href="/earning"
          />

        </div>

        {/* QUICK ACTIONS */}
        <div className="surface-card rounded-2xl border border-border p-6">
          <h2 className="font-display text-lg font-bold">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your DollarCash account.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <Button
              asChild
              className="h-11 w-full rounded-xl"
            >
              <Link to="/deposit">
                <ArrowDownToLine className="mr-2 size-4" />
                Deposit
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 w-full rounded-xl"
            >
              <Link to="/withdraw">
                <ArrowUpFromLine className="mr-2 size-4" />
                Withdraw
              </Link>
            </Button>

          </div>
        </div>

        {/* WELCOME / REFERRAL */}
        <div className="surface-card rounded-2xl border border-border p-6">

          <h2 className="font-display text-lg font-bold">
            {profile?.username
              ? `Welcome, ${profile.username}!`
              : "Welcome to DollarCash!"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your account is ready. Use the navigation to
            manage deposits, earnings, withdrawals and
            referrals.
          </p>

          {profile?.referral_code && (
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Your Referral Code
              </p>

              <p className="mt-1 font-mono text-lg font-bold">
                {profile.referral_code}
              </p>
            </div>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-sm text-muted-foreground">
            Loading dashboard...
          </p>
        )}

      </div>
    </AppShell>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="surface-card rounded-2xl border border-border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </Link>
  );
}
