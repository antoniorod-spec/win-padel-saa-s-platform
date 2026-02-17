import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Re-export next/navigation equivalents that are locale-aware and support
// localized pathnames (e.g. /es/torneos <-> /en/tournaments).
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

