import { Trophy } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold uppercase text-card-foreground">WhinPadel</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              La plataforma profesional para gestion de torneos de padel, rankings y clubes.
              100% gratuita para toda la comunidad.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://wa.me/524442045111"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="WhatsApp"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.52 3.48A11.89 11.89 0 0012.06 0C5.55 0 .24 5.3.24 11.82c0 2.08.54 4.11 1.56 5.9L0 24l6.45-1.69a11.76 11.76 0 005.61 1.42h.01c6.51 0 11.82-5.3 11.82-11.82 0-3.16-1.23-6.13-3.37-8.43zM12.07 21.7h-.01a9.8 9.8 0 01-4.99-1.37l-.36-.21-3.83 1 .99-3.74-.24-.38a9.78 9.78 0 01-1.5-5.18c0-5.4 4.39-9.8 9.8-9.8 2.62 0 5.08 1.02 6.93 2.87a9.72 9.72 0 012.86 6.93c0 5.4-4.39 9.8-9.79 9.8zm5.37-7.35c-.29-.15-1.71-.84-1.97-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.34.22-.63.07-.29-.15-1.24-.46-2.35-1.48-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.5.14-.17.19-.29.29-.49.1-.19.05-.37-.02-.52-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.54c-.19 0-.5.07-.76.37-.26.29-1 1-.99 2.43 0 1.43 1.03 2.82 1.18 3.01.14.19 2.02 3.08 4.9 4.32.68.29 1.22.46 1.63.59.69.22 1.32.19 1.82.12.56-.08 1.71-.7 1.95-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34z" />
                </svg>
              </a>
              <a
                href="https://wa.me/524442045111"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                WhatsApp: +52 444 204 5111
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Plataforma</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/torneos" className="transition-colors hover:text-primary">Torneos</Link>
              <Link href="/ranking" className="transition-colors hover:text-primary">Ranking</Link>
              <Link href="/clubes" className="transition-colors hover:text-primary">Clubes</Link>
              <Link href="/como-funciona" className="transition-colors hover:text-primary">Como Funciona</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Empresa</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/nosotros" className="transition-colors hover:text-primary">Nosotros</Link>
              <Link href="/patrocinadores" className="transition-colors hover:text-primary">Patrocinadores</Link>
              <Link href="/contacto" className="transition-colors hover:text-primary">Contacto</Link>
              <Link href="/faq" className="transition-colors hover:text-primary">Preguntas Frecuentes</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-card-foreground">Para Clubes</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/registro?role=club" className="transition-colors hover:text-primary">Registrar Club</Link>
              <Link href="/club" className="transition-colors hover:text-primary">Panel de Club</Link>
              <Link href="/como-funciona" className="transition-colors hover:text-primary">Guia de Inicio</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 WhinPadel. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/terminos" className="transition-colors hover:text-primary">Terminos de Uso</Link>
            <Link href="/privacidad" className="transition-colors hover:text-primary">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
