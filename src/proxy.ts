import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const role = (token?.role as string) || 'client'
    const pathname = req.nextUrl.pathname
    
    const isAuthRoute = pathname.startsWith('/login')
    const isAdminRoute = pathname.startsWith('/admin')
    const isAdminApiRoute = pathname.startsWith('/api/admin')
    const isDashboardRoute = pathname === '/'

    // Handle authenticated users
    if (token) {
      // Prevent logged-in users from seeing the login page
      if (isAuthRoute) {
        return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/', req.url))
      }
      
      // Admin dashboard routing
      if (role === 'admin' && isDashboardRoute) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      
      // Client access to admin routes
      if (role === 'client' && (isAdminRoute || isAdminApiRoute)) {
        if (isAdminApiRoute) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Routes that never require authentication
        if (
          pathname.startsWith('/login') || 
          pathname.startsWith('/api/auth') ||
          pathname.includes('.') // static files
        ) {
          return true
        }
        
        // Everything else requires a token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
