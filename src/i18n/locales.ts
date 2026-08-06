export const locales = ['en', 'uk', 'ru', 'es', 'pt-BR', 'de', 'tr', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];

export const localeConfig: Record<Locale, { nativeName: string; prefix: string; htmlLang: string; ogLocale: string; selectLabel: string }> = {
  en: { nativeName: 'English', prefix: '', htmlLang: 'en', ogLocale: 'en_US', selectLabel: 'Select language' },
  uk: { nativeName: 'Українська', prefix: 'uk', htmlLang: 'uk', ogLocale: 'uk_UA', selectLabel: 'Вибрати мову' },
  ru: { nativeName: 'Русский', prefix: 'ru', htmlLang: 'ru', ogLocale: 'ru_RU', selectLabel: 'Выбрать язык' },
  es: { nativeName: 'Español', prefix: 'es', htmlLang: 'es', ogLocale: 'es_ES', selectLabel: 'Seleccionar idioma' },
  'pt-BR': { nativeName: 'Português (Brasil)', prefix: 'pt-br', htmlLang: 'pt-BR', ogLocale: 'pt_BR', selectLabel: 'Selecionar idioma' },
  de: { nativeName: 'Deutsch', prefix: 'de', htmlLang: 'de', ogLocale: 'de_DE', selectLabel: 'Sprache auswählen' },
  tr: { nativeName: 'Türkçe', prefix: 'tr', htmlLang: 'tr', ogLocale: 'tr_TR', selectLabel: 'Dil seçin' },
  'zh-CN': { nativeName: '简体中文', prefix: 'zh-cn', htmlLang: 'zh-CN', ogLocale: 'zh_CN', selectLabel: '选择语言' },
};

export const localizedLocales = locales.filter((locale) => locale !== 'en');
export const publicPages = ['', 'documentation', 'closed-beta', 'privacy', 'terms', 'risk-disclaimer'] as const;
export type PublicPage = (typeof publicPages)[number];

export function localeFromPrefix(prefix?: string): Locale {
  return locales.find((locale) => localeConfig[locale].prefix === prefix?.toLowerCase()) ?? 'en';
}

export function pageFromPath(pathname: string): PublicPage {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] && localizedLocales.some((locale) => localeConfig[locale].prefix === parts[0].toLowerCase())) parts.shift();
  const page = parts[0] ?? '';
  return publicPages.includes(page as PublicPage) ? (page as PublicPage) : '';
}

export function localizedPath(locale: Locale, page: PublicPage): string {
  const prefix = localeConfig[locale].prefix;
  return `/${prefix ? `${prefix}/` : ''}${page ? `${page}/` : ''}`;
}
