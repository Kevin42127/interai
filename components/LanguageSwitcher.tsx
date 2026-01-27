'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/i18n';
import styles from './LanguageSwitcher.module.css';

const localeNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
};

const localeFlags: Record<Locale, string> = {
  'zh-TW': '🇹🇼',
  'en': '🇺🇸',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    const scrollPosition = window.scrollY;
    if (scrollPosition > 0) {
      sessionStorage.setItem('preserveScroll', scrollPosition.toString());
    }

    let pathWithoutLocale = pathname;
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}`)) {
        pathWithoutLocale = pathname.slice(`/${loc}`.length) || '/';
        break;
      }
    }

    const newPath = newLocale === defaultLocale
      ? pathWithoutLocale
      : `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    
    setIsOpen(false);
    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <div className={styles.languageSwitcher} ref={containerRef}>
      <button 
        className={styles.trigger} 
        onClick={toggleDropdown}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg 
          className={styles.globeIcon}
          xmlns="http://www.w3.org/2000/svg" 
          height="24px" 
          viewBox="0 -960 960 960" 
          width="24px"
        >
          <path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z"/>
        </svg>
        <span className={styles.currentLocale}>
          {isPending ? t('switching') : (
            <>
              <span className={styles.flag}>{localeFlags[locale]}</span>
              {localeNames[locale]}
            </>
          )}
        </span>
        <span className={`material-icons ${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
          arrow_drop_down
        </span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              disabled={isPending}
              className={`${styles.option} ${loc === locale ? styles.active : ''}`}
            >
              <span className={styles.flag}>{localeFlags[loc]}</span>
              {localeNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
