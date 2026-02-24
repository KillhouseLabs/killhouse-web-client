"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n/locale-context";
import { DeleteAccountButton } from "./delete-account-button";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHeader } from "@/components/layout/page-header";

export function SettingsContent() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      try {
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(
            data.status === "ACTIVE" || data.status === "TRIALING"
          );
        }
      } catch {
        // Fail silently — default to allowing deletion
      }
    }
    fetchSubscriptionStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader titleKey="settings" />

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t.settings.profile.title}
        </h2>
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-20 w-20 rounded-full"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-muted-foreground"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t.settings.profile.name}
              </label>
              <input
                type="text"
                defaultValue={session?.user?.name || ""}
                className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t.settings.profile.email}
              </label>
              <input
                type="email"
                defaultValue={session?.user?.email || ""}
                className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                disabled
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.settings.profile.emailReadonly}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.settings.profile.save}
            </button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t.settings.security.title}
        </h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t.settings.security.currentPassword}
            </label>
            <PasswordInput />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t.settings.security.newPassword}
            </label>
            <PasswordInput />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t.settings.security.confirmPassword}
            </label>
            <PasswordInput />
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.settings.security.changePassword}
          </button>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="rounded-xl border border-destructive/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-destructive">
          {t.settings.account.title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.settings.account.deleteWarning}
        </p>
        <DeleteAccountButton hasActiveSubscription={hasActiveSubscription} />
      </div>
    </div>
  );
}
