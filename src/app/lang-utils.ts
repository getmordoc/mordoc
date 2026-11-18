import type { LanguageConfig } from '../types/language.js';
import type { SidenavConfig } from '../types/navigation.js';

/**
 * Lang utilities for the React app. Imports only types from src/types/:
 * src/app/ ships as source and the user's Vite compiles it, so it may not
 * import code from outside its own directory.
 */

export function detectCurrentLang(
  pathname: string,
  language: LanguageConfig | null,
  defaultLanguage: string,
): string {
  if (!language || language.languages.length <= 1) return defaultLanguage;
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  const nonDefault = language.languages.filter((l) => l !== defaultLanguage);
  return nonDefault.includes(firstSegment) ? firstSegment : defaultLanguage;
}

export function buildLangPrefix(lang: string, defaultLanguage: string): string {
  return lang === defaultLanguage ? '' : `/${lang}`;
}

export function stripLangPrefix(
  pathname: string,
  lang: string,
  defaultLanguage: string,
): string {
  if (lang === defaultLanguage) return pathname;
  const prefix = `/${lang}`;
  const stripped = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  return stripped || '/';
}

export function resolveLabel(
  defaultLabel: string,
  lang: string,
  defaultLanguage: string,
  translations: Record<string, Record<string, string>>,
): string {
  if (lang === defaultLanguage) return defaultLabel;
  return translations[lang]?.[defaultLabel] ?? defaultLabel;
}

export function applyLangToSidenav(
  items: SidenavConfig,
  prefix: string,
  lang: string,
  defaultLanguage: string,
  translations: Record<string, Record<string, string>>,
): SidenavConfig {
  return items.map((item) => ({
    ...item,
    // `label` is only ever absent on an unresolved `operation:` item, which
    // the build fills in from the spec's summary before navigation ships.
    label: resolveLabel(item.label ?? '', lang, defaultLanguage, translations),
    path: item.path !== undefined ? `${prefix}${item.path}` : undefined,
    children: item.children
      ? applyLangToSidenav(item.children, prefix, lang, defaultLanguage, translations)
      : undefined,
  }));
}
