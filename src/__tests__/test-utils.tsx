import { render, RenderOptions } from "@testing-library/react";
import { useLocale } from "@/lib/i18n/locale-context";
import enDict from "@/lib/i18n/dictionaries/en";
import koDict from "@/lib/i18n/dictionaries/ko";

const mockedUseLocale = useLocale as jest.Mock;

export function renderWithLocale(
  ui: React.ReactElement,
  locale: "en" | "ko" = "ko",
  options?: Omit<RenderOptions, "wrapper">
) {
  const dict = locale === "en" ? enDict : koDict;
  mockedUseLocale.mockReturnValue({
    locale,
    t: dict,
    setLocale: jest.fn(),
  });

  const result = render(ui, options);

  // Restore default Korean mock after render
  mockedUseLocale.mockReturnValue({
    locale: "ko",
    t: koDict,
    setLocale: jest.fn(),
  });

  return result;
}
