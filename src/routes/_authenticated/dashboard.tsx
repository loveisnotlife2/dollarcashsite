import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, TrendingUp, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

export function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Simple User Balance & Payment Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Balance Card */}
          <div className="surface-card p-5 border border-border rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <h3 className="text-2xl font-bold">$0.00</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Wallet className="size-6" />
            </div>
          </div>

          {/* Rate Card */}
          <div className="surface-card p-5 border border-border rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">1 USD Rate</p>
              <h3 className="text-2xl font-bold">280 PKR</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <TrendingUp className="size-6" />
            </div>
          </div>

          {/* EasyPaisa Card */}
          <div className="surface-card p-5 border border-border rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">EasyPaisa Account</p>
              <h3 className="text-lg font-bold">03133221347</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <DollarSign className="size-6" />
            </div>
          </div>

          {/* JazzCash Card */}
          <div className="surface-card p-5 border border-border rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">JazzCash Account</p>
              <h3 className="text-lg font-bold">03133221347</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
              <Users className="size-6" />
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
