"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleToggle } from "@/components/theme/locale-toggle";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { APP_NAME, BUSINESS_INFO, LEGAL_ROUTES } from "@/config/constants";

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function PublicNav() {
  const { t } = useLocale();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Killhouse
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.pricing}
          </Link>
          <Link
            href="https://docs.killhouse.io"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.docs}
          </Link>
          <div className="ml-2 h-4 w-px bg-border" />
          <LocaleToggle />
          <ThemeToggle />
          <Link
            href="/login"
            className="ml-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className="ml-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.nav.getStarted}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();
  const taglineLines = t.footer.tagline.split("\n");

  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold">Killhouse</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {taglineLines[0]}
              <br />
              {taglineLines[1]}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-sm font-medium">{t.footer.product}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-foreground"
                >
                  {t.nav.pricing}
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.killhouse.io"
                  className="transition-colors hover:text-foreground"
                >
                  {t.footer.documentation}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition-colors hover:text-foreground"
                >
                  {t.footer.dashboard}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-sm font-medium">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {t.footer.contact}
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/KillhouseLabs"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-medium">{t.footer.legal}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={LEGAL_ROUTES.PRIVACY}
                  className="transition-colors hover:text-foreground"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={LEGAL_ROUTES.TERMS}
                  className="transition-colors hover:text-foreground"
                >
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Korean legal compliance section */}
        <div className="mt-8 border-t border-border/40 pt-6 text-xs text-muted-foreground">
          <div className="space-y-0.5">
            <p className="font-medium text-muted-foreground/80">
              {BUSINESS_INFO.companyName}
            </p>
            <p>
              대표: {BUSINESS_INFO.representative} | 사업자등록번호:{" "}
              {BUSINESS_INFO.businessNumber}
            </p>
            <p>통신판매업 신고번호: {BUSINESS_INFO.ecommerceRegistration}</p>
            <p>{BUSINESS_INFO.address}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-6 text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} {APP_NAME}. {t.footer.allRights}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-xs">{t.footer.systemStatus}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <div className="flex min-h-screen flex-col">
        <PublicNav />
        <main className="flex-1 pt-16">{children}</main>
        <PublicFooter />
      </div>
    </LocaleProvider>
  );
}
