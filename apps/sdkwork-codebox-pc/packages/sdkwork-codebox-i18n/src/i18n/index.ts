import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./generated/en-US";
import ja from "./generated/ja-JP";
import zh from "./generated/zh-CN";

type Language = "zh" | "en" | "ja";

const DEFAULT_LANGUAGE: Language = "zh";

const getInitialLanguage = (): Language => {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("language");
      if (stored === "zh" || stored === "en" || stored === "ja") {
        return stored;
      }
    } catch (error) {
      console.warn("[i18n] Failed to read stored language preference", error);
    }
  }

  const navigatorLang =
    typeof navigator !== "undefined"
      ? (navigator.language?.toLowerCase() ??
        navigator.languages?.[0]?.toLowerCase())
      : undefined;

  if (navigatorLang?.startsWith("zh")) {
    return "zh";
  }

  if (navigatorLang?.startsWith("ja")) {
    return "ja";
  }

  if (navigatorLang?.startsWith("en")) {
    return "en";
  }

  return DEFAULT_LANGUAGE;
};

const resources = {
  en: {
    translation: en,
  },
  ja: {
    translation: ja,
  },
  zh: {
    translation: zh,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(), // choose default language from stored preference or system language
  fallbackLng: "en", // fall back to English when a translation is missing

  interpolation: {
    escapeValue: false, // React already escapes by default
  },

  // show debug info during development
  debug: false,
});

export default i18n;
