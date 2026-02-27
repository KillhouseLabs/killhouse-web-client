"use client";

import Link from "next/link";
import { PLANS } from "@/domains/subscription/model/plan";
import { useLocale } from "@/lib/i18n/locale-context";

interface UsageInfo {
  current: number;
  limit: number;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "project" | "analysis";
  usage?: UsageInfo;
}

export function UpgradeModal({
  isOpen,
  onClose,
  type,
  usage,
}: UpgradeModalProps) {
  const { t } = useLocale();

  if (!isOpen) return null;

  const title =
    type === "project"
      ? t.subscription.modal.projectLimitTitle
      : t.subscription.modal.analysisLimitTitle;
  const description =
    type === "project"
      ? t.subscription.modal.projectLimitDescription
      : t.subscription.modal.analysisLimitDescription;

  const limitText =
    type === "project"
      ? t.subscription.modal.projectLimitText
          .replace("{current}", String(usage?.current || 0))
          .replace(
            "{limit}",
            String(usage?.limit || PLANS.FREE.limits.projects)
          )
      : t.subscription.modal.analysisLimitText
          .replace("{current}", String(usage?.current || 0))
          .replace(
            "{limit}",
            String(usage?.limit || PLANS.FREE.limits.analysisPerMonth)
          );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-md rounded-xl bg-card p-6">
        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Title & Description */}
        <h2 className="mt-4 text-center text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-center text-muted-foreground">{description}</p>

        {/* Usage Info */}
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t.subscription.modal.usageLabel}
            </span>
            <span className="font-medium">{limitText}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-amber-500" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium">
            {t.subscription.modal.upgradeFeatureTitle}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t.subscription.modal.features.unlimitedProjects}</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t.subscription.modal.features.monthlyAnalyses}</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t.subscription.modal.features.storage}</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t.subscription.modal.features.prioritySupport}</span>
            </li>
          </ul>
        </div>

        {/* Price */}
        <div className="mt-6 text-center">
          <span className="text-3xl font-bold">
            ₩{PLANS.PRO.price.toLocaleString()}
          </span>
          <span className="text-muted-foreground">{t.common.perMonth}</span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {t.subscription.modal.upgradeButton}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            {t.subscription.modal.laterButton}
          </button>
        </div>
      </div>
    </div>
  );
}
