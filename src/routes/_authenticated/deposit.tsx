import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/deposit")({
  component: DepositPage,
});

export function DepositPage() {
  const [tid, setTid] = useState("");
  const [amount, setAmount] = useState("");
  const [easypaisaNo, setEasypaisaNo] = useState("Loading...");
  const [myDeposits, setMyDeposits] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Payment Info & My Deposits
  const loadDepositData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch EasyPaisa Number from Settings
    const { data: settings } = await supabase.from("settings").select("easypaisa_number").eq("id", true).single();
    if (settings) setEasypaisaNo(settings.easypaisa_number);

    // Fetch User's Own Deposits
    if (user) {
      const { data: deposits } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (deposits) setMyDeposits(deposits);
    }
  };

  useEffect(() => {
    loadDepositData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tid || !amount) {
      toast.error("Transaction ID aur Amount dono zaroori hain!");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Aap logged in nahi hain");

      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        method: "easypaisa",
        transaction_id: tid,
        status: "pending"
      });

      if (error) throw error;

      toast.success("Deposit request successfully submit ho gayi!");
      setTid("");
      setAmount("");
      loadDepositData();
    } catch (err: any) {
      toast.error("Submit nahi ho saka: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Deposit" subtitle="Add funds to your wallet">
      <div className="max-w-md mx-auto space-y-6">
        <div className="surface-card p-5 border border-border rounded-xl space-y-4">
          <Badge className="bg-emerald-700">EasyPaisa</Badge>
          <div className="p-3 bg-muted/40 rounded-lg">
            <p className="text-xs text-muted-foreground">Account title: Quratulain</p>
            <p className="font-bold text-lg">{easypaisaNo}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input 
                type="number"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Enter amount (e.g. 10)" 
              />
            </div>

            <div className="space-y-1.5">
              <Label>Transaction ID (TID)</Label>
              <Input 
                value={tid} 
                onChange={(e) => setTid(e.target.value)} 
                placeholder="Enter TID number" 
              />
            </div>

            <Button disabled={submitting} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {submitting ? "Submitting..." : "Submit Deposit Request"}
            </Button>
          </form>
        </div>

        <div className="surface-card p-5 border border-border rounded-xl">
          <h3 className="font-bold mb-3">My Deposits</h3>
          {myDeposits.length === 0 ? (
            <p className="text-xs text-muted-foreground">No deposits yet.</p>
          ) : (
            <div className="space-y-2">
              {myDeposits.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                  <div>
                    <p className="font-bold">${d.amount} - TID: {d.transaction_id}</p>
                    <p className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
