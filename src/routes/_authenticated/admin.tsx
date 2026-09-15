import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Eye, KeyRound, Loader2, Save, Search, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { setUserPassword } from "@/lib/admin.functions";
import { useIsAdmin, usePaymentMethods, useRate, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin control panel — DollarCash" },
      {
        name: "description",
        content:
          "DollarCash admin panel: approve deposits and withdrawals, manage members and update EasyPaisa and JazzCash accounts.",
      },
      { property: "og:title", content: "Admin control panel — DollarCash" },
      {
        property: "og:description",
        content: "Approvals, member management and payment settings for DollarCash.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <AppShell title="Admin" subtitle="Checking access">
        <div className="surface-card flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Verifying your permissions…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin control panel" subtitle="Approvals, members and payment settings">
      <Stats />
      <Tabs defaultValue="deposits" className="mt-5">
        <TabsList className="w-full">
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="users">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits" className="mt-4">
          <Deposits />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4">
          <Withdrawals />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <Members />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as {
        users: number;
        active_plans: number;
        pending_deposits: number;
        pending_withdrawals: number;
        total_balance: number;
      };
    },
  });

  const items = [
    { label: "Members", value: String(data?.users ?? 0) },
    { label: "Active plans", value: String(data?.active_plans ?? 0) },
    { label: "Pending deposits", value: String(data?.pending_deposits ?? 0) },
    { label: "Pending withdrawals", value: String(data?.pending_withdrawals ?? 0) },
    { label: "Total balances", value: usd(data?.total_balance ?? 0) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className="surface-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{i.label}</p>
          <p className="font-display text-xl font-bold">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-primary/15 text-primary">APPROVED</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">REJECTED</Badge>;
  return <Badge variant="secondary">PENDING</Badge>;
}

function ProofButton({ path }: { path: string | null }) {
  const [loading, setLoading] = useState(false);
  if (!path) return <span className="text-xs text-muted-foreground">No screenshot</span>;

  async function open() {
    setLoading(true);
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path!, 300);
    setLoading(false);
    if (error || !data) {
      toast.error("Could not open screenshot");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={open}>
      <Eye className="size-4" /> Screenshot
    </Button>
  );
}

function Deposits() {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async (v: { id: string; approve: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_review_deposit", {
        p_id: v.id,
        p_approve: v.approve,
        p_reason: v.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deposit updated");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  if (rows.length === 0)
    return <div className="surface-card p-6 text-sm text-muted-foreground">No deposits yet.</div>;

  return (
    <div className="space-y-3">
      {rows.map((d) => (
        <div key={d.id} className="surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display font-bold">
              {usd(d.usd_amount)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                = {Number(d.pkr_amount).toLocaleString()} PKR · {d.method}
              </span>
            </p>
            <StatusBadge status={d.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            TID {d.tid} · {new Date(d.created_at).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ProofButton path={d.screenshot_url} />
            {d.status === "PENDING" ? (
              <>
                <Button
                  size="sm"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: d.id, approve: true })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={review.isPending}
                  onClick={() => {
                    const reason = window.prompt("Reason for rejection?") ?? "";
                    if (!reason.trim()) return;
                    review.mutate({ id: d.id, approve: false, reason });
                  }}
                >
                  Reject
                </Button>
              </>
            ) : null}
          </div>
          {d.reject_reason ? (
            <p className="mt-2 text-xs text-destructive">Reason: {d.reject_reason}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Withdrawals() {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async (v: { id: string; approve: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("admin_review_withdrawal", {
        p_id: v.id,
        p_approve: v.approve,
        p_reason: v.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal updated");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  if (rows.length === 0)
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">No withdrawals yet.</div>
    );

  return (
    <div className="space-y-3">
      {rows.map((w) => (
        <div key={w.id} className="surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display font-bold">
              {usd(w.usd_amount)}{" "}
              <span className="text-sm font-normal text-muted-foreground">· {w.method}</span>
            </p>
            <StatusBadge status={w.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {w.account_title} · {w.account_number} · {new Date(w.created_at).toLocaleString()}
          </p>
          {w.status === "PENDING" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: w.id, approve: true })}
              >
                Approve & mark paid
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={review.isPending}
                onClick={() => {
                  const reason = window.prompt("Reason for rejection?") ?? "";
                  if (!reason.trim()) return;
                  review.mutate({ id: w.id, approve: false, reason });
                }}
              >
                Reject & refund
              </Button>
            </div>
          ) : null}
          {w.reject_reason ? (
            <p className="mt-2 text-xs text-destructive">Reason: {w.reject_reason}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Members() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const changePassword = useServerFn(setUserPassword);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users", term],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id, email, username, balance, banned, referral_code, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (term.trim()) q = q.or(`email.ilike.%${term}%,username.ilike.%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: investments = [] } = useQuery({
    queryKey: ["admin-investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("id, user_id, status, expires_at, plans(name, daily_return)");
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        user_id: string;
        status: string;
        expires_at: string;
        plans: { name: string; daily_return: number } | null;
      }>;
    },
  });

  const setBalance = useMutation({
    mutationFn: async (v: { userId: string; balance: number }) => {
      const { error } = await supabase.rpc("admin_set_balance", {
        p_user: v.userId,
        p_balance: v.balance,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Balance updated");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const setBanned = useMutation({
    mutationFn: async (v: { userId: string; banned: boolean }) => {
      const { error } = await supabase.rpc("admin_set_banned", {
        p_user: v.userId,
        p_banned: v.banned,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member updated");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const expirePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_expire_investment", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plan expired");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const resetPassword = useMutation({
    mutationFn: async (v: { userId: string; password: string }) =>
      changePassword({ data: v }),
    onSuccess: () => toast.success("Password changed"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change password"),
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by email or username"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {users.map((u) => {
        const active = investments.filter(
          (i) =>
            i.user_id === u.id &&
            i.status === "ACTIVE" &&
            new Date(i.expires_at).getTime() > Date.now(),
        );
        return (
          <div key={u.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display font-bold">{u.username ?? "Member"}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · code {u.referral_code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {u.banned ? <Badge variant="destructive">BANNED</Badge> : null}
                <Badge variant="secondary">{active.length} active</Badge>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BalanceEditor
                current={Number(u.balance)}
                pending={setBalance.isPending}
                onSave={(balance) => setBalance.mutate({ userId: u.id, balance })}
              />
              <PasswordEditor
                pending={resetPassword.isPending}
                onSave={(password) => resetPassword.mutate({ userId: u.id, password })}
              />
            </div>

            {active.length > 0 ? (
              <div className="mt-3 space-y-2">
                {active.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
                  >
                    <span>
                      {i.plans?.name} · {usd(i.plans?.daily_return)} daily · until{" "}
                      {new Date(i.expires_at).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={expirePlan.isPending}
                      onClick={() => expirePlan.mutate(i.id)}
                    >
                      Expire
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="flex items-center gap-2 text-sm">
                <Ban className="size-4 text-muted-foreground" /> Ban this member
              </span>
              <Switch
                checked={u.banned}
                disabled={setBanned.isPending}
                onCheckedChange={(banned) => setBanned.mutate({ userId: u.id, banned })}
              />
            </div>
          </div>
        );
      })}

      {users.length === 0 ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">No members found.</div>
      ) : null}
    </div>
  );
}

function BalanceEditor({
  current,
  pending,
  onSave,
}: {
  current: number;
  pending: boolean;
  onSave: (balance: number) => void;
}) {
  const [value, setValue] = useState(current.toFixed(2));
  return (
    <div>
      <Label className="text-xs text-muted-foreground">Balance (USD)</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          variant="outline"
          disabled={pending || Number.isNaN(Number(value))}
          onClick={() => onSave(Number(value))}
        >
          <Save className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PasswordEditor({
  pending,
  onSave,
}: {
  pending: boolean;
  onSave: (password: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div>
      <Label className="text-xs text-muted-foreground">Set new password</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          type="text"
          placeholder="min 6 characters"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          variant="outline"
          disabled={pending || value.length < 6}
          onClick={() => {
            onSave(value);
            setValue("");
          }}
        >
          <KeyRound className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const queryClient = useQueryClient();
  const { data: methods = [] } = usePaymentMethods();
  const { data: rate = 280 } = useRate();
  const [rateValue, setRateValue] = useState(String(rate));

  useEffect(() => setRateValue(String(rate)), [rate]);

  const saveRate = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "usd_pkr_rate", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rate updated");
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div className="space-y-3">
      <div className="surface-card p-4">
        <p className="flex items-center gap-2 font-display font-bold">
          <ShieldCheck className="size-4 text-primary" /> USD → PKR rate
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            inputMode="decimal"
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
          />
          <Button
            disabled={saveRate.isPending || Number.isNaN(Number(rateValue))}
            onClick={() => saveRate.mutate(rateValue)}
          >
            Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Deposits are converted at this rate: $1.00 = {Number(rateValue || 0).toLocaleString()} PKR
        </p>
      </div>

      {methods.map((m) => (
        <MethodEditor key={m.id} method={m} />
      ))}
    </div>
  );
}

function MethodEditor({
  method,
}: {
  method: {
    id: string;
    method: string;
    account_title: string;
    account_number: string;
    qr_url: string | null;
    is_active: boolean;
  };
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(method.account_title);
  const [number, setNumber] = useState(method.account_number);
  const [qr, setQr] = useState(method.qr_url ?? "");

  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", method.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${method.method} updated`);
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold">{method.method}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {method.is_active ? "Active" : "Disabled"}
          <Switch
            checked={method.is_active}
            disabled={save.isPending}
            onCheckedChange={(is_active) => save.mutate({ is_active })}
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Account title</Label>
          <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Account number</Label>
          <Input className="mt-1.5" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground">QR code image URL</Label>
          <Input className="mt-1.5" value={qr} onChange={(e) => setQr(e.target.value)} />
        </div>
      </div>
      <Button
        className="mt-3"
        disabled={save.isPending}
        onClick={() =>
          save.mutate({
            account_title: title,
            account_number: number,
            qr_url: qr.trim() || null,
          })
        }
      >
        <Save className="size-4" /> Save {method.method}
      </Button>
    </div>
  );
}
