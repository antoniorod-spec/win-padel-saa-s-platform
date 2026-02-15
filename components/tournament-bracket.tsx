"use client"

import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"

interface Team {
  name: string
  seed: number | null
  score: number[]
}

interface Match {
  id: number | string
  teamA: Team
  teamB: Team
  winner: "A" | "B" | null
}

interface Round {
  name: string
  matches: Match[]
}

interface BracketProps {
  rounds: Round[]
  tournamentName: string
}

function MatchCard({ match, isFinal }: { match: Match; isFinal: boolean }) {
  return (
    <div className={cn(
      "w-56 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
      isFinal && "ring-2 ring-primary/50"
    )}>
      <div className={cn(
        "flex items-center justify-between border-b border-border px-3 py-2",
        match.winner === "A" ? "bg-primary/10" : "bg-card"
      )}>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
            {match.teamA.seed}
          </span>
          <span className={cn(
            "text-xs font-medium",
            match.winner === "A" ? "text-primary" : "text-card-foreground"
          )}>
            {match.teamA.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {match.teamA.score.map((s, i) => (
            <span key={i} className={cn(
              "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
              match.winner === "A" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </span>
          ))}
          {match.winner === "A" && isFinal && (
            <Trophy className="ml-1 h-3 w-3 text-primary" />
          )}
        </div>
      </div>
      <div className={cn(
        "flex items-center justify-between px-3 py-2",
        match.winner === "B" ? "bg-primary/10" : "bg-card"
      )}>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
            {match.teamB.seed}
          </span>
          <span className={cn(
            "text-xs font-medium",
            match.winner === "B" ? "text-primary" : "text-card-foreground"
          )}>
            {match.teamB.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {match.teamB.score.map((s, i) => (
            <span key={i} className={cn(
              "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
              match.winner === "B" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </span>
          ))}
          {match.winner === "B" && isFinal && (
            <Trophy className="ml-1 h-3 w-3 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}

export function TournamentBracket({ rounds, tournamentName }: BracketProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold uppercase text-foreground">{tournamentName}</h3>
      </div>
      <div className="flex items-center gap-8 pb-4" style={{ minWidth: `${rounds.length * 280}px` }}>
        {rounds.map((round, roundIdx) => (
          <div key={round.name} className="flex flex-col gap-2">
            <div className="mb-2 text-center">
              <span className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase",
                roundIdx === rounds.length - 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {round.name}
              </span>
            </div>
            <div
              className="flex flex-col justify-around gap-4"
              style={{ minHeight: `${rounds[0].matches.length * 100}px` }}
            >
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isFinal={roundIdx === rounds.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
