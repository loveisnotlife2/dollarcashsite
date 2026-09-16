import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
  const [loading, setLoading] = useState(true);
  
  // Real DB States
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [usdRate, setUsdRate] = useState("280");
  const [easypaisaNo, setEasypaisaNo] = useState("03133221347");
  const [jazzcashNo, setJazzcashNo] = useState("03133221347");

  const [deposits, setDeposits] = useState<any[]>([]);

  // Fetch Current User & App Settings from Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get Logged In User Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, balance")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.is_admin);
          setUserBalance(Number(profile.balance) || 0);
        }
      }

      // 2. Get Global Settings
      const { data: settings } = await supabase
        .from("settings")
        .select("*")
        .eq("id", true)
        .single();

      if (settings) {
        setUsdRate(settings.usd_rate?.toString() || "280");
        setEasypaisaNo(settings.easypaisa_number || "");
        setJazzcashNo(settings.jazzcash_number || "");
      }

      // 3. If Admin, Load All Pending Deposits
      const { data: depositList } = await supabase
        .from("deposits")
        .select("*, profiles(phone, full_name)")
        .order("created_at", { ascending: false });

      if (depositList) setDeposits(depositList);

    } catch (err: any) {
      toast.error("Data load karne me masla aaya: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings (Admin Only)
  const handleSaveSettings = async () => {
    const { error } = await supabase
      .from("settings")
      .update({
        usd_rate: parseFloat(usdRate),
        easypaisa_number: easypaisaNo,
        jazzcash_number: jazzcashNo,
        updated_at: new Date().toISOString()
      })
      .eq("id", true);

    if (error) {
      toast.error("Settings save nahi huin: " + error.message);
    } else {
      toast.success("Settings updated in Database!");
    }
  };

  // Approve Deposit (Admin Only)
  const handleApproveDeposit = async (depositId: string, userId: string, amount: number) => {
    try {
      // 1. Update Deposit Status
      const { error: depErr } = await supabase
        .from("deposits")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", depositId);

      if (depErr) throw depErr;

      // 2. Fetch current balance of user and update
      const { data: prof } = await supabase.from("profiles").select("balance").eq("id", userId).single();
      const currentBal = Number(prof?.balance || 0);

      await supabase
        .from("profiles")
        .update({ balance: currentBal + Number(amount) })
        .eq("id", userId);

      toast.success("Deposit Approved & Balance Added!");
      loadData();
    } catch (err: any) {
      toast.error("Approval failed: " + err.message);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async (depositId: string) => {
    const { error } = await supabase
      .from("deposits")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", depositId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.error("Deposit Rejected");
      loadData();
    }
  };

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex justify-center p-12"><RefreshCw className="animate-spin size-8 text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title={isAdminView && isAdmin ? "Admin Control Panel" : "Dashboard"}>
      <div className="space-y-6">
        {/* Real Admin Toggle (Database Enforced) */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              variant={isAdminView ? "default" : "outline"}
              className="bg-amber-600 text-white font-bold"
              onClick={() => setIsAdminView(!isAdminView)}
            >
              {isAdminView ? <><LayoutDashboard className="mr-2 size-4" /> User View</> : <><ShieldAlert className="mr-2 size-4" /> 👑 Open Admin Panel</>}
            </Button>
          </div>
        )}

        {/* ADMIN VIEW */}
        {isAdminView && isAdmin ? (
          <div className="space-y-6">
            <div className="surface-card p-5 border rounded-xl space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Settings className="size-5 text-emerald-500" /> Database Payment Settings</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label>1 USD Rate (PKR)</Label><Input value={usdRate} onChange={(e) => setUsdRate(e.target.value)} /></div>
                <div><Label>EasyPaisa Number</Label><Input value={easypaisaNo} onChange={(e) => setEasypaisaNo(e.target.value)} /></div>
                <div><Label>JazzCash Number</Label><Input value={jazzcashNo} onChange={(e) => setJazzcashNo(e.target.value)} /></div>
              </div>
              <Button onClick={handleSaveSettings}>Save to Database</Button>
            </div>

            <div className="surface-card p-5 border rounded-xl">
              <h2 className="font-bold mb-4">Deposit Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2">User / TID</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => (
                      <tr key={d.id} className="border-b">
                        <td className="py-3">
                          <div>{d.profiles?.phone || d.profiles?.full_name || "User"}</div>
                          <div className="text-xs text-muted-foreground">TID: {d.transaction_id || "N/A"}</div>
                        </td>
                        <td className="py-3 font-semibold">${d.amount}</td>
                        <td className="py-3 capitalize">{d.method}</td>
                        <td className="py-3"><Badge>{d.status}</Badge></td>
                        <td className="py-3 text-right">
                          {d.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-emerald-600" onClick={() => handleApproveDeposit(d.id, d.user_id, d.amount)}><Check className="size-4" /> Approve</Button>
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
          </div>
        ) : (
          /* REGULAR USER VIEW */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-5 border rounded-xl flex justify-between items-center">
              <div><p className="text-xs text-muted-foreground">Total Balance</p><h3 className="text-2xl font-bold">${userBalance.toFixed(2)}</h3></div>
              <Wallet className="size-5 text-primary" />
            </div>
            <div className="surface-card p-5 border rounded-xl flex justify-between items-center">
              <div><p className="text-xs text-muted-foreground">1 USD Rate</p><h3 className="text-2xl font-bold">{usdRate} PKR</h3></div>
              <TrendingUp className="size-5 text-emerald-500" />
            </div>
            <div className="surface-card p-5 border rounded-xl flex justify-between items-center">
              <div><p className="text-xs text-muted-foreground">EasyPaisa Account</p><h3 className="text-lg font-bold">{easypaisaNo}</h3></div>
              <DollarSign className="size-5 text-amber-500" />
            </div>
            <div className="surface-card p-5 border rounded-xl flex justify-between items-center">
              <div><p className="text-xs text-muted-foreground">JazzCash Account</p><h3 className="text-lg font-bold">{jazzcashNo}</h3></div>
              <Users className="size-5 text-blue-500" />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
