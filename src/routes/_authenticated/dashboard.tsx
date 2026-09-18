import { createFileRoute } from "@tanstack/react-router";
import { Wallet, TrendingUp, Smartphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useProfile, usePaymentMethods, useRate, usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · DollarCash" },
      { name: "description", content: "Your DollarCash balance, exchange rate and payment accounts." },
      { property: "og:title", content: "Dashboard · DollarCash" },
      { property: "og:description", content: "Your DollarCash balance, exchange rate and payment accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Card({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
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
  const { data: methods } = usePaymentMethods();

  const find = (name: string) =>
    methods?.find((m) => String(m.method).toLowerCase() === name);
  const easypaisa = find("easypaisa");
  const jazzcash = find("jazzcash");

  return (
    <AppShell title="Dashboard" subtitle="Your account at a glance">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card icon={Wallet} label="Total Balance" value={usd(profile?.balance)} />
        <Card icon={TrendingUp} label="Rate" value={`${rate ?? 280} PKR`} hint="1 USD" />
        <Card
          icon={Smartphone}
          label="EasyPaisa"
          value={easypaisa?.account_number ?? "—"}
          hint={easypaisa?.account_title ?? undefined}
        />
        <Card
          icon={Smartphone}
          label="JazzCash"
          value={jazzcash?.account_number ?? "—"}
          hint={jazzcash?.account_title ?? undefined}
        />
      </div>
    </AppShell>
  );
}
