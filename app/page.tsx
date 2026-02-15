import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TournamentsPreview } from "@/components/landing/tournaments-preview"
import { RankingPreview } from "@/components/landing/ranking-preview"
import { SponsorBannerSection } from "@/components/landing/sponsor-banner"
import { Footer } from "@/components/landing/footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SponsorBannerSection />
        <TournamentsPreview />
        <RankingPreview />
      </main>
      <Footer />
    </div>
  )
}
