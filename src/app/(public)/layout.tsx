"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleToggle } from "@/components/theme/locale-toggle";
import { useLocale } from "@/lib/i18n/locale-context";
import { AppFooter } from "@/components/layout/app-footer";

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

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1 pt-16">{children}</main>
      <AppFooter variant="full" />
    </div>
  );
}
