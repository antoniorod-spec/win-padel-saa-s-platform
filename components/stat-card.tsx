import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: "up" | "down" | "same"
  trendValue?: string
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={cn("border-border/50 bg-card", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">{value}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="mt-2 flex items-center gap-1">
                <span className={cn(
                  "text-xs font-semibold",
                  trend === "up" && "text-primary",
                  trend === "down" && "text-destructive",
                  trend === "same" && "text-muted-foreground"
                )}>
                  {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendValue}
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
