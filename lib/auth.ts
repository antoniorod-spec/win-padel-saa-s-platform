import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/types"

function isPlayerComplete(player: {
  phone: string | null
  birthDate: Date | null
  state: string | null
  documentType: string | null
  documentNumber: string | null
  courtPosition: string | null
  dominantHand: string | null
  starShot: string | null
  playStyle: string | null
  preferredMatchType: string | null
  preferredSchedule: string | null
  preferredAgeRange: string | null
}) {
  // Player onboarding is now minimal: only name/city required for completion.
  // Deeper fields are optional and can be filled later.
  return true
}

function isClubComplete(club: {
  name: string
  rfc: string
  phone: string
  contactName: string
  contactPhone: string
  state: string
  city: string
  address: string
}) {
  return Boolean(
    club.name &&
      club.rfc &&
      club.phone &&
      club.contactName &&
      club.contactPhone &&
      club.state &&
      club.city &&
      club.address
  )
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }

  interface JWT {
    id: string
    role: UserRole
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/registro",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      
      // Si se llama update(), refrescar el rol desde la BD
      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (updatedUser) {
          token.role = updatedUser.role
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
    async signIn() {
      // IMPORTANT: do not return a redirect URL string here.
      // In Auth.js (NextAuth v5), returning a string can short-circuit the flow and
      // prevent the session cookie from being set (resulting in "login does nothing").
      // We handle post-login routing in the app (e.g. `app/login/page.tsx` via `/api/auth/profile-status`).
      return true
    },
    async redirect({ url, baseUrl }) {
      // Si viene de Google OAuth y no tiene perfil, ir a onboarding
      if (url.startsWith(baseUrl)) {
        return url
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      
      // Por defecto, ir a onboarding (se redirigirá automáticamente si ya tiene perfil)
      return `${baseUrl}/onboarding`
    },
  },
})
