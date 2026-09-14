import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlans, useProfile, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/plans")({
  component: PlansPage,
});

function PlansPage() {
  const { data: plans = [] } = usePlans();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const buy = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.rpc("buy_plan", { p_plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plan activated. Daily returns start tonight.");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not activate plan"),
  });

  return (
    <AppShell title="Investment plans" subtitle="Each plan runs for exactly 15 days">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const affordable = Number(profile?.balance ?? 0) >= Number(plan.cost);
          return (
            <div key={plan.id} className="surface-card flex flex-col p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {plan.name}
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold">{usd(plan.cost)}</p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <Row label="Daily return" value={usd(plan.daily_return)} accent />
                <Row label="Validity" value={`${plan.validity_days} days`} />
                <Row label="Total return" value={usd(plan.total_return)} gold />
              </dl>
              <Button
                className="mt-5"
                disabled={!affordable || buy.isPending}
                onClick={() => buy.mutate(plan.id)}
              >
                {affordable ? "Activate plan" : "Insufficient balance"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="surface-card mt-6 p-4 text-sm text-muted-foreground">
        Plan cost is deducted from your main balance. Returns are credited nightly at 12:00 AM
        Pakistan time, and the plan is marked EXPIRED exactly 15 days after activation.
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  accent,
  gold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          accent ? "font-semibold text-primary" : gold ? "font-semibold text-gold" : "font-semibold"
        }
      >
        {value}
      </dd>
    </div>
  );
}
