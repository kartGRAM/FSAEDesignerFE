import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Dropdown} from '@app/components/AdminLTE';

export interface Language {
  key: string;
  icon: string;
  label: string;
}

const languages: Language[] = [
  {
    key: 'jp',
    icon: 'flag-icon-jp',
    label: 'header.language.japanese'
  },
  {
    key: 'en',
    icon: 'flag-icon-us',
    label: 'header.language.english'
  },
  {
    key: 'de',
    icon: 'flag-icon-de',
    label: 'header.language.german'
  },
  {
    key: 'fr',
    icon: 'flag-icon-fr',
    label: 'header.language.french'
  }
];

const LanguagesDropdown = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {t, i18n} = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getCurrentLanguage = (): Language => {
    const currentLanguage = i18n.language;
    if (currentLanguage) {
      const language = languages.find(
        (language: Language) => language.key === currentLanguage
      );
      return language || languages[0];
    }
    return languages[0];
  };

  const isActiveLanguage = (language: Language) => {
    if (language) {
      return getCurrentLanguage().key === language.key ? 'active' : '';
    }
    return '';
  };

  return (
    <Dropdown
      isOpen={dropdownOpen}
      onChange={(open: boolean) => setDropdownOpen(open)}
      buttonTemplate={
        <i className={`flag-icon ${getCurrentLanguage().icon}`} />
      }
      menuTemplate={languages.map((language) => (
        <button
          type="button"
          key={language.key}
          className={`dropdown-item ${isActiveLanguage(language)}`}
          onClick={() => {
            changeLanguage(language.key);
            setDropdownOpen(false);
          }}
        >
          <i className={`flag-icon ${language.icon} mr-2`} />
          <span>{t(language.label)}</span>
        </button>
      ))}
    />
  );
};

export default LanguagesDropdown;
