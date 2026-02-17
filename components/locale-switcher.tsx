"use client"

import { useMemo, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { getPathname, usePathname } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

type Locale = "es" | "en"

function useQueryObject() {
  const searchParams = useSearchParams()
  return useMemo(() => {
    const entries = Array.from(searchParams.entries())
    if (entries.length === 0) return undefined
    return Object.fromEntries(entries)
  }, [searchParams])
}

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher")
  const locale = useLocale() as Locale
  const pathnameRaw = usePathname() as string
  // Defensive: if a locale-prefixed pathname leaks in (e.g. /es),
  // strip it so getPathname doesn't create /es/es.
  const pathname = useMemo(() => {
    if (pathnameRaw === "/es" || pathnameRaw.startsWith("/es/")) return (pathnameRaw.replace(/^\/es(?=\/|$)/, "") || "/") as any
    if (pathnameRaw === "/en" || pathnameRaw.startsWith("/en/")) return (pathnameRaw.replace(/^\/en(?=\/|$)/, "") || "/") as any
    return pathnameRaw
  }, [pathnameRaw])
  const query = useQueryObject()
  const paramsRaw = useParams()
  const routeParams = useMemo(() => {
    if (!paramsRaw) return undefined
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(paramsRaw)) {
      // `locale` is part of `app/[locale]/*` and shouldn't be forwarded to next-intl pathnames.
      if (key === "locale") continue
      if (Array.isArray(value)) {
        if (value[0]) out[key] = String(value[0])
      } else if (value !== undefined) {
        out[key] = String(value)
      }
    }
    return Object.keys(out).length > 0 ? out : undefined
  }, [paramsRaw])
  const [, startTransition] = useTransition()

  function localeButton(target: Locale) {
    const active = locale === target
    const href = getPathname({
      locale: target,
      // `usePathname()` is typed as a union of known routes, but at runtime it's
      // just the current route. Using `getPathname` keeps slugs translated.
      href: { pathname, params: routeParams, query } as any,
    })

    function normalizeTargetUrl(raw: string) {
      // Avoid accidental double-prefixes.
      let out = raw.replace(/^\/en\/en(?=\/|$)/, "/en").replace(/^\/es\/es(?=\/|$)/, "/es")
      // With localePrefix: 'as-needed', Spanish should not be prefixed.
      if (out === "/es" || out.startsWith("/es/")) {
        out = out.replace(/^\/es(?=\/|$)/, "") || "/"
      }
      return out
    }

    const targetUrl = normalizeTargetUrl(href)
    return (
      <Button
        type="button"
        variant={active ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2 text-xs"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          // Force a real navigation so Server Components re-render in the new locale.
          startTransition(() => {
            window.location.assign(targetUrl)
          })
        }}
      >
        {target === "es" ? t("es") : t("en")}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1" aria-label={t("label")}>
      {localeButton("es")}
      <span className="select-none text-xs text-muted-foreground">/</span>
      {localeButton("en")}
    </div>
  )
}

