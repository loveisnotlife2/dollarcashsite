import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { REFERRAL_BONUS, useProfile, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — DollarCash" },
      {
        name: "description",
        content:
          "Share your DollarCash referral link and earn a fixed $0.10 bonus each time an invited member activates a plan.",
      },
      { property: "og:title", content: "Referrals — DollarCash" },
      {
        property: "og:description",
        content: "Invite friends to DollarCash and earn instant referral bonuses.",
      },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: profile } = useProfile();
  const [copied, setCopied] = useState(false);

  const code = profile?.referral_code ?? "";
  const link =
    typeof window === "undefined" ? "" : `${window.location.origin}/auth?ref=${code}`;

  const { data: rows = [] } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("id, bonus_paid, bonus_amount, created_at")
        .eq("referrer_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const earned = rows
    .filter((r) => r.bonus_paid)
    .reduce((sum, r) => sum + Number(r.bonus_amount), 0);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <AppShell
      title="Refer & earn"
      subtitle={`Earn ${usd(REFERRAL_BONUS)} when an invited member activates any plan`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface-card p-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4" />
          </span>
          <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Total referrals
          </p>
          <p className="font-display text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="surface-card p-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gift className="size-4" />
          </span>
          <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Referral earnings
          </p>
          <p className="font-display text-2xl font-bold">{usd(earned)}</p>
        </div>
      </div>

      <div className="surface-card mt-5 space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your code</p>
          <div className="mt-1.5 flex gap-2">
            <Input readOnly value={code} className="font-display font-bold tracking-widest" />
            <Button variant="outline" onClick={() => copy(code)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your link</p>
          <div className="mt-1.5 flex gap-2">
            <Input readOnly value={link} />
            <Button variant="outline" onClick={() => copy(link)}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-display text-lg font-bold">Invited members</h2>
      {rows.length === 0 ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          No referrals yet. Share your link to start earning.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="surface-card flex items-center justify-between gap-3 p-4 text-sm"
            >
              <div>
                <p className="font-semibold">Member joined</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.bonus_paid ? (
                <Badge className="bg-primary/15 text-primary">
                  {usd(r.bonus_amount)} paid
                </Badge>
              ) : (
                <Badge variant="secondary">Waiting for plan</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="surface-card mt-6 p-4 text-sm text-muted-foreground">
        The {usd(REFERRAL_BONUS)} bonus is credited to your main balance instantly, once and only
        once per invited member, at the moment they activate their first plan.
      </div>
    </AppShell>
  );
}
