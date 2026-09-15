import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, ShieldAlert, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const [customRate, setCustomRate] = useState("280");
  const [targetPhone, setTargetPhone] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch pending deposits
  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  // Approve / Reject Handler
  const handleUpdateStatus = async (table: "deposits" | "withdrawals", id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Request successfully marked as ${status}`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Rate Update
  const handleUpdateRate = () => {
    localStorage.setItem("dollarcash_rate", customRate);
    toast.success(`Exchange rate updated to 1 USD = ${customRate} PKR`);
  };

  return (
    <AppShell title="Admin Superpower Panel" subtitle="Manage Deposits, Rates & Balances">
      <div className="space-y-6">
        {/* Controls Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Rate Controller */}
          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <RefreshCw className="size-5 text-primary" /> Exchange Rate Control
            </h2>
            <div className="mt-4 flex gap-2">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="rate">1 USD Rate in PKR</Label>
                <Input
                  id="rate"
                  type="number"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                />
              </div>
              <Button className="self-end" onClick={handleUpdateRate}>
                Save Rate
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="surface-card p-5 flex flex-col justify-center">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gold">
              <ShieldAlert className="size-5" /> Admin Mode Active
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Direct overrides are active. Any status update performed here instantly updates the database.
            </p>
          </div>
        </div>

        {/* Pending Deposits Table */}
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Deposit Requests</h2>
          {loadingDeposits ? (
            <p className="text-sm text-muted-foreground">Loading deposits...</p>
          ) : deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deposit requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">User / TID</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deposits.map((d: any) => (
                    <tr key={d.id}>
                      <td className="py-3">
                        <div className="font-semibold">{d.user_id?.slice(0, 8)}...</div>
                        <div className="text-xs text-muted-foreground">TID: {d.tid}</div>
                      </td>
                      <td className="py-3 font-semibold">
                        {usd(d.usd_amount)} <span className="text-xs text-muted-foreground">(Rs {d.pkr_amount})</span>
                      </td>
                      <td className="py-3">{d.method}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            d.status === "APPROVED"
                              ? "default"
                              : d.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {d.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus("deposits", d.id, "APPROVED")}
                            >
                              <Check className="size-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus("deposits", d.id, "REJECTED")}
                            >
                              <X className="size-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
