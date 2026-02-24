"use client";

import { useLocale } from "@/lib/i18n/locale-context";

interface PageHeaderProps {
  titleKey: "dashboard" | "projects" | "newProject" | "mypage";
}

export function PageHeader({ titleKey }: PageHeaderProps) {
  const { t } = useLocale();
  const page = t.pages[titleKey];

  return (
    <div>
      <h1 className="text-2xl font-bold">{page.title}</h1>
      <p className="mt-1 text-muted-foreground">{page.subtitle}</p>
    </div>
  );
}
