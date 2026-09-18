import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Phone, UserPlus, LogIn, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Phone to Dummy Email Helper (Tries both 03... and 923... formats)
  const getDummyEmails = (inputPhone: string) => {
    const cleaned = inputPhone.replace(/\D/g, "");
    let raw = cleaned;
    if (cleaned.startsWith("92")) {
      raw = "0" + cleaned.slice(2);
    } else if (!cleaned.startsWith("0") && cleaned.length === 10) {
      raw = "0" + cleaned;
    }

    const formatted92 = "92" + raw.replace(/^0/, "");
    return [
      `${raw}@dollarcash.site`,
      `${formatted92}@dollarcash.site`,
      `${cleaned}@dollarcash.site`
    ];
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const emails = getDummyEmails(phone);

    try {
      if (isSignUp) {
        // Sign Up Flow (Uses Primary Formatted Email)
        const { data, error } = await supabase.auth.signUp({
          email: emails[0],
          password,
          options: {
            data: {
              phone: phone,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Account created successfully!");
          void navigate({ to: "/dashboard" });
        }
      } else {
        // Sign In Flow (Tries multiple format emails to avoid Invalid Credentials)
        let loginSuccess = false;
        let lastError = null;

        for (const emailAttempt of emails) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailAttempt,
            password,
          });

          if (!error && data.user) {
            loginSuccess = true;
            toast.success("Signed in successfully!");
            void navigate({ to: "/dashboard" });
            break;
          } else {
            lastError = error;
          }
        }

        if (!loginSuccess && lastError) {
          throw lastError;
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed. Check your details.");
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
                type="text"
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
