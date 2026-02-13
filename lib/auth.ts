import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  logger: {
    error(code, ...message) {
      if (code === "JWT_SESSION_ERROR") {
        return
      }
      console.error("[next-auth][error]", code, ...message)
    },
    warn(code, ...message) {
      console.warn("[next-auth][warn]", code, ...message)
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[next-auth][debug]", code, ...message)
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Quando o usuário faz login
        token.role = user.role
        token.id = user.id
      } else if (token.id) {
        // Sempre atualizar role do banco de dados para garantir que está atualizado
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true }
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Garantir que o role está atualizado na sessão
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true }
          })
          if (dbUser) {
            session.user.role = dbUser.role
          } else {
            session.user.role = token.role as string
          }
        } catch (error) {
          session.user.role = token.role as string
        }
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
