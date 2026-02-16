"use client"

import { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Trophy,
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  BarChart3,
  Calendar,
  MapPin,
  Building2,
  LogOut,
  Shield,
  Zap,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTournamentFiltersOptions } from "@/hooks/use-tournaments"

const navLinks = [
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/clubes", label: "Clubes", icon: Building2 },
  { href: "/como-funciona", label: "Como Funciona", icon: Zap },
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const { data: session, status } = useSession()
  const { data: tournamentFiltersData } = useTournamentFiltersOptions()

  const isLoggedIn = status === "authenticated"
  const userRole = session?.user?.role

  const filterPayload = tournamentFiltersData?.data
  const citySlugLabels = filterPayload?.citySlugLabels ?? {}

  const cityLinks = Object.entries(citySlugLabels)
    .map(([slug, label]) => ({ slug, label: label || slug }))
    .filter((c) => !!c.slug)
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
    .slice(0, 16)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold uppercase tracking-tight text-foreground">
            WhinPadel
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Calendar className="h-4 w-4" />
                Torneos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem asChild>
                <Link href="/torneos" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Ver todos los torneos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Por Ciudad
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Torneos de Pádel</DropdownMenuLabel>
                  {cityLinks.length === 0 ? (
                    <DropdownMenuItem disabled>No hay ciudades disponibles</DropdownMenuItem>
                  ) : (
                    cityLinks.map((c) => (
                      <DropdownMenuItem key={c.slug} asChild>
                        <Link href={`/torneos/ciudad/${c.slug}`}>{c.label}</Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {isLoggedIn && (
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
                3
              </Badge>
              <span className="sr-only">Notificaciones</span>
            </Button>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {userRole === "PLAYER" && (
                  <DropdownMenuItem asChild>
                    <Link href="/jugador">Mi Perfil</Link>
                  </DropdownMenuItem>
                )}
                {userRole === "CLUB" && (
                  <DropdownMenuItem asChild>
                    <Link href="/club">Panel Club</Link>
                  </DropdownMenuItem>
                )}
                {userRole === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden gap-2 md:flex">
              <Link href="/login">
                <Button variant="outline" size="sm">Iniciar Sesion</Button>
              </Link>
              <Link href="/registro">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
              <div className="mt-8 flex flex-col gap-4">
                <Link href="/torneos" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Calendar className="h-4 w-4" />
                    Torneos
                  </Button>
                </Link>
                <div className="grid grid-cols-1 gap-2">
                  <Link href={cityLinks[0] ? `/torneos/ciudad/${cityLinks[0].slug}` : "/torneos"} onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full text-xs">Torneos por Ciudad</Button>
                  </Link>
                </div>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {isLoggedIn ? (
                  <>
                    {userRole === "PLAYER" && (
                      <Link href="/jugador" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <User className="h-4 w-4" />
                          Mi Perfil
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-destructive"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">Iniciar Sesion</Button>
                    </Link>
                    <Link href="/registro" onClick={() => setOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground">Registrarse</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
