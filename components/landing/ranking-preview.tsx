"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { varonil4ta } from "@/lib/mock-data"
import { ArrowRight, TrendingUp, TrendingDown, Minus, Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function RankingPreview() {
  const top5 = varonil4ta.slice(0, 5)

  return (
    <section className="border-t border-border/50 bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase text-foreground md:text-4xl">
              Ranking por Categoria
            </h2>
            <p className="mt-2 text-muted-foreground">
              Varonil 4ta Categoria - San Luis Potosi
              <span className="ml-2 text-xs text-muted-foreground/70">(Cada categoria tiene ranking independiente)</span>
            </p>
          </div>
          <Link href="/ranking" className="hidden md:block">
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80">
              Todos los rankings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Top 3 highlight cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {top5.slice(0, 3).map((player, idx) => (
            <Card key={player.id} className={cn(
              "border-border/50 bg-card",
              idx === 0 && "ring-2 ring-primary/40"
            )}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold",
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {idx === 0 ? <Crown className="h-5 w-5" /> : idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-card-foreground">{player.name}</p>
                        {player.ascensionStreak && (
                          <Zap className="h-3.5 w-3.5 text-chart-4" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{player.club}</p>
                    </div>
                  </div>
                  {player.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-primary" />
                  ) : player.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{player.wins}W - {player.losses}L</span>
                    <span>{player.winRate}%</span>
                  </div>
                  <Badge className="bg-primary/10 font-display text-lg font-bold text-primary">
                    {player.points.toLocaleString()} pts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rest of top 5 */}
        <div className="space-y-2">
          {top5.slice(3).map((player, idx) => (
            <div key={player.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-display text-sm font-bold text-muted-foreground">
                  {idx + 4}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-card-foreground">{player.name}</p>
                    {player.ascensionStreak && (
                      <Zap className="h-3 w-3 text-chart-4" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{player.club} - {player.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{player.played}PJ {player.winRate}%V</span>
                <span className="font-display font-bold text-primary">{player.points.toLocaleString()} pts</span>
                {player.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                ) : player.trend === "down" ? (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/ranking">
            <Button variant="outline" className="gap-2">
              Ver todos los rankings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
