"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function ForgotPasswordForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t.auth.forgotPassword.errors.emptyEmail);
      return;
    }

    if (!email.includes("@")) {
      setError(t.auth.forgotPassword.errors.invalidEmail);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.auth.forgotPassword.errors.requestError);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError(t.auth.forgotPassword.errors.requestError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">
              {t.auth.forgotPassword.success.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.auth.forgotPassword.success.description}
            </p>
          </div>

          <Link
            href="/login"
            className="mt-4 block w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-accent"
          >
            {t.auth.forgotPassword.success.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{t.auth.forgotPassword.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.forgotPassword.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              {t.auth.forgotPassword.email}
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading
              ? t.auth.forgotPassword.submitting
              : t.auth.forgotPassword.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.forgotPassword.remember}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t.auth.forgotPassword.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
