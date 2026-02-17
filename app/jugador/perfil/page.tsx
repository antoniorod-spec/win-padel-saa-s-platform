import type { Metadata } from "next"
import PlayerProfileClient from "./profile-client"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Page() {
  return <PlayerProfileClient />
}

