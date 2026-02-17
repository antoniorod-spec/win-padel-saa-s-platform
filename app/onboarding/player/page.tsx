import { PlayerProfileForm } from "@/components/player/player-profile-form"

export default function PlayerOnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <PlayerProfileForm mode="onboarding" />
    </div>
  )
}
