import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  // Clerk session is in a cookie - check if it exists
  const sessionToken = req.cookies.get('__client_session')

  const publicPaths = ['/', '/sign-in', '/sign-up']
  const isPublic = publicPaths.some(p => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + '/'))

  if (!sessionToken && !isPublic) {
    const signInUrl = req.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}