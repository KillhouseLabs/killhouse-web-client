"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLocale } from "@/lib/i18n/locale-context";

interface DeleteAccountButtonProps {
  hasActiveSubscription?: boolean;
}

export function DeleteAccountButton({
  hasActiveSubscription = false,
}: DeleteAccountButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLocale();

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.settings.account.deleteFailed);
        setIsDeleting(false);
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError(t.settings.account.deleteError);
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setError("");
  };

  if (hasActiveSubscription) {
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.settings.account.cancelSubscriptionFirst}
        </p>
        <Link
          href="/subscription"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.settings.account.goToSubscription}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {isConfirming ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting
              ? t.settings.account.deleting
              : t.settings.account.confirmDelete}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          {t.settings.account.deleteButton}
        </button>
      )}
    </div>
  );
}
