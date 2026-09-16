import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
  const [file, setFile] = useState<File | null>(null);
  const [myDeposits, setMyDeposits] = useState<any[]>([]);

  const easypaisaNo = localStorage.getItem("dc_ep_no") || "03133221347";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tid) {
      toast.error("Please enter Transaction ID (TID)");
      return;
    }

    const newDeposit = {
      id: `dep_${Date.now()}`,
      tid,
      method: "EasyPaisa",
      status: "PENDING",
      created_at: new Date().toLocaleTimeString(),
    };

    setMyDeposits([newDeposit, ...myDeposits]);
    toast.success("Deposit request submitted successfully!");
    setTid("");
    setFile(null);
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
              <Label>Transaction ID (TID)</Label>
              <Input 
                value={tid} 
                onChange={(e) => setTid(e.target.value)} 
                placeholder="Enter 11 digit TID" 
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Screenshot</Label>
              <Input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Submit Deposit Request
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
                    <p className="font-bold">TID: {d.tid}</p>
                    <p className="text-muted-foreground">{d.created_at}</p>
                  </div>
                  <Badge variant="outline">{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
            }
