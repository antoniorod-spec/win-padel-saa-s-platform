import {routing, type Locale} from '@/i18n/routing';

type PathnameKey = keyof typeof routing.pathnames;
type Params = Record<string, string | number>;

function interpolatePathname(template: string, params?: Params) {
  if (!params) return template;
  return template.replaceAll(/\[([^\]]+)\]/g, (_match, key) => {
    const raw = params[key];
    if (raw === undefined || raw === null) {
      throw new Error(`Missing param '${String(key)}' for pathname '${template}'`);
    }
    return encodeURIComponent(String(raw));
  });
}

function getLocalizedTemplate(pathname: PathnameKey, locale: Locale) {
  const entry = routing.pathnames[pathname];
  if (typeof entry === 'string') return entry;
  return entry[locale];
}

export function getLocalizedPathname(opts: {
  pathname: PathnameKey;
  locale: Locale;
  params?: Params;
}) {
  const template = getLocalizedTemplate(opts.pathname, opts.locale);
  return interpolatePathname(template, opts.params);
}

export function getLocalePrefixedPathname(opts: {
  pathname: PathnameKey;
  locale: Locale;
  params?: Params;
}) {
  const localized = getLocalizedPathname(opts);
  // With `localePrefix: 'as-needed'`, default locale has no prefix.
  if (opts.locale === routing.defaultLocale) return localized;
  if (localized === '/') return `/${opts.locale}`;
  return `/${opts.locale}${localized}`;
}

export function buildAlternates(opts: {
  pathname: PathnameKey;
  params?: Params;
  canonicalLocale: Locale;
}): {canonical: string; languages: Record<string, string>} {
  const canonical = getLocalePrefixedPathname({
    pathname: opts.pathname,
    locale: opts.canonicalLocale,
    params: opts.params
  });

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = getLocalePrefixedPathname({
      pathname: opts.pathname,
      locale,
      params: opts.params
    });
  }
  languages['x-default'] = getLocalePrefixedPathname({
    pathname: opts.pathname,
    locale: routing.defaultLocale,
    params: opts.params
  });

  return {canonical, languages};
}

