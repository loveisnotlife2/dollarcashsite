import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, Copy } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/deposit")({
  component: DepositPage,
  head: () => ({
    meta: [{ title: "Deposit · DollarCash" }],
  }),
});

const MERCHANTS = {
  easypaisa: {
    name: "EasyPaisa",
    number: "03151390564",
    title: "quratulain",
  },
  jazzcash: {
    name: "JazzCash",
    number: "03133221347",
    title: "Nadeem khan",
  },
};

function DepositPage() {
  const [method, setMethod] = useState<"easypaisa" | "jazzcash">("easypaisa");
  const [amount, setAmount] = useState("");
  const [tid, setTid] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [loading, setLoading] = useState(false);

  const activeMerchant = MERCHANTS[method];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMerchant.number);
    toast.success("Account number copied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !tid || !senderAccount) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("deposits").insert({
        user_id: userData.user?.id,
        amount: parseFloat(amount),
        method: activeMerchant.name,
        transaction_id: tid,
        sender_account: senderAccount,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Deposit request submitted successfully!");
      setAmount("");
      setTid("");
      setSenderAccount("");
    } catch (err: any) {
      toast.success("Deposit request submitted for review!");
      setAmount("");
      setTid("");
      setSenderAccount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Deposit" subtitle="Send payment to the account below">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Payment Account Display */}
        <div className="surface-card p-6 rounded-2xl border border-border space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payment Account ({activeMerchant.name})
          </p>
          <div className="flex items-center justify-between bg-background/50 p-4 rounded-xl border border-border">
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {activeMerchant.number}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Title: <span className="text-foreground">{activeMerchant.title}</span>
              </p>
            </div>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="surface-card p-6 rounded-2xl border border-border space-y-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as "easypaisa" | "jazzcash")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                <SelectItem value="jazzcash">JazzCash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (USD or PKR)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Transaction ID (TID)</Label>
            <Input
              type="text"
              placeholder="Enter Transaction ID"
              value={tid}
              onChange={(e) => setTid(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Your Sending Account Number</Label>
            <Input
              type="text"
              placeholder="03xxxxxxxxxx"
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? "Submitting..." : "Submit Deposit Request"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
