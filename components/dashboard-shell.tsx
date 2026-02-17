"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  badge?: number
}

interface DashboardShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  navItems: NavItem[]
  activeItemId: string
  role: "admin" | "club" | "jugador"
}

export function DashboardShell({
  children,
  title,
  subtitle,
  navItems,
  activeItemId,
  role,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("DashboardShell")

  const roleLabel = role === "admin" ? t("roleAdmin") : role === "club" ? t("roleClub") : t("rolePlayer")
  const roleColor = role === "admin" ? "bg-destructive/20 text-destructive" : role === "club" ? "bg-secondary text-secondary-foreground" : "bg-primary/20 text-primary"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold uppercase text-sidebar-foreground">WhinPadel</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 py-3">
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase", roleColor)}>
            {roleLabel}
          </span>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 py-2">
            {navItems.map((item) => (
              <Link key={item.id} href={item.href as any}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activeItemId === item.id && "bg-sidebar-accent text-sidebar-primary font-semibold"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge className="ml-auto h-5 min-w-[20px] justify-center bg-primary p-0 text-[10px] text-primary-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => signOut({ callbackUrl: locale === "en" ? "/en" : "/" })}
          >
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-muted-foreground">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
