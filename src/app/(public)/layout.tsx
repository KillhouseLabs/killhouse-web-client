"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleToggle } from "@/components/theme/locale-toggle";
import { useLocale } from "@/lib/i18n/locale-context";
import { AppFooter } from "@/components/layout/app-footer";

function PublicNav() {
  const { t } = useLocale();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/killhouse-logo-no-bg.png"
            alt="Killhouse"
            width={32}
            height={32}
            className="h-8 w-8"
          />
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
