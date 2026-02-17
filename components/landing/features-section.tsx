import { Card, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import {
  Trophy,
  BarChart3,
  Calendar,
  Users,
  CreditCard,
  Shield,
} from "lucide-react"

export async function FeaturesSection() {
  const t = await getTranslations("LandingFeatures")
  const features = [
    {
      icon: Calendar,
      title: t("f1Title"),
      description: t("f1Desc"),
    },
    {
      icon: BarChart3,
      title: t("f2Title"),
      description: t("f2Desc"),
    },
    {
      icon: Trophy,
      title: t("f3Title"),
      description: t("f3Desc"),
    },
    {
      icon: Users,
      title: t("f4Title"),
      description: t("f4Desc"),
    },
    {
      icon: CreditCard,
      title: t("f5Title"),
      description: t("f5Desc"),
    },
    {
      icon: Shield,
      title: t("f6Title"),
      description: t("f6Desc"),
    },
  ]

  return (
    <section className="border-t border-border/50 bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold uppercase text-foreground md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("subheading")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
