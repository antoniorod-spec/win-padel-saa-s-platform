import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchAdminStats,
  fetchPendingClubs,
  approveClub,
  fetchCategoryReviews,
  processCategoryReview,
  fetchRankingStats,
  fetchSiteBannerSettings,
  updateSiteBannerSettings,
} from "@/lib/api/admin"

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchAdminStats(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePendingClubs() {
  return useQuery({
    queryKey: ["admin", "pendingClubs"],
    queryFn: () => fetchPendingClubs(),
  })
}

export function useCategoryReviews(status?: string) {
  return useQuery({
    queryKey: ["admin", "categoryReviews", status],
    queryFn: () => fetchCategoryReviews(status),
  })
}

export function useRankingStats() {
  return useQuery({
    queryKey: ["admin", "rankingStats"],
    queryFn: () => fetchRankingStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useApproveClub() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clubId, action }: { clubId: string; action: "approve" | "reject" }) =>
      approveClub(clubId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingClubs"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      queryClient.invalidateQueries({ queryKey: ["clubs"] })
    },
  })
}

export function useReviewCategoryChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ changeId, action }: { changeId: string; action: "approve" | "reject" }) =>
      processCategoryReview(changeId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categoryReviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      queryClient.invalidateQueries({ queryKey: ["rankings"] })
    },
  })
}

export function useSiteBannerSettings() {
  return useQuery({
    queryKey: ["admin", "siteBannerSettings"],
    queryFn: () => fetchSiteBannerSettings(),
  })
}

export function useUpdateSiteBannerSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      homeSponsorBannerEnabled: boolean
      homeSponsorBannerImageUrl?: string
      homeSponsorBannerLinkUrl?: string
      homeSponsorBannerTitle?: string
      clubsDirectoryMapEnabled?: boolean
    }) => updateSiteBannerSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "siteBannerSettings"] })
    },
  })
}
