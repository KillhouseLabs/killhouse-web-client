"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { PLANS } from "@/domains/subscription/model/plan";
import { useLocale } from "@/lib/i18n/locale-context";

export default function PricingPage() {
  const { t } = useLocale();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const proCtaHref = isAuthenticated ? "/subscription" : "/signup";

  function formatLimit(value: number): string {
    return value === -1 ? t.pricing.features.unlimited : value.toString();
  }

  function formatPrice(price: number): string {
    if (price === -1) return t.pricing.custom;
    if (price === 0) return "$0";
    return `$${price.toLocaleString()}`;
  }

  return (
    <>
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t.pricing.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t.pricing.subtitle}
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">{t.pricing.free.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.pricing.free.description}
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">
                {formatPrice(PLANS.FREE.price)}
              </span>
              <span className="text-muted-foreground">
                {t.pricing.perMonth}
              </span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.upTo}{" "}
                {formatLimit(PLANS.FREE.limits.projects)}{" "}
                {t.pricing.features.projects}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimit(PLANS.FREE.limits.analysisPerMonth)}{" "}
                {t.pricing.features.analysesPerMonth}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.githubGitlab}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.basicReports}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <XIcon />
                {t.pricing.features.pentest}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <XIcon />
                {t.pricing.features.prioritySupport}
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              {t.pricing.free.cta}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
              {t.pricing.pro.badge}
            </span>
            <h3 className="text-xl font-semibold">{t.pricing.pro.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.pricing.pro.description}
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">
                {formatPrice(PLANS.PRO.price)}
              </span>
              <span className="text-muted-foreground">
                {t.pricing.perMonth}
              </span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimit(PLANS.PRO.limits.projects)}{" "}
                {t.pricing.features.projects}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimit(PLANS.PRO.limits.analysisPerMonth)}{" "}
                {t.pricing.features.analysesPerMonth}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.githubGitlab}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.detailedReports}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.pentest}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.prioritySupport}
              </li>
            </ul>
            <Link
              href={proCtaHref}
              className="mt-8 block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.pricing.pro.cta}
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">
              {t.pricing.enterprise.name}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.pricing.enterprise.description}
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">{t.pricing.custom}</span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.unlimitedEverything}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.ssoSaml}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.onPremise}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.customPolicies}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.dedicatedSupport}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {t.pricing.features.slaGuarantee}
              </li>
            </ul>
            <Link
              href="mailto:sales@killhouse.io"
              className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              {t.pricing.enterprise.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            {t.pricing.faq.title}
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            {t.pricing.faq.items.map((item) => (
              <div
                key={item.question}
                className="rounded-lg border border-border bg-card p-6"
              >
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground/50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
