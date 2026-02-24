"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { APP_NAME, BUSINESS_INFO, LEGAL_ROUTES } from "@/config/constants";

export function AppFooter({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium">{BUSINESS_INFO.companyName}</span>
            <span>사업자등록번호: {BUSINESS_INFO.businessNumber}</span>
            <Link href={LEGAL_ROUTES.TERMS} className="hover:text-foreground">
              {t.footer.terms}
            </Link>
            <Link href={LEGAL_ROUTES.PRIVACY} className="hover:text-foreground">
              {t.footer.privacy}
            </Link>
          </div>
          <p>
            &copy; {currentYear} {APP_NAME}. {t.footer.allRights}
          </p>
        </div>
      </footer>
    );
  }

  const taglineLines = t.footer.tagline.split("\n");

  return (
    <footer className="border-t border-border/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/killhouse-logo-no-bg.png"
                alt="Killhouse"
                width={28}
                height={28}
                className="h-7 w-7"
              />
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
