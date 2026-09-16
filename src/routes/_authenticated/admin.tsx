import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, X, ShieldAlert, RefreshCw, Search, KeyRound, Ban } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { setUserPassword } from "@/lib/admin.functions";
import { useIsAdmin, usePaymentMethods, usePlans, useRate, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Control Panel | DollarCash" },
      {
        name: "description",
        content:
          "DollarCash owner panel: approve deposits and withdrawals, manage members, plans, payout accounts and the USD to PKR rate.",
      },
      { property: "og:title", content: "Admin Control Panel | DollarCash" },
      {
        property: "og:description",
        content: "Approve payments and manage DollarCash members and plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Tab = "overview" | "deposits" | "withdrawals" | "members" | "plans" | "settings";

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!checkingAdmin && isAdmin === false) {
      toast.error("Admin access only");
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [checkingAdmin, isAdmin, navigate]);

  const refresh = () => queryClient.invalidateQueries();

  const run = async (fn: () => Promise<void>, okMessage: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMessage);
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as {
        users: number;
        active_plans: number;
        pending_deposits: number;
        pending_withdrawals: number;
        total_balance: number;
      };
    },
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin-members"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allInvestments = [] } = useQuery({
    queryKey: ["admin-investments"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, plans(name, cost, daily_return)")
        .order("activated_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: plans = [] } = usePlans();
  const { data: methods = [] } = usePaymentMethods();
  const { data: rate = 280 } = useRate();

  if (checkingAdmin || !isAdmin) {
    return (
      <AppShell title="Admin" subtitle="Checking access">
        <p className="text-sm text-muted-foreground">Verifying admin access…</p>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "deposits", label: `Deposits (${stats?.pending_deposits ?? 0})` },
    { id: "withdrawals", label: `Payouts (${stats?.pending_withdrawals ?? 0})` },
    { id: "members", label: "Members" },
    { id: "plans", label: "Plans" },
    { id: "settings", label: "Accounts & Rate" },
  ];

  return (
    <AppShell title="Admin Control Panel" subtitle="Full control over DollarCash">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={refresh}>
            <RefreshCw className="mr-2 size-4" /> Refresh
          </Button>
        </div>

        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Members" value={String(stats?.users ?? 0)} />
              <Stat label="Active plans" value={String(stats?.active_plans ?? 0)} />
              <Stat label="Pending deposits" value={String(stats?.pending_deposits ?? 0)} />
              <Stat label="Pending payouts" value={String(stats?.pending_withdrawals ?? 0)} />
              <Stat label="Members' balance" value={usd(stats?.total_balance)} />
            </div>
            <div className="surface-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gold">
                <ShieldAlert className="size-5" /> Owner access
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Admin access is granted to +92 313 3221347 (Main Owner) and +92 348 5374133
                (Co-Admin). Approvals here update member balances instantly.
              </p>
            </div>
            <div className="surface-card p-5">
              <h2 className="font-display text-lg font-bold">Latest plan purchases</h2>
              <Table
                head={["Member", "Plan", "Activated", "Expires", "Earned", "Status"]}
                rows={allInvestments.slice(0, 10).map((i: any) => [
                  short(i.user_id),
                  i.plans?.name ?? "-",
                  new Date(i.activated_at).toLocaleDateString(),
                  new Date(i.expires_at).toLocaleDateString(),
                  usd(i.total_earned),
                  i.status,
                ])}
              />
            </div>
          </div>
        )}

        {tab === "deposits" && (
          <div className="surface-card p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Deposit requests</h2>
            {deposits.length === 0 ? (
              <Empty text="No deposit requests yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <Head cols={["Member / TID", "Amount", "Method", "Proof", "Status", "Action"]} />
                  <tbody className="divide-y divide-border">
                    {deposits.map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-3">
                          <div className="font-semibold">{short(d.user_id)}</div>
                          <div className="text-xs text-muted-foreground">TID: {d.tid}</div>
                        </td>
                        <td className="py-3 font-semibold">
                          {usd(d.usd_amount)}{" "}
                          <span className="text-xs text-muted-foreground">
                            (Rs {Number(d.pkr_amount).toFixed(0)})
                          </span>
                        </td>
                        <td className="py-3">{d.method}</td>
                        <td className="py-3">
                          {d.screenshot_url ? (
                            <ProofLink path={d.screenshot_url} />
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={d.status} reason={d.reject_reason} />
                        </td>
                        <td className="py-3 text-right">
                          {d.status === "PENDING" && (
                            <ApproveReject
                              busy={busy}
                              onApprove={() =>
                                run(async () => {
                                  const { error } = await supabase.rpc("admin_review_deposit", {
                                    p_id: d.id,
                                    p_approve: true,
                                  });
                                  if (error) throw error;
                                }, "Deposit approved and balance credited")
                              }
                              onReject={(reason) =>
                                run(async () => {
                                  const { error } = await supabase.rpc("admin_review_deposit", {
                                    p_id: d.id,
                                    p_approve: false,
                                    p_reason: reason,
                                  });
                                  if (error) throw error;
                                }, "Deposit rejected")
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "withdrawals" && (
          <div className="surface-card p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Withdrawal / payout requests</h2>
            {withdrawals.length === 0 ? (
              <Empty text="No withdrawal requests yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <Head cols={["Member", "Amount", "Account", "Status", "Action"]} />
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w: any) => (
                      <tr key={w.id}>
                        <td className="py-3 font-semibold">{short(w.user_id)}</td>
                        <td className="py-3 font-semibold">
                          {usd(w.usd_amount)}{" "}
                          <span className="text-xs text-muted-foreground">
                            (Rs {(Number(w.usd_amount) * rate).toFixed(0)})
                          </span>
                        </td>
                        <td className="py-3">
                          <div>{w.method}</div>
                          <div className="text-xs text-muted-foreground">
                            {w.account_title} · {w.account_number}
                          </div>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={w.status} reason={w.reject_reason} />
                        </td>
                        <td className="py-3 text-right">
                          {w.status === "PENDING" && (
                            <ApproveReject
                              busy={busy}
                              onApprove={() =>
                                run(async () => {
                                  const { error } = await supabase.rpc("admin_review_withdrawal", {
                                    p_id: w.id,
                                    p_approve: true,
                                  });
                                  if (error) throw error;
                                }, "Payout approved")
                              }
                              onReject={(reason) =>
                                run(async () => {
                                  const { error } = await supabase.rpc("admin_review_withdrawal", {
                                    p_id: w.id,
                                    p_approve: false,
                                    p_reason: reason,
                                  });
                                  if (error) throw error;
                                }, "Payout rejected and balance refunded")
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "members" && (
          <MembersPanel members={members} investments={allInvestments} busy={busy} run={run} />
        )}

        {tab === "plans" && (
          <div className="surface-card p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Plans & sold count</h2>
            <Table
              head={["Plan", "Cost", "Daily", "Days", "Total return", "Active now", "Sold"]}
              rows={plans.map((p) => [
                p.name,
                usd(p.cost),
                usd(p.daily_return),
                String(p.validity_days),
                usd(p.total_return),
                String(
                  allInvestments.filter(
                    (i: any) =>
                      i.plan_id === p.id &&
                      i.status === "ACTIVE" &&
                      new Date(i.expires_at).getTime() > Date.now(),
                  ).length,
                ),
                String(allInvestments.filter((i: any) => i.plan_id === p.id).length),
              ])}
            />
          </div>
        )}

        {tab === "settings" && (
          <SettingsPanel methods={methods} rate={rate} busy={busy} run={run} />
        )}
      </div>
    </AppShell>
  );
}

function MembersPanel({
  members,
  investments,
  busy,
  run,
}: {
  members: any[];
  investments: any[];
  busy: boolean;
  run: (fn: () => Promise<void>, ok: string) => Promise<void>;
}) {
  const [term, setTerm] = useState("");
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.username, m.phone, m.email, m.referral_code, m.id]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [members, term]);

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <Label htmlFor="search">Search members</Label>
        <div className="mt-2 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Name, mobile number or referral code"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-5">
          <Empty text="No members match this search." />
        </div>
      ) : (
        filtered.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            active={investments.filter(
              (i: any) =>
                i.user_id === m.id &&
                i.status === "ACTIVE" &&
                new Date(i.expires_at).getTime() > Date.now(),
            )}
            busy={busy}
            run={run}
          />
        ))
      )}
    </div>
  );
}

function MemberCard({
  member,
  active,
  busy,
  run,
}: {
  member: any;
  active: any[];
  busy: boolean;
  run: (fn: () => Promise<void>, ok: string) => Promise<void>;
}) {
  const [balance, setBalance] = useState(String(Number(member.balance ?? 0).toFixed(2)));
  const [password, setPassword] = useState("");

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold">{member.username ?? "Member"}</p>
          <p className="text-xs text-muted-foreground">
            {member.phone ?? "no number"} · code {member.referral_code}
          </p>
          <p className="mt-1 text-sm">
            Balance <span className="font-semibold">{usd(member.balance)}</span> ·{" "}
            {active.length > 0
              ? `${active.length} active plan${active.length > 1 ? "s" : ""}`
              : "no active plan"}
          </p>
        </div>
        {member.banned ? <Badge variant="destructive">Banned</Badge> : <Badge>Active</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Set balance (USD)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { error } = await supabase.rpc("admin_set_balance", {
                    p_user: member.id,
                    p_balance: Number(balance),
                  });
                  if (error) throw error;
                }, "Balance updated")
              }
            >
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>New password</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await setUserPassword({ data: { userId: member.id, password } });
                  setPassword("");
                }, "Password changed")
              }
            >
              <KeyRound className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Account</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={member.banned ? "default" : "destructive"}
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { error } = await supabase.rpc("admin_set_banned", {
                    p_user: member.id,
                    p_banned: !member.banned,
                  });
                  if (error) throw error;
                }, member.banned ? "Member unbanned" : "Member banned")
              }
            >
              <Ban className="mr-1 size-4" /> {member.banned ? "Unban" : "Ban"}
            </Button>
            {active.map((i) => (
              <Button
                key={i.id}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const { error } = await supabase.rpc("admin_expire_investment", { p_id: i.id });
                    if (error) throw error;
                  }, "Plan expired")
                }
              >
                Expire {i.plans?.name ?? "plan"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  methods,
  rate,
  busy,
  run,
}: {
  methods: any[];
  rate: number;
  busy: boolean;
  run: (fn: () => Promise<void>, ok: string) => Promise<void>;
}) {
  const [newRate, setNewRate] = useState(String(rate));

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <RefreshCw className="size-5 text-primary" /> Exchange rate
        </h2>
        <div className="mt-4 flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="rate">1 USD in PKR</Label>
            <Input
              id="rate"
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
            />
          </div>
          <Button
            className="self-end"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { error } = await supabase
                  .from("settings")
                  .update({ value: String(Number(newRate)) })
                  .eq("key", "usd_pkr_rate");
                if (error) throw error;
              }, "Exchange rate updated")
            }
          >
            Save rate
          </Button>
        </div>
      </div>

      {methods.map((m) => (
        <MethodCard key={m.id} method={m} busy={busy} run={run} />
      ))}
    </div>
  );
}

function MethodCard({
  method,
  busy,
  run,
}: {
  method: any;
  busy: boolean;
  run: (fn: () => Promise<void>, ok: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(method.account_title ?? "");
  const [number, setNumber] = useState(method.account_number ?? "");

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{method.method}</h3>
        <Button
          size="sm"
          variant={method.is_active ? "destructive" : "default"}
          disabled={busy}
          onClick={() =>
            run(async () => {
              const { error } = await supabase
                .from("payment_methods")
                .update({ is_active: !method.is_active, updated_at: new Date().toISOString() })
                .eq("id", method.id);
              if (error) throw error;
            }, method.is_active ? `${method.method} disabled` : `${method.method} enabled`)
          }
        >
          {method.is_active ? "Disable" : "Enable"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Account title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Account number</Label>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
      </div>
      <Button
        disabled={busy}
        onClick={() =>
          run(async () => {
            const { error } = await supabase
              .from("payment_methods")
              .update({
                account_title: title,
                account_number: number,
                updated_at: new Date().toISOString(),
              })
              .eq("id", method.id);
            if (error) throw error;
          }, `${method.method} account saved`)
        }
      >
        Save {method.method} account
      </Button>
    </div>
  );
}

function ApproveReject({
  busy,
  onApprove,
  onReject,
}: {
  busy: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        className="bg-emerald-600 text-white hover:bg-emerald-700"
        disabled={busy}
        onClick={onApprove}
      >
        <Check className="size-4" /> Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => {
          const reason = window.prompt("Reason for rejection?") ?? "";
          if (!reason.trim()) return;
          onReject(reason.trim());
        }}
      >
        <X className="size-4" /> Reject
      </Button>
    </div>
  );
}

function ProofLink({ path }: { path: string }) {
  const open = async () => {
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast.error("Could not open the screenshot");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <Button size="sm" variant="outline" onClick={open}>
      View
    </Button>
  );
}

function StatusBadge({ status, reason }: { status: string; reason?: string | null }) {
  return (
    <div>
      <Badge
        variant={
          status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "secondary"
        }
      >
        {status}
      </Badge>
      {reason ? <div className="mt-1 text-xs text-muted-foreground">{reason}</div> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </div>
  );
}

function Head({ cols }: { cols: string[] }) {
  return (
    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
      <tr>
        {cols.map((c) => (
          <th key={c} className="py-2">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return <Empty text="Nothing here yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <Head cols={head} />
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="py-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

const short = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : "-");
