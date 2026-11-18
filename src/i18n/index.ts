import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import id from "@/locales/id.json";

// Keys are the English source strings: t("Dashboard"), not t("nav.dashboard").
// `pnpm i18n:sync` collects them from src/ into the locale files.
export const SUPPORTED_LOCALES = ["en", "id"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

const STORAGE_KEY = "locale";

export const isLocale = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

const readStoredLocale = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const detectLocale = (): Locale => {
  const stored = readStoredLocale();
  if (stored && isLocale(stored)) return stored;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split("-")[0];
    if (base && isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: detectLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  // Keys are sentences: "." and ":" are text, not separators.
  keySeparator: false,
  nsSeparator: false,
  // Untranslated ("") entries fall back to English, then to the key itself.
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});

const applyLocale = (locale: string) => {
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // storage unavailable (private mode): keep it for this session only
  }
};

applyLocale(i18n.language);
i18n.on("languageChanged", applyLocale);

export default i18n;
