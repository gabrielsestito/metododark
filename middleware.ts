import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = token?.role as string
    const isAdminRole = role && ["ASSISTANT", "ADMIN", "FINANCIAL", "CEO"].includes(role)
    const isStudent = role === "STUDENT"
    const isAppRoute = req.nextUrl.pathname.startsWith("/app")
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    if (isAdminRoute && !isAdminRole) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    if (isAppRoute && !isStudent && !isAdminRole) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAppRoute = req.nextUrl.pathname.startsWith("/app")
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

        if (isAppRoute || isAdminRoute) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"]
}

