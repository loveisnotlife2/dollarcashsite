import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Wallet, 
  ShieldAlert, 
  Check, 
  X, 
  LayoutDashboard,
  Settings,
  ArrowUpRight,
  FileText
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

export function DashboardPage() {
  const [isAdminView, setIsAdminView] = useState(false);
  
  // Local Settings & Rates
  const [usdRate, setUsdRate] = useState(() => localStorage.getItem("dc_usd_rate") || "280");
  const [easypaisaNo, setEasypaisaNo] = useState(() => localStorage.getItem("dc_ep_no") || "03133221347");
  const [jazzcashNo, setJazzcashNo] = useState(() => localStorage.getItem("dc_jc_no") || "03133221347");

  // Local Mock Data
  const [currentUserPhone] = useState("03133221347");
  const [userBalance, setUserBalance] = useState(15.50);
  
  const [deposits, setDeposits] = useState([
    { id: "dep_1", user: "03151390564", amount: 10, method: "EasyPaisa", tid: "982312004", status: "PENDING" },
    { id: "dep_2", user: "03001234567", amount: 25, method: "JazzCash", tid: "871236122", status: "APPROVED" }
  ]);

  const [withdrawals, setWithdrawals] = useState([
    { id: "wd_1", user: "03129876543", amount: 5, method: "EasyPaisa", account: "03129876543", status: "PENDING" }
  ]);

  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; text: string }>>([
    { id: "init_1", text: `[${new Date().toLocaleTimeString()}] System initialized locally without database dependency.` }
  ]);

  // Check if logged in user is Master Admin
  const isAdminUser = currentUserPhone.includes("03133221347");

  const logAction = (msg: string) => {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: `[${new Date().toLocaleTimeString()}] ${msg}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Actions
  const handleApproveDeposit = (id: string, amount: number) => {
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" } : d)));
    setUserBalance((prev) => prev + amount);
    logAction(`Approved Deposit ${id} of $${amount}`);
    toast.success("Deposit Approved!");
  };

  const handleRejectDeposit = (id: string) => {
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status: "REJECTED" } : d)));
    logAction(`Rejected Deposit ${id}`);
    toast.error("Deposit Rejected");
  };

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: "APPROVED" } : w)));
    logAction(`Approved Withdrawal ${id}`);
    toast.success("Withdrawal Approved!");
  };

  const handleRejectWithdrawal = (id: string) => {
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: "REJECTED" } : w)));
    logAction(`Rejected Withdrawal ${id}`);
    toast.error("Withdrawal Rejected");
  };

  const handleSaveSettings = () => {
    localStorage.setItem("dc_usd_rate", usdRate);
    localStorage.setItem("dc_ep_no", easypaisaNo);
    localStorage.setItem("dc_jc_no", jazzcashNo);
    logAction(`Updated Numbers: EasyPaisa (${easypaisaNo}), JazzCash (${jazzcashNo}), Rate (${usdRate} PKR)`);
    toast.success("Payment Settings Saved!");
  };

  return (
    <AppShell 
      title={isAdminView && isAdminUser ? "Admin Control Panel" : "Dashboard"} 
      subtitle={isAdminView && isAdminUser ? "Local Master Controls" : "Welcome to DollarCash"}
    >
      <div className="space-y-6">
        {/* ADMIN TOGGLE BUTTON */}
        {isAdminUser && (
          <div className="flex justify-end">
            <Button
              variant={isAdminView ? "default" : "outline"}
              className={isAdminView ? "bg-amber-600 hover:bg-amber-700 text-white font-bold" : "border-amber-500/50 text-amber-500 font-bold"}
              onClick={() => setIsAdminView(!isAdminView)}
            >
              {isAdminView ? (
                <><LayoutDashboard className="mr-2 size-4" /> Switch to User View</>
              ) : (
                <><ShieldAlert className="mr-2 size-4 text-amber-500" /> 👑 Open Admin Panel</>
              )}
            </Button>
          </div>
        )}

        {/* ADMIN VIEW */}
        {isAdminView && isAdminUser ? (
          <div className="space-y-6">
            {/* Payment Numbers & Exchange Settings */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-4">
                <Settings className="size-5 text-emerald-500" /> Payment & Rate Settings
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>1 USD Rate (PKR)</Label>
                  <Input value={usdRate} onChange={(e) => setUsdRate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>EasyPaisa Number</Label>
                  <Input value={easypaisaNo} onChange={(e) => setEasypaisaNo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>JazzCash Number</Label>
                  <Input value={jazzcashNo} onChange={(e) => setJazzcashNo(e.target.value)} />
                </div>
              </div>
              <Button className="mt-4" onClick={handleSaveSettings}>Save Settings</Button>
            </div>

            {/* Deposits Management */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4">Deposit Requests</h2>
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
                    {deposits.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3">
                          <div className="font-semibold">{d.user}</div>
                          <div className="text-xs text-muted-foreground">TID: {d.tid}</div>
                        </td>
                        <td className="py-3 font-semibold">${d.amount}</td>
                        <td className="py-3">{d.method}</td>
                        <td className="py-3"><Badge>{d.status}</Badge></td>
                        <td className="py-3 text-right">
                          {d.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-emerald-600 text-white" onClick={() => handleApproveDeposit(d.id, d.amount)}><Check className="size-4" /> Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectDeposit(d.id)}><X className="size-4" /> Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawals Management */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <ArrowUpRight className="size-5 text-amber-500" /> Withdrawal Requests
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2">User / Account</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w) => (
                      <tr key={w.id}>
                        <td className="py-3">
                          <div className="font-semibold">{w.user}</div>
                          <div className="text-xs text-muted-foreground">{w.method}: {w.account}</div>
                        </td>
                        <td className="py-3 font-semibold">${w.amount}</td>
                        <td className="py-3"><Badge>{w.status}</Badge></td>
                        <td className="py-3 text-right">
                          {w.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-emerald-600 text-white" onClick={() => handleApproveWithdrawal(w.id)}><Check className="size-4" /> Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(w.id)}><X className="size-4" /> Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logs */}
            <div className="surface-card p-5 border border-border rounded-xl">
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                <FileText className="size-5 text-blue-500" /> Action Logs
              </h2>
              <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-muted/40 rounded">{log.text}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* REGULAR USER VIEW */
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Balance</p>
                  <h3 className="text-2xl font-bold mt-1">${userBalance.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-primary"><Wallet className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">1 USD Rate</p>
                  <h3 className="text-2xl font-bold mt-1">{usdRate} PKR</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><TrendingUp className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">EasyPaisa Account</p>
                  <h3 className="text-lg font-bold mt-1">{easypaisaNo}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><DollarSign className="size-5" /></div>
              </div>

              <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">JazzCash Account</p>
                  <h3 className="text-lg font-bold mt-1">{jazzcashNo}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users className="size-5" /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
