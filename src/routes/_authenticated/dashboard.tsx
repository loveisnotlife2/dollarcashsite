import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DollarCash" },
      { name: "description", content: "View your DollarCash balance and local payment accounts." },
      { property: "og:title", content: "Dashboard — DollarCash" },
      { property: "og:description", content: "View your DollarCash balance and local payment accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const cards = [
  ["Total Balance", "$0.00"],
  ["Rate", "280 PKR"],
  ["EasyPaisa", "03133221347"],
  ["JazzCash", "03133221347"],
] as const;

function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
