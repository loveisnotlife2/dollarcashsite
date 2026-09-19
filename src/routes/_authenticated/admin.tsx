import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Crown, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, usd, daysLeft } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Control Panel · DollarCash" },
      {
        name: "description",
        content:
          "DollarCash admin control panel for deposits, withdrawals, members, plans, referrals and payment settings.",
      },
      { property: "og:title", content: "Admin Control Panel · DollarCash" },
      {
        property: "og:description",
        content: "Manage DollarCash deposits, withdrawals, members and payout settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const SECTIONS = [
  "overview",
  "deposits",
  "withdrawals",
  "members",
  "plans",
  "referrals",
  "tasks",
  "methods",
  "settings",
] as const;

function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (!isLoading && isAdmin === false) {
      toast.error("You do not have access to the admin panel.");
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <AppShell title="Admin Panel">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking your access…
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin Panel">
        <div className="surface-card flex items-center gap-2 rounded-xl border border-border p-5 text-sm">
          <ShieldAlert className="size-5 text-destructive" /> Access denied. Redirecting…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="👑 Admin Control Panel" subtitle="Manage DollarCash operations">
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList className="w-max">
            {SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section} className="capitalize">
                {section === "methods" ? "Payment" : section}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="deposits"><Deposits /></TabsContent>
        <TabsContent value="withdrawals"><Withdrawals /></TabsContent>
        <TabsContent value="members"><Members /></TabsContent>
        <TabsContent value="plans"><PlansAdmin /></TabsContent>
        <TabsContent value="referrals"><ReferralsAdmin /></TabsContent>
        <TabsContent value="tasks"><TasksAdmin /></TabsContent>
        <TabsContent value="methods"><MethodsAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="surface-card rounded-xl border border-border p-4">{children}</div>;
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function Loading() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </p>
  );
}

/* ---------------- Overview ---------------- */

type Stats = {
  users: number;
  active_plans: number;
  pending_deposits: number;
  pending_withdrawals: number;
  total_balance: number;
  approved_deposits_usd: number;
  approved_withdrawals_usd: number;
  referrals: number;
  tasks_today: number;
};

function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <Empty label={(error as Error).message} />;

  const tiles: Array<[string, string]> = [
    ["Members", String(data?.users ?? 0)],
    ["Active plans", String(data?.active_plans ?? 0)],
    ["Pending deposits", String(data?.pending_deposits ?? 0)],
    ["Pending payouts", String(data?.pending_withdrawals ?? 0)],
    ["Total balances", usd(data?.total_balance)],
    ["Approved deposits", usd(data?.approved_deposits_usd)],
    ["Paid withdrawals", usd(data?.approved_withdrawals_usd)],
    ["Referrals", String(data?.referrals ?? 0)],
    ["Tasks today", String(data?.tasks_today ?? 0)],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map(([label, value]) => (
        <Card key={label}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold">{value}</p>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Deposits ---------------- */

function useRefresh(keys: string[]) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] });
  };
}

function Deposits() {
  const refresh = useRefresh(["admin-deposits", "admin-stats"]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_deposit", {
      p_id: id,
      p_approve: approve,
      p_reason: reasons[id] ?? null,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? "Deposit approved and balance credited." : "Deposit rejected.");
    refresh();
  }

  async function openProof(path: string | null) {
    if (!path) {
      toast.error("No screenshot attached.");
      return;
    }
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      toast.error("Could not open the screenshot.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty label="No pending deposits." />;

  return (
    <div className="space-y-3">
      {data.map((deposit) => (
        <Card key={deposit.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-lg font-bold">{usd(deposit.usd_amount)}</p>
              <p className="text-xs text-muted-foreground">
                {Number(deposit.pkr_amount).toFixed(0)} PKR · {deposit.method} · TID {deposit.tid}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(deposit.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant="secondary">{deposit.status}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void openProof(deposit.screenshot_url)}>
              View proof
            </Button>
            <Input
              className="h-9 w-48"
              placeholder="Reject reason"
              value={reasons[deposit.id] ?? ""}
              onChange={(event) =>
                setReasons((prev) => ({ ...prev, [deposit.id]: event.target.value }))
              }
            />
            <Button size="sm" disabled={busy === deposit.id} onClick={() => void review(deposit.id, true)}>
              {busy === deposit.id ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy === deposit.id}
              onClick={() => void review(deposit.id, false)}
            >
              Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Withdrawals ---------------- */

function Withdrawals() {
  const refresh = useRefresh(["admin-withdrawals", "admin-stats"]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_withdrawal", {
      p_id: id,
      p_approve: approve,
      p_reason: reasons[id] ?? null,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? "Payout approved." : "Payout rejected and amount refunded.");
    refresh();
  }

  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty label="No pending withdrawals." />;

  return (
    <div className="space-y-3">
      {data.map((withdrawal) => (
        <Card key={withdrawal.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-lg font-bold">{usd(withdrawal.usd_amount)}</p>
              <p className="text-xs text-muted-foreground">
                {withdrawal.method} · {withdrawal.account_title} · {withdrawal.account_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(withdrawal.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant="secondary">{withdrawal.status}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              className="h-9 w-48"
              placeholder="Reject reason"
              value={reasons[withdrawal.id] ?? ""}
              onChange={(event) =>
                setReasons((prev) => ({ ...prev, [withdrawal.id]: event.target.value }))
              }
            />
            <Button
              size="sm"
              disabled={busy === withdrawal.id}
              onClick={() => void review(withdrawal.id, true)}
            >
              {busy === withdrawal.id ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy === withdrawal.id}
              onClick={() => void review(withdrawal.id, false)}
            >
              Reject & refund
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Members ---------------- */

function Members() {
  const refresh = useRefresh(["admin-members", "admin-stats"]);
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, phone, email, balance, banned, referral_code, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`username.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function setBalance(id: string) {
    const value = Number(amounts[id]);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid amount (0 or more).");
      return;
    }
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_balance", { p_user: id, p_balance: value });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Balance updated.");
    refresh();
  }

  async function toggleBan(id: string, banned: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_banned", { p_user: id, p_banned: banned });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(banned ? "Member banned." : "Member unbanned.");
    refresh();
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name, number or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {isLoading ? <Loading /> : null}
      {!isLoading && !data?.length ? <Empty label="No members found." /> : null}
      {data?.map((member) => (
        <Card key={member.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{member.username ?? "Member"}</p>
              <p className="text-xs text-muted-foreground">
                {member.phone ?? member.email ?? "—"} · code {member.referral_code}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-primary">{usd(member.balance)}</p>
              {member.banned ? <Badge variant="destructive">Banned</Badge> : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              className="h-9 w-32"
              inputMode="decimal"
              placeholder="New balance"
              value={amounts[member.id] ?? ""}
              onChange={(event) =>
                setAmounts((prev) => ({ ...prev, [member.id]: event.target.value }))
              }
            />
            <Button size="sm" disabled={busy === member.id} onClick={() => void setBalance(member.id)}>
              {busy === member.id ? <Loader2 className="size-4 animate-spin" /> : "Set balance"}
            </Button>
            <Button
              size="sm"
              variant={member.banned ? "outline" : "destructive"}
              disabled={busy === member.id}
              onClick={() => void toggleBan(member.id, !member.banned)}
            >
              {member.banned ? "Unban" : "Ban"}
            </Button>
          </div>
          <MemberInvestments userId={member.id} />
        </Card>
      ))}
    </div>
  );
}

function MemberInvestments({ userId }: { userId: string }) {
  const refresh = useRefresh(["admin-member-investments"]);
  const { data } = useQuery({
    queryKey: ["admin-member-investments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("id, status, expires_at, total_earned, plans(name)")
        .eq("user_id", userId)
        .order("activated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const expire = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_expire_investment", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Investment expired.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!data?.length) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {data.map((investment) => (
        <div key={investment.id} className="flex items-center justify-between gap-2 text-xs">
          <span>
            {(investment.plans as { name: string } | null)?.name ?? "Plan"} · {investment.status} ·{" "}
            {daysLeft(investment.expires_at)}d left · earned {usd(investment.total_earned)}
          </span>
          {investment.status === "ACTIVE" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={expire.isPending}
              onClick={() => expire.mutate(investment.id)}
            >
              Expire
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Plans ---------------- */

function PlansAdmin() {
  const refresh = useRefresh(["admin-plans", "plans"]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("plans").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plan updated.");
    refresh();
  }

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      {data?.map((plan) => {
        const draft = drafts[plan.id] ?? {};
        const field = (key: string, fallback: number) => draft[key] ?? String(fallback);
        const set = (key: string, value: string) =>
          setDrafts((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], [key]: value } }));
        return (
          <Card key={plan.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{plan.name}</p>
              <div className="flex items-center gap-2 text-xs">
                <span>{plan.is_active ? "Active" : "Disabled"}</span>
                <Switch
                  checked={plan.is_active}
                  onCheckedChange={(checked) => void save(plan.id, { is_active: checked })}
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <LabeledInput label="Cost $" value={field("cost", plan.cost)} onChange={(v) => set("cost", v)} />
              <LabeledInput
                label="Daily $"
                value={field("daily_return", plan.daily_return)}
                onChange={(v) => set("daily_return", v)}
              />
              <LabeledInput
                label="Days"
                value={field("validity_days", plan.validity_days)}
                onChange={(v) => set("validity_days", v)}
              />
              <LabeledInput
                label="Total $"
                value={field("total_return", plan.total_return)}
                onChange={(v) => set("total_return", v)}
              />
            </div>
            <Button
              className="mt-3"
              size="sm"
              onClick={() =>
                void save(plan.id, {
                  cost: Number(field("cost", plan.cost)),
                  daily_return: Number(field("daily_return", plan.daily_return)),
                  validity_days: Number(field("validity_days", plan.validity_days)),
                  total_return: Number(field("total_return", plan.total_return)),
                })
              }
            >
              Save plan
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input className="h-9" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

/* ---------------- Referrals ---------------- */

function ReferralsAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const [referrals, milestones] = await Promise.all([
        supabase
          .from("referrals")
          .select("id, referrer_id, referred_id, bonus_paid, bonus_amount, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("referral_milestone_claims")
          .select("id, user_id, milestone, amount, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (referrals.error) throw referrals.error;
      if (milestones.error) throw milestones.error;
      return { referrals: referrals.data ?? [], milestones: milestones.data ?? [] };
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-2 font-semibold">Latest referrals</p>
        {data?.referrals.length ? (
          <div className="space-y-1 text-xs">
            {data.referrals.map((referral) => (
              <div key={referral.id} className="flex justify-between gap-2">
                <span className="truncate">{referral.referred_id}</span>
                <span>{referral.bonus_paid ? usd(referral.bonus_amount) : "unpaid"}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty label="No referrals yet." />
        )}
      </Card>
      <Card>
        <p className="mb-2 font-semibold">Milestone rewards paid</p>
        {data?.milestones.length ? (
          <div className="space-y-1 text-xs">
            {data.milestones.map((milestone) => (
              <div key={milestone.id} className="flex justify-between gap-2">
                <span className="truncate">{milestone.user_id}</span>
                <span>
                  {milestone.milestone} invites · {usd(milestone.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty label="No milestone rewards paid yet." />
        )}
      </Card>
    </div>
  );
}

/* ---------------- Tasks ---------------- */

function TasksAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("id, user_id, reward, task_date, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty label="No task completions yet." />;

  return (
    <Card>
      <div className="space-y-1 text-xs">
        {data.map((task) => (
          <div key={task.id} className="flex justify-between gap-2">
            <span className="truncate">{task.user_id}</span>
            <span>
              {task.task_date} · {usd(task.reward)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Payment methods ---------------- */

function MethodsAdmin() {
  const refresh = useRefresh(["admin-methods", "payment-methods"]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").order("method");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase
      .from("payment_methods")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment method updated.");
    refresh();
  }

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      {data?.map((method) => {
        const draft = drafts[method.id] ?? {};
        const set = (key: string, value: string) =>
          setDrafts((prev) => ({ ...prev, [method.id]: { ...prev[method.id], [key]: value } }));
        return (
          <Card key={method.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{method.method}</p>
              <div className="flex items-center gap-2 text-xs">
                <span>{method.is_active ? "Active" : "Disabled"}</span>
                <Switch
                  checked={method.is_active}
                  onCheckedChange={(checked) => void save(method.id, { is_active: checked })}
                />
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <LabeledInput
                label="Account title"
                value={draft["account_title"] ?? method.account_title}
                onChange={(v) => set("account_title", v)}
              />
              <LabeledInput
                label="Account number"
                value={draft["account_number"] ?? method.account_number}
                onChange={(v) => set("account_number", v)}
              />
              <LabeledInput
                label="QR image URL"
                value={draft["qr_url"] ?? method.qr_url ?? ""}
                onChange={(v) => set("qr_url", v)}
              />
            </div>
            <Button
              className="mt-3"
              size="sm"
              onClick={() =>
                void save(method.id, {
                  account_title: draft["account_title"] ?? method.account_title,
                  account_number: draft["account_number"] ?? method.account_number,
                  qr_url: draft["qr_url"] ?? method.qr_url,
                })
              }
            >
              Save details
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsAdmin() {
  const refresh = useRefresh(["admin-settings", "usd-rate"]);
  const [rate, setRate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "usd_pkr_rate")
        .maybeSingle();
      if (error) throw error;
      return Number(data?.value ?? 280);
    },
  });

  async function save() {
    const value = Number(rate);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid PKR rate.");
      return;
    }
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "usd_pkr_rate", value: String(value) });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Exchange rate updated.");
    setRate("");
    refresh();
  }

  if (isLoading) return <Loading />;

  return (
    <Card>
      <p className="flex items-center gap-2 font-semibold">
        <Crown className="size-4 text-primary" /> USD → PKR rate
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Current rate: {data} PKR per $1</p>
      <div className="mt-3 flex gap-2">
        <Input
          className="h-9 w-32"
          inputMode="decimal"
          placeholder={String(data ?? 280)}
          value={rate}
          onChange={(event) => setRate(event.target.value)}
        />
        <Button size="sm" onClick={() => void save()}>
          Save rate
        </Button>
      </div>
    </Card>
  );
}
