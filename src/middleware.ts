import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exclude static files, images, and api routes from middleware redirection
  // API routes should handle their own 401 responses
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  const session = request.cookies.get('session')?.value
  const payload = session ? await verifyToken(session) : null
  const isAuth = !!payload

  const isLoginPage = pathname === '/login'
  const isSetupPage = pathname === '/setup'

  // If authenticated
  if (isAuth) {
    // Redirect to dashboard if trying to access login or setup
    if (isLoginPage || isSetupPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // If NOT authenticated
  if (!isAuth) {
    // Allow access to login and setup pages
    if (isLoginPage || isSetupPage) {
      return NextResponse.next()
    }
    // Redirect all other protected routes to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
