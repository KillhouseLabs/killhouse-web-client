import { render, RenderOptions } from "@testing-library/react";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export function renderWithLocale(
  ui: React.ReactElement,
  locale: "en" | "ko" = "ko",
  options?: Omit<RenderOptions, "wrapper">
) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value: `locale=${locale}`,
  });
  return render(ui, {
    wrapper: ({ children }) => <LocaleProvider>{children}</LocaleProvider>,
    ...options,
  });
}
