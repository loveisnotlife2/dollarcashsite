import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Banknote, ListChecks, ShieldCheck, Users } from "lucide-react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { usd } from "@/lib/dollarcash";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DollarCash — Daily Earning & Investment Plans in Pakistan" },
      {
        name: "description",
        content:
          "Start from $1. Earn fixed daily returns for 15 days, complete one paid daily task and earn $0.10 per referral. Deposit and withdraw with EasyPaisa or JazzCash.",
      },
      { property: "og:title", content: "DollarCash — Daily Earning & Investment Plans" },
      {
        property: "og:description",
        content:
          "Fixed daily returns, daily task rewards and referral bonuses with local EasyPaisa and JazzCash payments.",
      },
    ],
  }),
  component: Landing,
});

const plans = [
  { name: "Plan 1", cost: 1, daily: 0.15, total: 2.25 },
  { name: "Plan 2", cost: 2, daily: 0.25, total: 3.75 },
  { name: "Plan 3", cost: 5, daily: 0.5, total: 7.5 },
  { name: "Plan 4", cost: 10, daily: 1, total: 15 },
];

const features = [
  {
    icon: Banknote,
    title: "Fixed daily returns",
    text: "Your plan credits its daily return automatically at 12:00 AM Pakistan time for 15 days.",
  },
  {
    icon: ListChecks,
    title: "Paid daily tasks",
    text: "Active members can complete one task per plan each day for a $0.15 cash reward.",
  },
  {
    icon: Users,
    title: "Referral rewards",
    text: "Invite friends with your own link and get $0.10 the moment they activate a plan.",
  },
  {
    icon: ShieldCheck,
    title: "Local payments",
    text: "Deposit and withdraw in rupees through EasyPaisa and JazzCash. Minimum withdrawal $0.15.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="gradient-hero mx-3 rounded-3xl px-5 py-12 text-navy-foreground sm:px-10 sm:py-16">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          <BadgeCheck className="size-4 text-gold" /> dollarcash.site
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Grow your money daily with <span className="text-gold-gradient">DollarCash</span>
        </h1>
        <p className="mt-4 max-w-xl text-white/80">
          Choose a plan from just {usd(1)}, earn a fixed return every single night for 15 days, unlock
          paid daily tasks and get instant referral bonuses — all funded through EasyPaisa and
          JazzCash.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">
              Create free account <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-navy-foreground hover:bg-white/10"
          >
            <Link to="/auth">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Investment plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every plan runs for exactly 15 days and expires automatically.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.name} className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {p.name}
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold">{usd(p.cost)}</p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Daily return</dt>
                  <dd className="font-semibold text-primary">{usd(p.daily)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Validity</dt>
                  <dd className="font-semibold">15 days</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total return</dt>
                  <dd className="font-semibold text-gold">{usd(p.total)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="surface-card flex gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <Logo size={26} />
        <p className="mt-3">© {new Date().getFullYear()} DollarCash · dollarcash.site</p>
      </footer>
    </div>
  );
}
