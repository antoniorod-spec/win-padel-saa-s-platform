"use client"

import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ClubOnboardingShellProps {
  title: string
  subtitle: string
  currentStep: number
  totalSteps: number
  steps: Array<{ id: number; label: string }>
  sectionTitle: string
  sectionDescription: string
  helperTitle: string
  helperDescription?: string
  helperItems?: string[]
  statusMessage?: string
  error?: string
  canGoBack: boolean
  nextLabel: string
  isSubmitting?: boolean
  onBack: () => void
  onNext: () => void
  children: React.ReactNode
}

export function ClubOnboardingShell({
  title,
  subtitle,
  currentStep,
  totalSteps,
  steps,
  sectionTitle,
  sectionDescription,
  helperTitle,
  helperDescription,
  helperItems = [],
  statusMessage,
  error,
  canGoBack,
  nextLabel,
  isSubmitting = false,
  onBack,
  onNext,
  children,
}: ClubOnboardingShellProps) {
  const progress = Math.round((currentStep / totalSteps) * 100)

  const actions = (
    <>
      <Button type="button" variant="outline" onClick={onBack} disabled={!canGoBack || isSubmitting}>
        Atras
      </Button>
      <Button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {nextLabel}
      </Button>
    </>
  )

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground md:text-base">{subtitle}</p>
        </header>

        <section className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Paso {currentStep} de {totalSteps}
            </span>
            <span>{progress}% completado</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted">
            <div
              className="absolute left-0 top-0 h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {steps.map((step) => {
              const isDone = step.id < currentStep
              const isCurrent = step.id === currentStep
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-2 text-xs",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    isDone && "border-primary/30 bg-primary/5 text-foreground",
                    !isCurrent && !isDone && "border-border/50 bg-background text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      isCurrent && "bg-primary text-primary-foreground",
                      isDone && "bg-primary/20 text-primary",
                      !isCurrent && !isDone && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : step.id}
                  </span>
                  <span className="truncate">{step.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="space-y-4 lg:col-span-8">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">{sectionTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{sectionDescription}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6">{children}</div>
            {error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between lg:hidden">{actions}</div>
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="text-base font-semibold text-foreground">{helperTitle}</h3>
              {helperDescription ? <p className="mt-2 text-sm text-muted-foreground">{helperDescription}</p> : null}
              {helperItems.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {helperItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Estado del borrador</p>
              <p className="mt-1 text-sm text-foreground">{statusMessage ?? "Sin cambios recientes"}</p>
            </div>
          </aside>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 hidden border-t border-border/60 bg-background/95 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-end gap-3 px-4 md:px-8">
          {actions}
        </div>
      </footer>
    </div>
  )
}
