"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Lock, AlertCircle } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid password");
        setLoading(false);
        return;
      }

      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sqm-text-muted)]" />
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 bg-[var(--sqm-bg-elevated)] border-[var(--sqm-border)] text-[var(--sqm-text-primary)] placeholder:text-[var(--sqm-text-muted)] focus:border-[var(--sqm-green)] focus:ring-[var(--sqm-green)]/20"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full sqm-button"
        disabled={loading || !password}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sqm-bg-primary)] p-4 noise-overlay">
      {/* Subtle radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--sqm-glow)_0%,_transparent_70%)] opacity-30 pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="sqm-card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--sqm-green)] to-[var(--sqm-green-light)] flex items-center justify-center shadow-lg shadow-[var(--sqm-glow)]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold text-[var(--sqm-text-primary)] tracking-wide">
                  SQM Images
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sqm-text-muted)]">
                  AI Generator
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="sqm-divider mb-8" />

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="font-serif text-xl font-medium text-[var(--sqm-text-primary)] mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-[var(--sqm-text-muted)]">
              Enter your password to access the generator
            </p>
          </div>

          {/* Form */}
          <Suspense
            fallback={
              <div className="text-center text-[var(--sqm-text-muted)]">
                Loading...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--sqm-text-muted)]">
            SQM Architects
          </p>
          <p className="text-[9px] text-[var(--sqm-text-muted)] mt-1 opacity-60">
            Internal Tool
          </p>
        </div>
      </div>
    </div>
  );
}
