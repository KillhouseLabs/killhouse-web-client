"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ko" : "en")}
      className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      aria-label={locale === "en" ? "한국어로 전환" : "Switch to English"}
    >
      {locale === "en" ? "KO" : "EN"}
    </button>
  );
}
