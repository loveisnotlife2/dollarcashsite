import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Phone, UserPlus, LogIn, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const EMAIL_DOMAIN = "dollarcash.site";

/** Last 10 digits of the mobile number — the single source of truth for both flows. */
function coreDigits(input: string) {
  return input.replace(/\D/g, "").slice(-10);
}

/** Canonical identifier used by BOTH signup and login: 03XXXXXXXXX@dollarcash.site */
function primaryEmail(input: string) {
  return `0${coreDigits(input)}@${EMAIL_DOMAIN}`;
}

/** Legacy formats kept only so older accounts can still sign in. */
function legacyEmails(input: string) {
  const core = coreDigits(input);
  return [`92${core}@${EMAIL_DOMAIN}`, `${core}@${EMAIL_DOMAIN}`];
}

function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Keep any referral code from the invite link.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("dc-ref", ref);
  }, []);

  async function finish() {
    const ref = localStorage.getItem("dc-ref");
    // Idempotent: creates the member record only when it does not exist yet.
    await supabase.rpc("bootstrap_profile", {
      p_username: phone.trim(),
      p_ref_code: ref ?? "",
    });
    localStorage.removeItem("dc-ref");
    void navigate({ to: "/dashboard" });
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const core = coreDigits(phone);
    if (core.length !== 10 || !password) {
      toast.error("Enter a valid mobile number (e.g. 03001234567) and password");
      return;
    }
    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const email = primaryEmail(phone);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone: `0${core}` } },
        });
        if (error) throw error;

        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;

        toast.success("Account created and signed in!");
        await finish();
      } else {
        let lastError: unknown = null;
        for (const attempt of [email, ...legacyEmails(phone)]) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: attempt,
            password,
          });
          if (!error && data.user) {
            toast.success("Signed in successfully!");
            await finish();
            return;
          }
          lastError = error;
        }
        throw lastError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.toLowerCase().includes("invalid login")
          ? "Wrong mobile number or password. Please try again."
          : message || "Authentication failed. Check your details.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 surface-card p-6 sm:p-8 rounded-2xl border border-border shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            DollarCash
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="03001234567"
                className="pl-9"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? (
              "Processing..."
            ) : isSignUp ? (
              <>
                <UserPlus className="mr-2 size-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="mr-2 size-4" /> Sign In
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border">
          <button
            type="button"
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? (
              <>Already have an account? Sign In</>
            ) : (
              <>Don't have an account? Register with Mobile Number</>
            )}
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
