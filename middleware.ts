import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { response, user } = await updateSession(req)

  console.log('Middleware path:', req.nextUrl.pathname)
  console.log('Middleware user exists:', !!user)

  // Redirect root to appropriate page
  if (req.nextUrl.pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  // Redirect auth page if already logged in (except callback)
  if (req.nextUrl.pathname.startsWith('/auth') && 
      !req.nextUrl.pathname.startsWith('/auth/callback')) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect complete-profile
  if (req.nextUrl.pathname === '/complete-profile') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/auth((?!/logout|/callback).*)',
    '/dashboard/:path*',
    '/complete-profile',
  ],
}