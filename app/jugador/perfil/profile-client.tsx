"use client"

import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Trophy,
  Search,
  BarChart3,
  Calendar,
  Newspaper,
  User,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { PlayerProfileForm } from "@/components/player/player-profile-form"

export default function PlayerProfileClient() {
  const t = useTranslations("PlayerDashboard")
  const { data: session } = useSession()

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, href: "/jugador" },
    { id: "profile", label: t("nav.profile"), icon: User, href: "/jugador/perfil" },
    { id: "myTournaments", label: t("nav.myTournaments"), icon: Trophy, href: "/jugador" },
    { id: "exploreTournaments", label: t("nav.exploreTournaments"), icon: Search, href: "/torneos" },
    { id: "myRanking", label: t("nav.myRanking"), icon: BarChart3, href: "/jugador" },
    { id: "calendar", label: t("nav.calendar"), icon: Calendar, href: "/jugador" },
    { id: "explorePlayers", label: t("nav.explorePlayers"), icon: User, href: "/ranking" },
    { id: "news", label: t("nav.news"), icon: Newspaper, href: "/jugador" },
  ]

  return (
    <DashboardShell
      title={t("title")}
      subtitle={session?.user?.name ?? undefined}
      navItems={navItems}
      activeItemId="profile"
      role="jugador"
    >
      <div className="mx-auto max-w-4xl">
        <PlayerProfileForm mode="profile" />
      </div>
    </DashboardShell>
  )
}

