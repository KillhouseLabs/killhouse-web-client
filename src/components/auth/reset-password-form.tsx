"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function ResetPasswordForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{t.auth.resetPassword.title}</h1>
            <p className="mt-2 text-sm text-destructive">
              {t.auth.resetPassword.invalidToken}
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.auth.resetPassword.requestAgain}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t.auth.resetPassword.errors.mismatch);
      return;
    }

    if (password.length < 8) {
      setError(t.auth.resetPassword.errors.tooShort);
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(t.auth.resetPassword.errors.weak);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.auth.resetPassword.errors.resetFailed);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(t.auth.resetPassword.errors.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-green-600"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">
              {t.auth.resetPassword.success.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.auth.resetPassword.success.description}
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.auth.resetPassword.success.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{t.auth.resetPassword.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.resetPassword.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              {t.auth.resetPassword.newPassword}
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium"
            >
              {t.auth.resetPassword.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              ? t.auth.resetPassword.submitting
              : t.auth.resetPassword.submit}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t.auth.resetPassword.hint}
        </p>
      </div>
    </div>
  );
}
