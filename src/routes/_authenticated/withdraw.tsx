import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MIN_WITHDRAWAL, usePaymentMethods, useProfile, useRate, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/withdraw")({
  component: WithdrawPage,
});

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
      {status}
    </span>
  );
}

function WithdrawPage() {
  const { data: profile } = useProfile();
  const { data: methods = [] } = usePaymentMethods();
  const { data: rate = 280 } = useRate();
  const queryClient = useQueryClient();

  const activeMethods = methods.filter((m) => m.is_active);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");

  const chosen = method || activeMethods[0]?.method || "EasyPaisa";

  const { data: history = [] } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!value || value < MIN_WITHDRAWAL)
        throw new Error(`Minimum withdrawal is ${usd(MIN_WITHDRAWAL)}`);
      if (!title.trim() || !number.trim()) throw new Error("Enter your account title and number");
      const { error } = await supabase.rpc("request_withdrawal", {
        p_usd: value,
        p_method: chosen,
        p_title: title.trim(),
        p_number: number.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted and is PENDING approval.");
      setAmount("");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Withdrawal failed"),
  });

  return (
    <AppShell
      title="Withdraw"
      subtitle={`Minimum ${usd(MIN_WITHDRAWAL)} · paid in PKR at 1 USD = ${rate} PKR`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</p>
          <p className="font-display text-3xl font-extrabold text-primary">
            {usd(profile?.balance)}
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wamount">Amount in USD</Label>
              <Input
                id="wamount"
                type="number"
                min={MIN_WITHDRAWAL}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.15"
              />
              <p className="text-sm text-muted-foreground">
                You receive about{" "}
                <span className="font-semibold text-foreground">
                  Rs {(Number(amount || 0) * rate).toFixed(0)}
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="flex gap-2">
                {(activeMethods.length ? activeMethods : [{ id: "1", method: "EasyPaisa" }]).map(
                  (m) => (
                    <Button
                      key={m.id}
                      type="button"
                      variant={chosen === m.method ? "default" : "outline"}
                      onClick={() => setMethod(m.method)}
                    >
                      {m.method}
                    </Button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acctitle">Account title</Label>
              <Input id="acctitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accnumber">Account number</Label>
              <Input
                id="accnumber"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              Request withdrawal
            </Button>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">My withdrawals</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No withdrawals yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {history.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{usd(w.usd_amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.method} · {w.account_title} · {w.account_number}
                    </p>
                    {w.reject_reason ? (
                      <p className="text-xs text-destructive">Reason: {w.reject_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={w.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
