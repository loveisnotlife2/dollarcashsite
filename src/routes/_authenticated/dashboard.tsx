import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  TrendingUp,
  Wallet,
  Clock,
  RefreshCw,
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

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [totalDeposit, setTotalDeposit] = useState(0);
  const [earning, setEarning] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [referEarning, setReferEarning] = useState(0);
  const [nextProfit, setNextProfit] = useState(0);

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

      /*
       * PROFILE
       */
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("balance, username, referral_code")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(profileError);
      }

      setProfile(profileData);

      /*
       * TOTAL DEPOSIT
       *
       * Only APPROVED deposits are counted.
       */
      const { data: deposits, error: depositError } =
        await supabase
          .from("deposits")
          .select("usd_amount")
          .eq("user_id", user.id)
          .eq("status", "APPROVED");

      if (depositError) {
        console.error("Deposit error:", depositError);
      }

      const depositTotal =
        deposits?.reduce(
          (sum, item) => sum + Number(item.usd_amount || 0),
          0
        ) ?? 0;

      setTotalDeposit(depositTotal);

      /*
       * DAILY PROFITS
       */
      const { data: dailyProfits, error: profitError } =
        await supabase
          .from("daily_profits")
          .select("amount")
          .eq("user_id", user.id);

      if (profitError) {
        console.error("Daily profit error:", profitError);
      }

      const dailyProfitTotal =
        dailyProfits?.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ) ?? 0;

      /*
       * TASK EARNINGS
       */
      const { data: tasks, error: taskError } =
        await supabase
          .from("task_completions")
          .select("reward")
          .eq("user_id", user.id);

      if (taskError) {
        console.error("Task error:", taskError);
      }

      const taskTotal =
        tasks?.reduce(
          (sum, item) => sum + Number(item.reward || 0),
          0
        ) ?? 0;

      /*
       * TOTAL EARNING
       *
       * Daily profit + paid task rewards.
       */
      setEarning(dailyProfitTotal + taskTotal);

      /*
       * REFERRAL EARNING
       *
       * Only paid bonuses are counted.
       */
      const { data: referrals, error: referralError } =
        await supabase
          .from("referrals")
          .select("bonus_amount")
          .eq("referrer_id", user.id)
          .eq("bonus_paid", true);

      if (referralError) {
        console.error("Referral error:", referralError);
      }

      const referralTotal =
        referrals?.reduce(
          (sum, item) =>
            sum + Number(item.bonus_amount || 0),
          0
        ) ?? 0;

      setReferEarning(referralTotal);

      /*
       * APPROVED WITHDRAWALS
       */
      const { data: withdrawals, error: withdrawalError } =
        await supabase
          .from("withdrawals")
          .select("usd_amount")
          .eq("user_id", user.id)
          .eq("status", "APPROVED");

      if (withdrawalError) {
        console.error(
          "Withdrawal error:",
          withdrawalError
        );
      }

      const withdrawalTotal =
        withdrawals?.reduce(
          (sum, item) =>
            sum + Number(item.usd_amount || 0),
          0
        ) ?? 0;

      setWithdraw(withdrawalTotal);

      /*
       * NEXT PROFIT
       *
       * Find active investment and its plan's
       * daily return.
       */
      const { data: activeInvestments, error: investmentError } =
        await supabase
          .from("investments")
          .select(`
            id,
            plan_id,
            status,
            plans (
              daily_return
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "ACTIVE");

      if (investmentError) {
        console.error(
          "Investment error:",
          investmentError
        );
      }

      let upcomingProfit = 0;

      for (const investment of activeInvestments ?? []) {
        const plan = Array.isArray(investment.plans)
          ? investment.plans[0]
          : investment.plans;

        if (plan?.daily_return) {
          upcomingProfit += Number(
            plan.daily_return
          );
        }
      }

      setNextProfit(upcomingProfit);
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
                {money(balance)}
              </p>

              <p className="text-xs text-muted-foreground">
                Your current DollarCash balance
              </p>
            </div>
          </div>
        </div>

        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

          {/* TOTAL DEPOSIT */}
          <DashboardCard
            icon={<ArrowDownToLine className="size-5" />}
            title="Total Deposit"
            value={money(totalDeposit)}
            href="/deposit"
          />

          {/* EARNING */}
          <DashboardCard
            icon={<TrendingUp className="size-5" />}
            title="Earning"
            value={money(earning)}
            href="/earning"
          />

          {/* WITHDRAW */}
          <DashboardCard
            icon={<ArrowUpFromLine className="size-5" />}
            title="Withdraw"
            value={money(withdraw)}
            href="/withdraw"
          />

          {/* REFER EARNING */}
          <DashboardCard
            icon={<Gift className="size-5" />}
            title="Refer Earning"
            value={money(referEarning)}
            href="/referral"
          />

          {/* NEXT PROFIT */}
          <DashboardCard
            icon={<Clock className="size-5" />}
            title="Next Profit"
            value={
              nextProfit > 0
                ? money(nextProfit)
                : "Pending"
            }
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

        {/* REFERRAL */}
        {profile?.referral_code && (
          <div className="surface-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gift className="size-5" />
              </div>

              <div>
                <h2 className="font-display text-lg font-bold">
                  Referral Code
                </h2>

                <p className="text-sm text-muted-foreground">
                  Share your code with friends.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-lg font-bold">
                {profile.referral_code}
              </p>
            </div>
          </div>
        )}

        {/* REFRESH */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw
              className={`mr-2 size-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            {loading
              ? "Loading..."
              : "Refresh Dashboard"}
          </Button>
        </div>

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
