"use client"

import { useState, useMemo } from "react"
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
import {
  rankingsByCategory,
  categoriesByModality,
  pointsTable,
  ascensionRules,
  descentRules,
  type RankingPlayer,
} from "@/lib/mock-data"
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award, Zap, Info, ArrowUpCircle, ArrowDownCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

function TrendIcon({ trend }: { trend: string }) {
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

function TopPlayerCard({ player, rank }: { player: RankingPlayer; rank: number }) {
  return (
    <Card className={cn("border-border/50 bg-card", rank === 1 && "ring-2 ring-primary/40")}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold",
            rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {rank === 1 ? <Trophy className="h-5 w-5" /> : `#${rank}`}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-card-foreground">{player.name}</p>
              {player.ascensionStreak && (
                <Badge className="gap-1 bg-chart-4/10 text-chart-4 text-[10px]">
                  <Zap className="h-3 w-3" /> Racha de ascenso
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{player.club}</p>
          </div>
          <TrendIcon trend={player.trend} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="font-display text-lg font-bold text-primary">{player.points.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Puntos</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{player.played}</p>
            <p className="text-[10px] text-muted-foreground">PJ</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{player.wins}</p>
            <p className="text-[10px] text-muted-foreground">PG</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-card-foreground">{player.winRate}%</p>
            <p className="text-[10px] text-muted-foreground">%V</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const modalityLabels: Record<string, string> = {
  varonil: "Varonil",
  femenil: "Femenil",
  mixto: "Mixto",
}

export default function RankingPage() {
  const [modality, setModality] = useState("varonil")
  const [category, setCategory] = useState("4ta")
  const [showRules, setShowRules] = useState(false)

  const categories = categoriesByModality[modality]
  const players = useMemo(() => {
    return rankingsByCategory[modality]?.[category] ?? []
  }, [modality, category])

  const handleModalityChange = (val: string) => {
    setModality(val)
    const cats = categoriesByModality[val]
    // Pick first category that has data, or the first in the list
    const withData = cats.find((c) => (rankingsByCategory[val]?.[c]?.length ?? 0) > 0)
    setCategory(withData ?? cats[0])
  }

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Header */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <h1 className="font-display text-3xl font-black uppercase text-card-foreground md:text-4xl">
              Ranking por Categoria
            </h1>
            <p className="mt-2 text-muted-foreground">
              Cada categoria tiene su propio ranking independiente. Al ascender, los puntos se resetean a 0.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Modality tabs */}
          <Tabs value={modality} onValueChange={handleModalityChange}>
            <TabsList className="mb-6 h-12">
              <TabsTrigger value="varonil" className="px-6 font-display text-sm font-bold uppercase">Varonil</TabsTrigger>
              <TabsTrigger value="femenil" className="px-6 font-display text-sm font-bold uppercase">Femenil</TabsTrigger>
              <TabsTrigger value="mixto" className="px-6 font-display text-sm font-bold uppercase">Mixto</TabsTrigger>
            </TabsList>

            {/* Shared content for all modalities */}
            {["varonil", "femenil", "mixto"].map((mod) => (
              <TabsContent key={mod} value={mod}>
                {/* Category selector + filters row */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => {
                      const hasData = (rankingsByCategory[modality]?.[cat]?.length ?? 0) > 0
                      return (
                        <Button
                          key={cat}
                          size="sm"
                          variant={category === cat ? "default" : "outline"}
                          className={cn(
                            "min-w-[52px] font-display font-bold",
                            category === cat && "bg-primary text-primary-foreground",
                            !hasData && category !== cat && "opacity-50"
                          )}
                          onClick={() => setCategory(cat)}
                        >
                          {cat}
                          {!hasData && <span className="ml-1 text-[10px] font-normal opacity-60">(0)</span>}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="h-9 w-[160px]">
                        <SelectValue placeholder="Ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ciudades</SelectItem>
                        <SelectItem value="slp">San Luis Potosi</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-muted-foreground"
                      onClick={() => setShowRules(!showRules)}
                    >
                      <Info className="h-4 w-4" /> Reglas
                    </Button>
                  </div>
                </div>

                {/* Ascension/Descent rules panel */}
                {showRules && (
                  <Card className="mb-6 border-border/50 bg-muted/30">
                    <CardContent className="p-5">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase text-card-foreground">
                            <ArrowUpCircle className="h-4 w-4 text-primary" /> Reglas de Ascenso
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
                            <ArrowDownCircle className="h-4 w-4 text-destructive" /> Reglas de Descenso
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

                {/* Title */}
                <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                  Ranking {modalityLabels[modality]} - {category} Categoria
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({players.length} {modality === "mixto" ? "parejas" : "jugadores"})
                  </span>
                </h2>

                {/* Empty state */}
                {players.length === 0 && (
                  <Card className="border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <User className="mb-3 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-lg font-medium text-muted-foreground">Sin datos de ranking</p>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        No hay {modality === "mixto" ? "parejas" : "jugadores"} registrados en {modalityLabels[modality]} {category} todavia.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Top 3 cards */}
                {top3.length > 0 && (
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    {top3.map((player, idx) => (
                      <TopPlayerCard key={player.id} player={player} rank={idx + 1} />
                    ))}
                  </div>
                )}

                {/* Rest of the ranking table */}
                {rest.length > 0 && (
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-14">Pos</TableHead>
                            <TableHead>{modality === "mixto" ? "Pareja" : "Jugador"}</TableHead>
                            <TableHead>Club</TableHead>
                            <TableHead className="text-center">PJ</TableHead>
                            <TableHead className="text-center">PG</TableHead>
                            <TableHead className="text-center">PP</TableHead>
                            <TableHead className="text-center">%V</TableHead>
                            <TableHead className="text-center">Tend.</TableHead>
                            <TableHead className="text-right">Puntos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rest.map((p, idx) => (
                            <TableRow key={p.id}>
                              <TableCell>
                                <RankBadge rank={idx + 4} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium text-foreground">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.city}</p>
                                  </div>
                                  {p.ascensionStreak && (
                                    <Badge className="gap-0.5 bg-chart-4/10 text-chart-4 text-[10px]">
                                      <Zap className="h-2.5 w-2.5" /> Racha
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.club}</TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">{p.played}</TableCell>
                              <TableCell className="text-center text-sm text-primary">{p.wins}</TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">{p.losses}</TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">{p.winRate}%</TableCell>
                              <TableCell className="text-center">
                                <TrendIcon trend={p.trend} />
                              </TableCell>
                              <TableCell className="text-right font-display text-base font-bold text-primary">
                                {p.points.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Points table */}
          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold uppercase text-foreground">Tabla de Puntos por Torneo</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(["categoryA", "categoryB", "categoryC"] as const).map((cat) => (
                <Card key={cat} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-card-foreground">
                      Categoria {cat === "categoryA" ? "A (Major)" : cat === "categoryB" ? "B (Open)" : "C (Express)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ronda</TableHead>
                          <TableHead className="text-right">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointsTable[cat].map((row) => (
                          <TableRow key={row.round}>
                            <TableCell className="text-sm text-foreground">{row.round}</TableCell>
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
