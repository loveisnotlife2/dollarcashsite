import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid mobile number");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const internalEmail = `${cleanPhone}@dollarcash.site`;

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: internalEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim() || cleanPhone,
              phone_number: cleanPhone,
            },
          },
        });

        if (signUpError && !signUpError.message.includes("Email not confirmed")) {
          throw signUpError;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: password,
        });

        if (signInError && !signInError.message.includes("Email not confirmed")) {
          throw signInError;
        }

        toast.success("Account created successfully!");
        window.location.assign("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: password,
        });

        if (error && !error.message.includes("Email not confirmed")) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect Phone Number or Password.");
          }
          throw error;
        }

        toast.success("Welcome back!");
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">DollarCash</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Create account with Mobile Number" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="mt-6 space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nadeem Khan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              type="text"
              placeholder="03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Processing..." : isSignUp ? "Register Now" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Register with Mobile Number"}
          </button>
        </div>
      </div>
    </div>
  );
}
