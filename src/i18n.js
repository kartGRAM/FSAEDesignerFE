import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import translationJP from './locales/jp/translation.json';
import translationEN from './locales/en/translation.json';
import translationDE from './locales/de/translation.json';
import translationFR from './locales/fr/translation.json';

// the translations
const resources = {
  jp: {
    translation: translationJP
  },
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  },
  de: {
    translation: translationDE
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'jp',
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      wait: true
    }
  });

export default i18n;
