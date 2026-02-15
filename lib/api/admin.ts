import { api } from "./client"

interface AdminStats {
  totalClubs: number
  activePlayers: number
  activeTournaments: number
  pendingClubs: number
  pendingCategoryReviews: number
  totalRegistrations: number
}

interface PendingClub {
  id: string
  name: string
  city: string
  courts: number
  email: string
  requestDate: string
  status: string
}

interface CategoryReview {
  id: string
  player: string
  playerId: string
  modality: string
  fromCategory: string
  toCategory: string
  type: string
  status: string
  reason: string | null
  autoApproved: boolean
  createdAt: string
}

interface RankingStat {
  modality: string
  category: string
  count: number
  avgPoints: number
}

interface SiteBannerSettings {
  id: string
  homeSponsorBannerEnabled: boolean
  homeSponsorBannerImageUrl: string | null
  homeSponsorBannerLinkUrl: string | null
  homeSponsorBannerTitle: string | null
}

export async function fetchAdminStats() {
  return api.get<AdminStats>("/admin/stats")
}

export async function fetchPendingClubs() {
  return api.get<PendingClub[]>("/admin/pending-clubs")
}

export async function approveClub(id: string, action: "approve" | "reject") {
  return api.put(`/admin/clubs/${id}/approve`, { action })
}

export async function fetchCategoryReviews(status?: string) {
  return api.get<CategoryReview[]>("/admin/category-reviews", { status })
}

export async function processCategoryReview(id: string, action: "approve" | "reject") {
  return api.put(`/admin/category-reviews/${id}`, { action })
}

export async function fetchRankingStats() {
  return api.get<RankingStat[]>("/admin/ranking-stats")
}

export async function fetchSiteBannerSettings() {
  return api.get<SiteBannerSettings>("/admin/site-banner")
}

export async function updateSiteBannerSettings(data: {
  homeSponsorBannerEnabled: boolean
  homeSponsorBannerImageUrl?: string
  homeSponsorBannerLinkUrl?: string
  homeSponsorBannerTitle?: string
}) {
  return api.put<SiteBannerSettings>("/admin/site-banner", data)
}
