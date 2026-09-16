import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground">Total Balance</p>
          <h3 className="text-2xl font-bold">$0.00</h3>
        </div>

        <div className="p-5 border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground">1 USD Rate</p>
          <h3 className="text-2xl font-bold">280 PKR</h3>
        </div>

        <div className="p-5 border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground">EasyPaisa Account</p>
          <h3 className="text-lg font-bold">03133221347</h3>
        </div>

        <div className="p-5 border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground">JazzCash Account</p>
          <h3 className="text-lg font-bold">03133221347</h3>
        </div>
      </div>
    </div>
  );
}
