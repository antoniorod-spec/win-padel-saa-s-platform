import { Trophy } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold uppercase text-card-foreground">WhinPadel</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              La plataforma profesional para gestion de torneos de padel, rankings y clubes.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Plataforma</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/torneos" className="hover:text-primary transition-colors">Torneos</Link>
              <Link href="/ranking" className="hover:text-primary transition-colors">Ranking</Link>
              <Link href="/clubes" className="hover:text-primary transition-colors">Clubes</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Para Clubes</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/registro?role=club" className="hover:text-primary transition-colors">Registrar Club</Link>
              <Link href="/club" className="hover:text-primary transition-colors">Panel de Club</Link>
              <Link href="#" className="hover:text-primary transition-colors">Precios</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Soporte</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Centro de ayuda</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terminos de uso</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          2026 WhinPadel. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
