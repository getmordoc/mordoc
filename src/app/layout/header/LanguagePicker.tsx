import { useEffect, useId, useRef, useState } from 'react';
import { useUiStrings } from '../../i18n/useUiStrings.js';
import { formatUiString } from '../../i18n/format.js';
import styles from './LanguagePicker.module.css';

/**
 * Maps ISO 639-1 (and common BCP-47) language codes to their native-script autonyms.
 * Keys are lowercase. Add entries here as needed.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  af: 'Afrikaans',
  am: 'አማርኛ',
  ar: 'العربية',
  az: 'Azərbaycan',
  be: 'Беларуская',
  bg: 'Български',
  bn: 'বাংলা',
  bs: 'Bosanski',
  ca: 'Català',
  cs: 'Čeština',
  cy: 'Cymraeg',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  en: 'English',
  eo: 'Esperanto',
  es: 'Español',
  et: 'Eesti',
  eu: 'Euskara',
  fa: 'فارسی',
  fi: 'Suomi',
  fil: 'Filipino',
  fr: 'Français',
  ga: 'Gaeilge',
  gl: 'Galego',
  gu: 'ગુજરાતી',
  he: 'עברית',
  hi: 'हिन्दी',
  hr: 'Hrvatski',
  hu: 'Magyar',
  hy: 'Հայերեն',
  id: 'Indonesia',
  is: 'Íslenska',
  it: 'Italiano',
  ja: '日本語',
  ka: 'ქართული',
  kk: 'Қазақша',
  km: 'ភាសាខ្មែរ',
  kn: 'ಕನ್ನಡ',
  ko: '한국어',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  mk: 'Македонски',
  ml: 'മലയാളം',
  mn: 'Монгол',
  mr: 'मराठी',
  ms: 'Melayu',
  my: 'မြန်မာ',
  nb: 'Norsk',
  ne: 'नेपाली',
  nl: 'Nederlands',
  pa: 'ਪੰਜਾਬੀ',
  pl: 'Polski',
  pt: 'Português',
  ro: 'Română',
  ru: 'Русский',
  si: 'සිංහල',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  sq: 'Shqip',
  sr: 'Српски',
  sv: 'Svenska',
  sw: 'Kiswahili',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  th: 'ภาษาไทย',
  tr: 'Türkçe',
  uk: 'Українська',
  ur: 'اردو',
  uz: 'Oʻzbek',
  vi: 'Tiếng Việt',
  zh: '中文',
  'zh-cn': '中文（简体）',
  'zh-tw': '中文（繁體）',
  zu: 'IsiZulu',
};

/** Returns the display name for a language code, falling back to the uppercased code. */
function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

interface LanguagePickerProps {
  languages: string[];
  currentLang: string;
  onChange: (lang: string) => void;
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 'var(--lang-icon-size)', height: 'var(--lang-icon-size)', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function LanguagePicker({ languages, currentLang, onChange }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const t = useUiStrings();

  useEffect(() => {
    if (!open) return;

    // Opening puts the keyboard on the current language.
    listRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();

    // A click or the keyboard moving outside the picker closes the list.
    function handleOutside(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // The arrow keys, Home and End move the keyboard between the languages.
  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const buttons = [...e.currentTarget.querySelectorAll('button')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'ArrowDown'
        ? Math.min(current + 1, buttons.length - 1)
        : e.key === 'ArrowUp'
          ? Math.max(current - 1, 0)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? buttons.length - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={formatUiString(t.nav.languageTriggerLabel, {
          language: getLanguageName(currentLang),
        })}
      >
        <GlobeIcon />
        <span className={styles.code}>{getLanguageName(currentLang)}</span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          className={styles.dropdown}
          aria-label={t.nav.selectLanguageLabel}
          onKeyDown={handleListKeyDown}
        >
          {languages.map((lang) => (
            <li key={lang}>
              <button
                type="button"
                aria-current={lang === currentLang ? 'true' : undefined}
                className={`${styles.option}${lang === currentLang ? ` ${styles.optionActive}` : ''}`}
                onClick={() => {
                  onChange(lang);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {getLanguageName(lang)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
