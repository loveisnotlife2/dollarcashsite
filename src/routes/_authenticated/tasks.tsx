import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ListChecks, Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TASK_REWARD, isActive, karachiToday, useInvestments, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { data: investments = [] } = useInvestments();
  const queryClient = useQueryClient();
  const active = investments.filter(isActive);

  const { data: doneToday = [] } = useQuery({
    queryKey: ["tasks-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("investment_id")
        .eq("task_date", karachiToday());
      if (error) throw error;
      return (data ?? []).map((r) => r.investment_id);
    },
  });

  const complete = useMutation({
    mutationFn: async (investmentId: string) => {
      const { error } = await supabase.rpc("complete_task", { p_investment_id: investmentId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${usd(TASK_REWARD)} added to your main balance`);
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Task failed"),
  });

  if (active.length === 0) {
    return (
      <AppShell title="Daily tasks" subtitle="Members only">
        <div className="surface-card flex flex-col items-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">Tasks are locked</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Daily tasks are for paid members only. Buy any plan to unlock one paid task per day per
            active plan, each worth {usd(TASK_REWARD)} in cash.
          </p>
          <Button asChild className="mt-5">
            <Link to="/plans">Upgrade / Buy plan to unlock tasks</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Daily tasks"
      subtitle={`One task per active plan each day · ${usd(TASK_REWARD)} cash each`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((inv) => {
          const done = doneToday.includes(inv.id);
          return (
            <div key={inv.id} className="surface-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ListChecks className="size-5" />
                </span>
                <div>
                  <p className="font-display font-bold">{inv.plans?.name} daily task</p>
                  <p className="text-xs text-muted-foreground">
                    Reward {usd(TASK_REWARD)} credited to main balance
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                disabled={done || complete.isPending}
                onClick={() => complete.mutate(inv.id)}
              >
                {done ? (
                  <>
                    <CheckCircle2 className="size-4" /> Completed today
                  </>
                ) : (
                  "Complete task"
                )}
              </Button>
            </div>
          );
        })}
      </div>
      <div className="surface-card mt-6 p-4 text-sm text-muted-foreground">
        Task limit resets every day at 12:00 AM Pakistan time. The reward is fixed cash only — no
        extra bonuses.
      </div>
    </AppShell>
  );
}
