import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  ShieldAlert,
  LayoutDashboard,
  Settings,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  transaction_id: string | null;
  sender_account: string | null;
  status: string;
  created_at: string;
};

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_number: string;
  account_name: string | null;
  status: string;
  created_at: string;
};

export function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState(0);

  const [usdRate, setUsdRate] = useState("280");
  const [easypaisaNo, setEasypaisaNo] = useState("");
  const [jazzcashNo, setJazzcashNo] = useState("");

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login again.");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("balance, is_admin")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      setBalance(Number(profile?.balance ?? 0));

      // IMPORTANT:
      // Admin panel is shown ONLY when is_admin is real boolean true.
      const adminStatus = profile?.is_admin === true;

      setIsAdmin(adminStatus);

      // Normal users can never enter admin view.
      if (!adminStatus) {
        setIsAdminView(false);
      }

      const { data: settings, error: settingsError } =
        await supabase
          .from("settings")
          .select("*")
          .eq("id", true)
          .single();

      if (settingsError) {
        throw settingsError;
      }

      if (settings) {
        setUsdRate(String(settings.usd_rate ?? 280));
        setEasypaisaNo(settings.easypaisa_number ?? "");
        setJazzcashNo(settings.jazzcash_number ?? "");
      }

      if (adminStatus) {
        await loadAdminData();
      }
    } catch (error) {
      console.error(error);
      toast.error("Dashboard load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    if (!isAdmin && !isAdminView) {
      return;
    }

    const { data: depositData, error: depositError } =
      await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });

    if (depositError) {
      console.error(depositError);
      toast.error("Could not load deposits.");
    } else {
      setDeposits(depositData ?? []);
    }

    const {
      data: withdrawalData,
      error: withdrawalError,
    } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (withdrawalError) {
      console.error(withdrawalError);
      toast.error("Could not load withdrawals.");
    } else {
      setWithdrawals(withdrawalData ?? []);
    }
  }

  async function approveDeposit(deposit: Deposit) {
    if (isAdmin !== true) return;

    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id)
        .eq("status", "pending");

      if (error) throw error;

      const { data: userProfile, error: userError } =
        await supabase
          .from("profiles")
          .select("balance")
          .eq("id", deposit.user_id)
          .single();

      if (userError) throw userError;

      const newBalance =
        Number(userProfile?.balance ?? 0) +
        Number(deposit.amount);

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.user_id);

      if (balanceError) throw balanceError;

      toast.success("Deposit approved.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Deposit approval failed.");
    }
  }

  async function rejectDeposit(deposit: Deposit) {
    if (isAdmin !== true) return;

    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id)
        .eq("status", "pending");

      if (error) throw error;

      toast.success("Deposit rejected.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Deposit rejection failed.");
    }
  }

  async function approveWithdrawal(
    withdrawal: Withdrawal
  ) {
    if (isAdmin !== true) return;

    try {
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("balance")
          .eq("id", withdrawal.user_id)
          .single();

      if (profileError) throw profileError;

      if (
        Number(profile?.balance ?? 0) <
        Number(withdrawal.amount)
      ) {
        toast.error("User does not have enough balance.");
        return;
      }

      const { error: withdrawalError } =
        await supabase
          .from("withdrawals")
          .update({
            status: "approved",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.id)
          .eq("status", "pending");

      if (withdrawalError) throw withdrawalError;

      const newBalance =
        Number(profile?.balance ?? 0) -
        Number(withdrawal.amount);

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.user_id);

      if (balanceError) throw balanceError;

      toast.success("Withdrawal approved.");
      await loadDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Withdrawal approval failed.");
    }
  }

  async function rejectWithdrawal(
    withdrawal: Withdrawal
  ) {
    if (isAdmin !== true) return;

    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id)
        .eq("status", "pending");

      if (error) throw error;

      toast.success("Withdrawal rejected.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      toast.error("Withdrawal rejection failed.");
    }
  }

  async function saveSettings() {
    if (isAdmin !== true) return;

    try {
      const { error } = await supabase
        .from("settings")
        .update({
          usd_rate: Number(usdRate),
          easypaisa_number: easypaisaNo,
          jazzcash_number: jazzcashNo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true);

      if (error) throw error;

      toast.success("Payment settings updated.");
    } catch (error) {
      console.error(error);
      toast.error("Settings update failed.");
    }
  }

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="p-6">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={
        isAdmin === true && isAdminView
          ? "Admin Control Panel"
          : "Dashboard"
      }
    >
      <div className="space-y-6">

        {/* ADMIN BUTTON - ONLY ADMIN CAN SEE THIS */}
        {isAdmin === true && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setIsAdminView((value) => !value);
              }}
            >
              {isAdminView ? (
                <>
                  <LayoutDashboard className="mr-2 size-4" />
                  User View
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2 size-4" />
                  Open Admin Panel
                </>
              )}
            </Button>
          </div>
        )}

        {/* NORMAL USER DASHBOARD */}
        {isAdminView === false && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="surface-card rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                Total Balance
              </p>

              <h3 className="text-2xl font-bold">
                ${balance.toFixed(2)}
              </h3>

              <Wallet className="mt-2 size-5" />
            </div>

            <div className="surface-card rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                1 USD Rate
              </p>

              <h3 className="text-2xl font-bold">
                {usdRate} PKR
              </h3>

              <TrendingUp className="mt-2 size-5" />
            </div>

            <div className="surface-card rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                EasyPaisa
              </p>

              <h3 className="text-lg font-bold">
                {easypaisaNo}
              </h3>

              <DollarSign className="mt-2 size-5" />
            </div>

            <div className="surface-card rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                JazzCash
              </p>

              <h3 className="text-lg font-bold">
                {jazzcashNo}
              </h3>

              <Users className="mt-2 size-5" />
            </div>

          </div>
        )}

        {/* ADMIN PANEL */}
        {isAdmin === true && isAdminView === true && (
          <div className="space-y-6">

            {/* PAYMENT SETTINGS */}
            <div className="surface-card space-y-4 rounded-xl border p-5">

              <h2 className="flex items-center gap-2 font-bold">
                <Settings className="size-5" />
                Payment Settings
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <Label>USD Rate</Label>

                  <Input
                    value={usdRate}
                    onChange={(e) =>
                      setUsdRate(e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>EasyPaisa Number</Label>

                  <Input
                    value={easypaisaNo}
                    onChange={(e) =>
                      setEasypaisaNo(e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>JazzCash Number</Label>

                  <Input
                    value={jazzcashNo}
                    onChange={(e) =>
                      setJazzcashNo(e.target.value)
                    }
                  />
                </div>

              </div>

              <Button onClick={saveSettings}>
                Save Settings
              </Button>

            </div>

            {/* DEPOSITS */}
            <div className="surface-card rounded-xl border p-5">

              <h2 className="mb-4 font-bold">
                Deposit Requests
              </h2>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="border-b">

                      <th className="py-2 text-left">
                        Amount
                      </th>

                      <th className="py-2 text-left">
                        Method
                      </th>

                      <th className="py-2 text-left">
                        TID
                      </th>

                      <th className="py-2 text-left">
                        Status
                      </th>

                      <th className="py-2 text-right">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {deposits.map((deposit) => (
                      <tr
                        key={deposit.id}
                        className="border-b"
                      >

                        <td className="py-3">
                          $
                          {Number(
                            deposit.amount
                          ).toFixed(2)}
                        </td>

                        <td className="py-3">
                          {deposit.method}
                        </td>

                        <td className="py-3">
                          {deposit.transaction_id || "-"}
                        </td>

                        <td className="py-3">
                          <Badge>
                            {deposit.status}
                          </Badge>
                        </td>

                        <td className="py-3">

                          {deposit.status === "pending" && (
                            <div className="flex justify-end gap-2">

                              <Button
                                size="sm"
                                onClick={() =>
                                  approveDeposit(deposit)
                                }
                              >
                                <Check className="mr-1 size-4" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  rejectDeposit(deposit)
                                }
                              >
                                <X className="mr-1 size-4" />
                                Reject
                              </Button>

                            </div>
                          )}

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            {/* WITHDRAWALS */}
            <div className="surface-card rounded-xl border p-5">

              <h2 className="mb-4 font-bold">
                Withdrawal Requests
              </h2>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="border-b">

                      <th className="py-2 text-left">
                        Amount
                      </th>

                      <th className="py-2 text-left">
                        Method
                      </th>

                      <th className="py-2 text-left">
                        Account
                      </th>

                      <th className="py-2 text-left">
                        Status
                      </th>

                      <th className="py-2 text-right">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {withdrawals.map((withdrawal) => (
                      <tr
                        key={withdrawal.id}
                        className="border-b"
                      >

                        <td className="py-3">
                          $
                          {Number(
                            withdrawal.amount
                          ).toFixed(2)}
                        </td>

                        <td className="py-3">
                          {withdrawal.method}
                        </td>

                        <td className="py-3">
                          {withdrawal.account_number}
                        </td>

                        <td className="py-3">
                          <Badge>
                            {withdrawal.status}
                          </Badge>
                        </td>

                        <td className="py-3">

                          {withdrawal.status === "pending" && (
                            <div className="flex justify-end gap-2">

                              <Button
                                size="sm"
                                onClick={() =>
                                  approveWithdrawal(
                                    withdrawal
                                  )
                                }
                              >
                                <Check className="mr-1 size-4" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  rejectWithdrawal(
                                    withdrawal
                                  )
                                }
                              >
                                <X className="mr-1 size-4" />
                                Reject
                              </Button>

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
        )}

      </div>
    </AppShell>
  );
    }
