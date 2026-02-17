import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Target, Heart, Globe } from "lucide-react"
import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { buildAlternates } from "@/lib/seo/alternates"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "es" | "en"
  return {
    alternates: buildAlternates({ pathname: "/nosotros", canonicalLocale: locale }),
  }
}

export default async function NosotrosPage() {
  const t = await getTranslations("AboutPage")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Heart className="h-4 w-4" />
                {t("pill")}
              </div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-secondary-foreground sm:text-5xl">
                {t("title1")}{" "}
                <span className="text-primary">{t("titleHighlight")}</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-secondary-foreground/70">
                {t("intro")}
              </p>
            </div>
          </div>
        </section>

        {/* Mision / Vision / Valores */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: t("mvv1Title"),
                  desc: t("mvv1Desc"),
                },
                {
                  icon: Globe,
                  title: t("mvv2Title"),
                  desc: t("mvv2Desc"),
                },
                {
                  icon: Heart,
                  title: t("mvv3Title"),
                  desc: t("mvv3Desc"),
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase text-card-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por que gratis */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                {t("freeHeading1")} <span className="text-primary">{t("freeHeadingHighlight")}</span>?
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("freeSubheading")}
              </p>
            </div>
            <div className="mt-12 space-y-6">
              {[
                {
                  num: "1",
                  title: t("free1Title"),
                  desc: t("free1Desc"),
                },
                {
                  num: "2",
                  title: t("free2Title"),
                  desc: t("free2Desc"),
                },
                {
                  num: "3",
                  title: t("free3Title"),
                  desc: t("free3Desc"),
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 rounded-lg border border-border bg-card p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
                    {item.num}
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{item.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compromiso */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
                  {t("communityHeading")}
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {t("communityP1")}
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {t("communityP2")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "100%", label: t("statFree") },
                  { value: "5+", label: t("statFormats") },
                  { value: "16", label: t("statCategories") },
                  { value: "24/7", label: t("statAvailability") },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-card p-6 text-center">
                    <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
