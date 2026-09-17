import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <div style={{ padding: '20px', color: '#fff', background: '#0a111e', minHeight: '100vh' }}>
      <h1>Dashboard Page</h1>
      <p>Welcome to your DollarCash Dashboard!</p>
    </div>
  );
}
