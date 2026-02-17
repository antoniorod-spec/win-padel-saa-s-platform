"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { getPathname, useRouter } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function PartnerInvitePage() {
  const { status } = useSession()
  const router = useRouter()
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("PartnerInvite")
  const params = useParams() as { token?: string }
  const token = params?.token ? String(params.token) : ""

  const [error, setError] = useState<string>("")
  const [done, setDone] = useState(false)

  const loginPath = useMemo(() => getPathname({ locale, href: "/login" }), [locale])
  const callbackUrl = typeof window !== "undefined" ? window.location.href : ""

  useEffect(() => {
    if (!token) {
      setError(t("invalid"))
      return
    }
    if (status === "unauthenticated") {
      const url = new URL(loginPath, window.location.origin)
      url.searchParams.set("callbackUrl", callbackUrl)
      window.location.assign(url.toString())
      return
    }
    if (status !== "authenticated") return

    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/players/partner-invites/${encodeURIComponent(token)}/accept`, { method: "POST" })
        const data = await res.json()
        if (!active) return
        if (!res.ok) {
          setError(data?.error ?? t("acceptFailed"))
          return
        }
        setDone(true)
        router.push("/jugador")
      } catch {
        if (active) setError("Error de conexion. Intenta de nuevo.")
      }
    })()

    return () => {
      active = false
    }
  }, [token, status, router, loginPath, callbackUrl])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
            </>
          ) : done ? (
            <p className="text-sm text-muted-foreground">{t("acceptedRedirecting")}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("processing")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

