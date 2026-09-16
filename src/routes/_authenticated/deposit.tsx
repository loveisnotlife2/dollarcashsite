import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentMethods, useRate, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/deposit")({
  component: DepositPage,
});

function DepositPage() {
  const { data: methods = [] } = usePaymentMethods();
  const { data: rate = 280 } = useRate();
  const queryClient = useQueryClient();

  const activeMethods = methods.filter((m) => m.is_active);

  // Hardcoded EasyPaisa details fallback
  const currentPayment = {
    method: "EasyPaisa",
    account_title: "Quratulain",
    account_number: "03151390564",
  };

  const [method, setMethod] = useState<string>("EasyPaisa");
  const [amount, setAmount] = useState("");
  const [tid, setTid] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["my-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const usdAmount = Number(amount);
      if (!usdAmount || usdAmount <= 0) throw new Error("Enter a valid USD amount");
      if (!tid.trim()) throw new Error("Enter the transaction ID (TID)");

      let screenshotUrl: string | null = null;
      if (file) {
        const { data: auth } = await supabase.auth.getUser();
        const path = `${auth.user?.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("proofs").upload(path, file);
        if (upErr) throw upErr;
        screenshotUrl = path;
      }

      const { error } = await supabase.rpc("submit_deposit", {
        p_usd: usdAmount,
        p_method: currentPayment.method,
        p_tid: tid.trim(),
        p_screenshot_url: screenshotUrl ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deposit submitted. Status is PENDING until admin approval.");
      setAmount("");
      setTid("");
      setFile(null);
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Deposit failed"),
  });

  const pkr = Number(amount || 0) * rate;

  return (
    <AppShell title="Deposit" subtitle={`Live rate: 1 USD = ${rate} PKR`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">1. Enter amount</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount in USD</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5.00"
              />
              <p className="text-sm text-muted-foreground">
                You must send <span className="font-semibold text-foreground">Rs {pkr.toFixed(0)}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="flex gap-2">
                <Button type="button" variant="default">
                  EasyPaisa
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
            <h3 className="font-display text-sm font-bold">2. Send payment to</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Account title</dt>
                <dd className="font-semibold">{currentPayment.account_title}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  {currentPayment.account_number}
                  <button
                    type="button"
                    aria-label="Copy account number"
                    onClick={() => {
                      void navigator.clipboard.writeText(currentPayment.account_number);
                      toast.success("Account number copied");
                    }}
                  >
                    <Copy className="size-4 text-primary" />
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 space-y-4">
            <h3 className="font-display text-sm font-bold">3. Submit proof</h3>
            <div className="space-y-1.5">
              <Label htmlFor="tid">Transaction ID (TID)</Label>
              <Input id="tid" value={tid} onChange={(e) => setTid(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proof">Payment screenshot</Label>
              <Input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              <Upload className="size-4" /> Submit deposit request
            </Button>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">My deposits</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No deposits yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {history.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">
                      {usd(d.usd_amount)} · Rs {Number(d.pkr_amount).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.method} · TID {d.tid} · {new Date(d.created_at).toLocaleDateString()}
                    </p>
                    {d.reject_reason ? (
                      <p className="text-xs text-destructive">Reason: {d.reject_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-primary/15 text-primary">APPROVED</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">REJECTED</Badge>;
  return <Badge className="bg-gold/20 text-gold-foreground dark:text-gold">PENDING</Badge>;
}
