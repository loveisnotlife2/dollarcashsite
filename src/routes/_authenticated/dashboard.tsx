import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, ShieldAlert, ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";

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
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleUpdateStatus = async (table: "deposits" | "withdrawals", id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Request marked as ${status}`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRate = () => {
    localStorage.setItem("dollarcash_rate", customRate);
    toast.success(`Exchange rate set to 1 USD = ${customRate} PKR`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      {/* Admin Independent Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="size-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <ShieldAlert className="size-5" /> DollarCash Admin Panel
            </h1>
            <p className="text-xs text-slate-400">Superpower Manual Controls</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/40 text-amber-400">
          Root Access
        </Badge>
      </div>

      <div className="max-w-6xl mx-auto mt-6 space-y-6">
        {/* Control Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Exchange Rate Controller */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
              <RefreshCw className="size-4 text-emerald-400" /> PKR Exchange Rate Override
            </h2>
            <div className="mt-4 flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-slate-400">1 USD = PKR</Label>
                <Input
                  type="number"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <Button className="self-end bg-emerald-600 hover:bg-emerald-500" onClick={handleUpdateRate}>
                Save Rate
              </Button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
              <Layers className="size-4 text-amber-400" /> System Notice
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Approved deposits will instantly update backend state. Make sure transaction TIDs match EasyPaisa records before clicking Approve.
            </p>
          </div>
        </div>

        {/* Deposit Approval Table */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-md font-bold mb-4">Pending & Recent Deposits</h2>
          {loadingDeposits ? (
            <p className="text-sm text-slate-400">Loading deposits...</p>
          ) : deposits.length === 0 ? (
            <p className="text-sm text-slate-400">No deposit requests recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">User / TID</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deposits.map((d: any) => (
                    <tr key={d.id}>
                      <td className="py-3">
                        <div className="font-semibold">{d.user_id?.slice(0, 8)}...</div>
                        <div className="text-xs text-slate-400">TID: {d.tid}</div>
                      </td>
                      <td className="py-3 font-semibold">
                        {usd(d.usd_amount)} <span className="text-xs text-slate-400">(Rs {d.pkr_amount})</span>
                      </td>
                      <td className="py-3">{d.method}</td>
                      <td className="py-3">
                        <Badge
                          className={
                            d.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : d.status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
    </div>
  );
}
