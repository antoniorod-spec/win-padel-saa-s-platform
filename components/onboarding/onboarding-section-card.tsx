"use client"

import { cn } from "@/lib/utils"

interface OnboardingSectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function OnboardingSectionCard({
  title,
  description,
  children,
  className,
}: OnboardingSectionCardProps) {
  return (
    <section className={cn("rounded-lg border border-border/60 bg-background p-4 md:p-5", className)}>
      <header className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}
