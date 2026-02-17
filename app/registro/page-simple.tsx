"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, User, Building2, Loader2, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const t = useTranslations("AuthRegister")
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Player fields (simple)
  const [playerEmail, setPlayerEmail] = useState("")
  const [playerPassword, setPlayerPassword] = useState("")

  // Club fields (simple)
  const [clubEmail, setClubEmail] = useState("")
  const [clubPassword, setClubPassword] = useState("")

  async function handlePlayerRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          email: playerEmail,
          password: playerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t("registerErrorFallback"))
        return
      }

      // Redirigir a onboarding para completar perfil
      router.push("/onboarding")
    } catch {
      setError(t("connectionError"))
    } finally {
      setLoading(false)
    }
  }

  async function handleClubRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "club",
          email: clubEmail,
          password: clubPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t("registerErrorFallback"))
        return
      }

      // Redirigir a onboarding de club (wizard de 5 pasos)
      router.push("/onboarding/club")
    } catch {
      setError(t("connectionError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToHome")}
      </Link>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="player" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="player" className="gap-2">
                <User className="h-4 w-4" />
                {t("playerTab")}
              </TabsTrigger>
              <TabsTrigger value="club" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t("clubTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="mt-6">
              <form className="flex flex-col gap-4" onSubmit={handlePlayerRegister}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="player-email">{t("emailLabel")}</Label>
                  <Input
                    id="player-email"
                    type="email"
                    placeholder={t("playerEmailPlaceholder")}
                    className="bg-background"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="player-pass">{t("passwordLabel")}</Label>
                  <Input
                    id="player-pass"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    className="bg-background"
                    value={playerPassword}
                    onChange={(e) => setPlayerPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("submit")}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("playerNextStep")}
                </p>
              </form>
            </TabsContent>

            <TabsContent value="club" className="mt-6">
              <form className="flex flex-col gap-4" onSubmit={handleClubRegister}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-email">{t("emailLabel")}</Label>
                  <Input
                    id="club-email"
                    type="email"
                    placeholder={t("clubEmailPlaceholder")}
                    className="bg-background"
                    value={clubEmail}
                    onChange={(e) => setClubEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="club-pass">{t("passwordLabel")}</Label>
                  <Input
                    id="club-pass"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    className="bg-background"
                    value={clubPassword}
                    onChange={(e) => setClubPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("submit")}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("clubNextStep")}
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => signIn("google", { callbackUrl: `/${locale}/onboarding` })}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("google")}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t("alreadyHaveAccount")} </span>
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("signInLink")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
