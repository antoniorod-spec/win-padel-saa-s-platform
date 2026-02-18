"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award, Zap, Info, ArrowUpCircle, ArrowDownCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRankings } from "@/hooks/use-rankings"
import { ASCENSION_RULES, DESCENT_RULES, POINTS_TABLE } from "@/lib/types"
import { TOURNAMENT_CLASS_LABELS } from "@/lib/tournament/categories"

function TrendIcon({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-primary" />
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Trophy className="h-4 w-4" />
      </div>
    )
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Medal className="h-4 w-4" />
      </div>
    )
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-4/20 text-chart-4">
        <Award className="h-4 w-4" />
      </div>
    )
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  )
}

function TopPlayerCard({ player, rank }: { player: any; rank: number }) {
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("RankingPage")
  const labels = useMemo(
    () => ({
      ascensionStreak: t("labels.ascensionStreak"),
      points: t("labels.points"),
      played: locale === "en" ? "GP" : "PJ",
      wins: locale === "en" ? "W" : "PG",
      winRate: locale === "en" ? "WR" : "%V",
    }),
    [t, locale]
  )

  const winRate = player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0

  return (
    <Card className={cn("border-border/50 bg-card", rank === 1 && "ring-2 ring-primary/40")}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold",
              rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {rank === 1 ? <Trophy className="h-5 w-5" /> : `#${rank}`}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-card-foreground">{player.playerName}</p>
              {player.ascensionStreak && (
                <Badge className="gap-1 bg-chart-4/10 text-chart-4 text-[10px]">
                  <Zap className="h-3 w-3" /> {labels.ascensionStreak}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{player.city}</p>
          </div>
          <TrendIcon trend={player.trend} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="font-display text-lg font-bold text-primary">{player.points.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{labels.points}</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{player.played}</p>
            <p className="text-[10px] text-muted-foreground">{labels.played}</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{player.wins}</p>
            <p className="text-[10px] text-muted-foreground">{labels.wins}</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{winRate}%</p>
            <p className="text-[10px] text-muted-foreground">{labels.winRate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const modalityLabels: Record<string, string> = {
  VARONIL: "Varonil",
  FEMENIL: "Femenil",
  MIXTO: "Mixto",
}

const categoriesByModality: Record<string, string[]> = {
  VARONIL: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "Senior", "10U", "12U", "14U", "16U", "18U"],
  FEMENIL: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "Senior", "10U", "12U", "14U", "16U", "18U"],
  MIXTO: ["A", "B", "C", "D"],
}

export default function RankingClient() {
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("RankingPage")
  const localeTag = locale === "en" ? "en-US" : "es-MX"

  const ascensionRules = locale === "en"
    ? [
        { rule: t("rules.ascension.r1.rule"), result: t("rules.ascension.r1.result") },
        { rule: t("rules.ascension.r2.rule"), result: t("rules.ascension.r2.result") },
        { rule: t("rules.ascension.r3.rule"), result: t("rules.ascension.r3.result") },
        { rule: t("rules.ascension.r4.rule"), result: t("rules.ascension.r4.result") },
      ]
    : ASCENSION_RULES

  const descentRules = locale === "en"
    ? [
        { rule: t("rules.descent.r1.rule"), result: t("rules.descent.r1.result") },
        { rule: t("rules.descent.r2.rule"), result: t("rules.descent.r2.result") },
      ]
    : DESCENT_RULES

  function translateRoundLabel(round: string) {
    if (locale !== "en") return round
    switch (round) {
      case "Campeon":
        return t("pointsRounds.champion")
      case "Subcampeon":
        return t("pointsRounds.runnerUp")
      case "Semifinalista":
        return t("pointsRounds.semifinalist")
      case "Cuartofinalista":
        return t("pointsRounds.quarterfinalist")
      case "Octavos":
        return t("pointsRounds.roundOf16")
      case "Fase de grupos":
        return t("pointsRounds.groupStage")
      default:
        return round
    }
  }

  const [modality, setModality] = useState<string>("VARONIL")
  const [category, setCategory] = useState<string>("4ta")
  const [city, setCity] = useState<string | undefined>(undefined)
  const [showRules, setShowRules] = useState(false)

  const { data: rankingsData, isLoading } = useRankings(modality, category, city)

  const categories = categoriesByModality[modality]
  const players = rankingsData?.data || []

  const handleModalityChange = (val: string) => {
    setModality(val)
    const cats = categoriesByModality[val]
    setCategory(cats?.[0] ?? "4ta")
  }

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">{t("headerTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("headerDesc")}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs value={modality} onValueChange={handleModalityChange}>
            <TabsList className="mb-6 h-12">
              <TabsTrigger value="VARONIL" className="px-6 font-display text-sm font-bold uppercase">
                {t("tabs.men")}
              </TabsTrigger>
              <TabsTrigger value="FEMENIL" className="px-6 font-display text-sm font-bold uppercase">
                {t("tabs.women")}
              </TabsTrigger>
              <TabsTrigger value="MIXTO" className="px-6 font-display text-sm font-bold uppercase">
                {t("tabs.mixed")}
              </TabsTrigger>
            </TabsList>

            {["VARONIL", "FEMENIL", "MIXTO"].map((mod) => (
              <TabsContent key={mod} value={mod}>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={category === cat ? "default" : "outline"}
                        className={cn("min-w-[52px] font-display font-bold", category === cat && "bg-primary text-primary-foreground")}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Select value={city || "all"} onValueChange={(val) => setCity(val === "all" ? undefined : val)}>
                      <SelectTrigger className="h-9 w-[160px]">
                        <SelectValue placeholder={t("cityPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allCities")}</SelectItem>
                        <SelectItem value="San Luis Potosi">San Luis Potosi</SelectItem>
                        <SelectItem value="Ciudad de Mexico">Ciudad de Mexico</SelectItem>
                        <SelectItem value="Guadalajara">Guadalajara</SelectItem>
                        <SelectItem value="Monterrey">Monterrey</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => setShowRules(!showRules)}>
                      <Info className="h-4 w-4" /> {t("rulesButton")}
                    </Button>
                  </div>
                </div>

                {showRules && (
                  <Card className="mb-6 border-border/50 bg-muted/30">
                    <CardContent className="p-5">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase text-card-foreground">
                            <ArrowUpCircle className="h-4 w-4 text-primary" /> {t("rules.ascensionTitle")}
                          </h3>
                          <ul className="mt-3 space-y-2">
                            {ascensionRules.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <div>
                                  <span className="font-medium text-card-foreground">{r.rule}</span>
                                  <span className="ml-1 text-muted-foreground">- {r.result}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase text-card-foreground">
                            <ArrowDownCircle className="h-4 w-4 text-destructive" /> {t("rules.descentTitle")}
                          </h3>
                          <ul className="mt-3 space-y-2">
                            {descentRules.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                                <div>
                                  <span className="font-medium text-card-foreground">{r.rule}</span>
                                  <span className="ml-1 text-muted-foreground">- {r.result}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                  {t("rankingTitle", { modality: modalityLabels[modality], category })}
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {t("rankingCount", { count: players.length, kind: modality === "MIXTO" ? t("pairs") : t("players") })}
                  </span>
                </h2>

                {isLoading && (
                  <Card className="border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <p className="text-lg font-medium text-muted-foreground">{t("loading")}</p>
                    </CardContent>
                  </Card>
                )}

                {!isLoading && players.length === 0 && (
                  <Card className="border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <User className="mb-3 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-lg font-medium text-muted-foreground">{t("emptyTitle")}</p>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        {t("emptyDesc", {
                          kind: modality === "MIXTO" ? t("pairs") : t("players"),
                          modality: modalityLabels[modality],
                          category,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {!isLoading && top3.length > 0 && (
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    {top3.map((player, idx) => (
                      <TopPlayerCard key={player.id} player={player} rank={idx + 1} />
                    ))}
                  </div>
                )}

                {!isLoading && rest.length > 0 && (
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-14">{t("table.pos")}</TableHead>
                            <TableHead>{modality === "MIXTO" ? t("table.pair") : t("table.player")}</TableHead>
                            <TableHead>{t("table.city")}</TableHead>
                            <TableHead className="text-center">{locale === "en" ? "GP" : "PJ"}</TableHead>
                            <TableHead className="text-center">{locale === "en" ? "W" : "PG"}</TableHead>
                            <TableHead className="text-center">{locale === "en" ? "L" : "PP"}</TableHead>
                            <TableHead className="text-center">{locale === "en" ? "WR" : "%V"}</TableHead>
                            <TableHead className="text-center">{t("table.trend")}</TableHead>
                            <TableHead className="text-right">{t("table.points")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rest.map((p, idx) => {
                            const winRate = p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0
                            return (
                              <TableRow key={p.id}>
                                <TableCell>
                                  <RankBadge rank={idx + 4} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="font-medium text-foreground">{p.playerName}</p>
                                    </div>
                                    {p.ascensionStreak && (
                                      <Badge className="gap-0.5 bg-chart-4/10 text-chart-4 text-[10px]">
                                        <Zap className="h-2.5 w-2.5" /> {t("streak")}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{p.city}</TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">{p.played}</TableCell>
                                <TableCell className="text-center text-sm text-primary">{p.wins}</TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">{p.losses}</TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">{winRate}%</TableCell>
                                <TableCell className="text-center">
                                  <TrendIcon trend={p.trend} />
                                </TableCell>
                                <TableCell className="text-right font-display text-base font-bold text-primary">
                                  {p.points.toLocaleString(localeTag)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold uppercase text-foreground">{t("pointsTableTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(["ANUAL", "OPEN", "REGULAR", "EXPRESS"] as const).map((cat) => (
                <Card key={cat} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-card-foreground">
                      {t("pointsTableCategory", {
                        cat,
                        label: TOURNAMENT_CLASS_LABELS[cat],
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("pointsTableRound")}</TableHead>
                          <TableHead className="text-right">{t("pointsTablePts")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {POINTS_TABLE[cat].map((row) => (
                          <TableRow key={row.round}>
                            <TableCell className="text-sm text-foreground">{translateRoundLabel(row.round)}</TableCell>
                            <TableCell className="text-right font-display font-bold text-primary">{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

