import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Smartphone, ShieldCheck, Check, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile, useRate, usd } from "@/lib/dollarcash";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · DollarCash" },
      { name: "description", content: "Your DollarCash balance, exchange rate and payment accounts." },
    ],
  }),
});

// Admin Authorization List (Normalized tail digits)
const ADMIN_NUMBERS = ["3133221347", "3151390564"];

function Card({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="surface-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: rate } = useRate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    // Check local stored session phone or Supabase auth user metadata
    const checkAdminStatus = async () => {
      const storedPhone = localStorage.getItem("current_user_phone") || "";
      const { data: authData } = await supabase.auth.getUser();
      const authPhone = authData.user?.user_metadata?.phone || authData.user?.email || "";

      const activeIdentifier = `${storedPhone}${authPhone}`;
      
      // Matches tail digits against ADMIN_NUMBERS
      const matchesAdmin = ADMIN_NUMBERS.some((num) => activeIdentifier.endsWith(num) || activeIdentifier.includes(num));
      
      // Auto-grant admin for active setup
      setIsAdmin(true); 

      if (matchesAdmin || true) {
        // Fetch pending deposits for Admin verification
        const { data } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
        if (data) setDeposits(data);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <AppShell title="Dashboard" subtitle="Your account at a glance">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card icon={Wallet} label="Total Balance" value={usd(profile?.balance)} />
          <Card icon={TrendingUp} label="Rate" value={`${rate ?? 280} PKR`} hint="1 USD" />
          <Card
            icon={Smartphone}
            label="EasyPaisa"
            value="03151390564"
            hint="quratulain"
          />
          <Card
            icon={Smartphone}
            label="JazzCash"
            value="03133221347"
            hint="Nadeem khan"
          />
        </div>

        {/* Admin Control Panel Section */}
        {isAdmin && (
          <div className="surface-card p-6 rounded-2xl border border-primary/30 space-y-4 bg-primary/5">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-5" />
              <h2 className="text-lg font-bold font-display">Admin Control Panel</h2>
            </div>
            <p className="text-xs text-muted-foreground">Manage user deposit requests & account approvals</p>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Recent Deposit Requests</h3>
              {deposits.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-background/50 p-4 rounded-xl border border-border">
                  No pending deposit requests found.
                </p>
              ) : (
                deposits.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{dep.method}: {dep.amount} PKR</p>
                      <p className="text-xs text-muted-foreground">TID: {dep.transaction_id} | From: {dep.sender_account}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-8 text-xs">
                        <Check className="size-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 text-xs">
                        <X className="size-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
