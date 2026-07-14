import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default async function middleware(req: Request) {
  const { userId } = await getAuth(req as any)

  const publicPaths = ['/', '/sign-in', '/sign-up']
  const url = new URL(req.url)
  const isPublic = publicPaths.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))

  if (!userId && !isPublic) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
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