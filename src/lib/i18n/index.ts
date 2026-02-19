import en from "./dictionaries/en";
import ko from "./dictionaries/ko";
import type { Dictionary } from "./dictionaries/en";

export type Locale = "en" | "ko";

const dictionaries: Record<Locale, Dictionary> = { en, ko };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getLocaleFromHeaders(): Locale {
  return "en";
}

export type { Dictionary };
