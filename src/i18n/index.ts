import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./resources/en";
import ro from "./resources/ro";
import bg from "./resources/bg";

const resources = {
  en: { translation: en },
  ro: { translation: ro },
  bg: { translation: bg }
};

const supported = ["en", "ro", "bg"];
const locale = Localization.getLocales()[0]?.languageCode ?? "en";
const language = supported.includes(locale) ? locale : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: language,
  fallbackLng: "en",
  interpolation: { escapeValue: true }
});

export default i18n;
