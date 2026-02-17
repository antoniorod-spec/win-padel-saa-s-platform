import {defineRouting} from 'next-intl/routing';

// Central i18n routing config used by middleware + navigation helpers.
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  // Spanish (default) has no prefix: `/`.
  // English keeps prefix: `/en/...`.
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',

    // Public marketing
    '/nosotros': {
      es: '/nosotros',
      en: '/about'
    },
    '/como-funciona': {
      es: '/como-funciona',
      en: '/how-it-works'
    },
    '/faq': {
      es: '/faq',
      en: '/faq'
    },
    '/contacto': {
      es: '/contacto',
      en: '/contact'
    },
    '/patrocinadores': {
      es: '/patrocinadores',
      en: '/sponsors'
    },
    '/terminos': {
      es: '/terminos',
      en: '/terms'
    },
    '/privacidad': {
      es: '/privacidad',
      en: '/privacy'
    },

    // Public directories
    '/torneos': {
      es: '/torneos',
      en: '/tournaments'
    },
    '/torneos/[id]': {
      es: '/torneos/[id]',
      en: '/tournaments/[id]'
    },
    '/torneos/ciudad/[slug]': {
      es: '/torneos/ciudad/[slug]',
      en: '/tournaments/city/[slug]'
    },
    '/clubes': {
      es: '/clubes',
      en: '/clubs'
    },
    '/clubes/[id]': {
      es: '/clubes/[id]',
      en: '/clubs/[id]'
    },
    '/ranking': {
      es: '/ranking',
      en: '/ranking'
    },

    // Auth + onboarding (keep stable ES, translated EN)
    '/login': {
      es: '/login',
      en: '/sign-in'
    },
    '/registro': {
      es: '/registro',
      en: '/sign-up'
    },
    '/onboarding': {
      es: '/onboarding',
      en: '/onboarding'
    },
    '/onboarding/player': {
      es: '/onboarding/player',
      en: '/onboarding/player'
    },
    '/onboarding/club': {
      es: '/onboarding/club',
      en: '/onboarding/club'
    },

    // Private dashboards (keep mostly stable)
    '/jugador': {
      es: '/jugador',
      en: '/player'
    },
    '/club': {
      es: '/club',
      en: '/club'
    },
    '/admin': {
      es: '/admin',
      en: '/admin'
    }
  }
});

export type Locale = (typeof routing.locales)[number];

