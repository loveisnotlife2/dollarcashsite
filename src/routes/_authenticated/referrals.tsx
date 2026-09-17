import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferPage,
});

function ReferPage() {
  const { data } = useQuery({
    queryKey: ["profile-referrals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      const { data: referrals, error: referralError } = await supabase
        .from("referrals")
        .select("bonus_amount, bonus_paid")
        .eq("referrer_id", user.id);
      if (referralError) throw referralError;
      return { profile, referrals: referrals ?? [] };
    },
  });

  const referralCount = data?.referrals.length ?? 0;
  const earnings = data?.referrals.reduce(
    (total, referral) => total + (referral.bonus_paid ? Number(referral.bonus_amount) : 0),
    0,
  ) ?? 0;
  const referralLink = `https://dollarcash.site/auth?ref=${data?.profile?.referral_code ?? ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  return (
    <AppShell title="Refer & Earn" subtitle="Invite friends and earn referral bonuses">
      <div className="space-y-6">
        {/* REFERRAL LINK BOX */}
        <div className="surface-card p-5 border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            <h2 className="font-bold text-lg">Your Unique Referral Link</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link with friends. Your bonus is credited when a referred member activates a plan.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-muted px-3 py-2 rounded-lg text-sm flex-1 border border-border font-mono text-xs"
            />
            <Button onClick={handleCopyLink} className="gap-2">
              <Copy className="size-4" /> Copy
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-card flex items-center justify-between rounded-xl border border-border p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total referrals</p>
              <h3 className="mt-1 text-3xl font-extrabold">{referralCount} Users</h3>
            </div>
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <Users className="size-8" />
            </div>
          </div>
          <div className="surface-card rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground">Referral earnings</p>
            <h3 className="mt-1 text-3xl font-extrabold">${earnings.toFixed(2)}</h3>
          </div>
        </div>
      </div>
    </AppShell>
  );
                        }
