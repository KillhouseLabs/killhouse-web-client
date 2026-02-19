"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Dictionary } from "./dictionaries/en";
import enDict from "./dictionaries/en";
import koDict from "./dictionaries/ko";
import type { Locale } from "./index";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: enDict,
  setLocale: () => {},
});

const dicts: Record<Locale, Dictionary> = { en: enDict, ko: koDict };

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=(\w+)/);
  return (match?.[1] === "ko" ? "ko" : "en") as Locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    document.documentElement.lang = l;
  }, []);

  const value = useMemo(
    () => ({ locale, t: dicts[locale], setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
