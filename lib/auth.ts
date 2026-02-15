import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/types"

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
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
    async redirect({ url, baseUrl }) {
      // Redirigir según el rol del usuario
      // Si la URL ya incluye un destino, úsala
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      
      // Por defecto, ir al home
      return baseUrl
    },
  },
})
