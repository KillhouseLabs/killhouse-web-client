import Link from "next/link";
import { PLANS } from "@/config/constants";

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for every team size",
};

function formatLimitEn(value: number): string {
  return value === -1 ? "Unlimited" : value.toString();
}

function formatPriceEn(price: number): string {
  if (price === -1) return "Custom";
  if (price === 0) return "$0";
  return `$${price.toLocaleString()}`;
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Simple pricing, powerful security
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Choose the plan that fits your project. Every plan includes core
          security analysis features.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Perfect for personal projects
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">
                {formatPriceEn(PLANS.FREE.price)}
              </span>
              <span className="text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Up to {formatLimitEn(PLANS.FREE.limits.projects)} projects
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimitEn(PLANS.FREE.limits.analysisPerMonth)}{" "}
                analyses/month
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                GitHub/GitLab integration
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Basic vulnerability reports
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <XIcon />
                Penetration testing
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <XIcon />
                Priority support
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              Start Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
              Popular
            </span>
            <h3 className="text-xl font-semibold">Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For teams and startups
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">
                {formatPriceEn(PLANS.PRO.price)}
              </span>
              <span className="text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimitEn(PLANS.PRO.limits.projects)} projects
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                {formatLimitEn(PLANS.PRO.limits.analysisPerMonth)}{" "}
                analyses/month
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                GitHub/GitLab integration
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Detailed vulnerability reports
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Penetration testing
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Priority support
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Pro
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">Enterprise</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For large organizations
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold">Custom</span>
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Unlimited everything
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                SSO / SAML
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                On-premise deployment
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Custom security policies
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                Dedicated support
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon />
                SLA guarantee
              </li>
            </ul>
            <Link
              href="mailto:sales@killhouse.io"
              className="mt-8 block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">
                Can I upgrade from Free to Pro at any time?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes, you can upgrade at any time. All your existing projects and
                analysis results will be preserved.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">
                How does penetration testing work?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                After static analysis, your application runs in a sandboxed
                environment where automated penetration tests simulate real
                attack scenarios to verify vulnerabilities.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">
                Can I analyze private repositories?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes, connect your GitHub or GitLab account to analyze private
                repositories. Repository access is only used during analysis.
              </p>
            </div>
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
