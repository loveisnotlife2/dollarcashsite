import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Gift, Users, Award, CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferPage,
});

// MILESTONE REWARDS TIERS
const REFERRAL_REWARDS = [
  { count: 5, reward: 1, label: "5 Referrals -> $1.00 Cash Bonus" },
  { count: 10, reward: 2, label: "10 Referrals -> $2.00 Cash Bonus" },
  { count: 25, reward: 5, label: "25 Referrals -> $5.00 Cash Bonus" },
  { count: 50, reward: 10, label: "50 Referrals -> $10.00 Cash Bonus" },
];

function ReferPage() {
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState<number | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile-referrals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const referralCount = profile?.referral_count ?? 0;
  const claimedMilestones: number[] = profile?.claimed_rewards ?? [];

  // Referral Link Generator
  const referralLink = `${window.location.origin}/register?ref=${profile?.id?.slice(0, 8) || "user"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  // Claim Milestone Reward
  const handleClaimReward = async (milestone: typeof REFERRAL_REWARDS[0]) => {
    if (!profile?.id) return;
    setClaiming(milestone.count);

    try {
      const updatedBalance = Number(profile.balance || 0) + milestone.reward;
      const updatedClaimed = [...claimedMilestones, milestone.count];

      const { error } = await supabase
        .from("profiles")
        .update({
          balance: updatedBalance,
          claimed_rewards: updatedClaimed,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success(`Congratulations! $${milestone.reward}.00 added to your balance!`);
      void queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim reward");
    } finally {
      setClaiming(null);
    }
  };

  return (
    <AppShell title="Refer & Earn Rewards" subtitle="Invite friends and unlock cash bonuses!">
      <div className="space-y-6">
        {/* REFERRAL LINK BOX */}
        <div className="surface-card p-5 border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            <h2 className="font-bold text-lg">Your Unique Referral Link</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link with your friends to invite them. Direct commission is disabled — earn milestones cash rewards instead!
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

        {/* TOTAL REFERRALS STATS */}
        <div className="surface-card p-5 border border-border rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Active Invites</p>
            <h3 className="text-3xl font-extrabold mt-1">{referralCount} Users</h3>
          </div>
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Users className="size-8" />
          </div>
        </div>

        {/* MILESTONE CASH REWARDS TIERS */}
        <div className="surface-card p-5 border border-border rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h2 className="font-bold text-lg">Referral Milestone Cash Rewards</h2>
          </div>

          <div className="grid gap-4">
            {REFERRAL_REWARDS.map((tier) => {
              const isClaimed = claimedMilestones.includes(tier.count);
              const isUnlocked = referralCount >= tier.count;
              const progress = Math.min(100, (referralCount / tier.count) * 100);

              return (
                <div key={tier.count} className="border border-border rounded-lg p-4 space-y-3 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className={`size-5 ${isUnlocked ? "text-amber-500" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-sm">{tier.label}</span>
                    </div>

                    {isClaimed ? (
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-4" /> Claimed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!isUnlocked || claiming === tier.count}
                        className={isUnlocked ? "bg-amber-600 hover:bg-amber-700 text-white font-bold" : ""}
                        onClick={() => handleClaimReward(tier)}
                      >
                        {claiming === tier.count ? "Claiming..." : isUnlocked ? `Claim $${tier.reward}.00` : "Locked"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{referralCount} / {tier.count} Referrals</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
                        }
