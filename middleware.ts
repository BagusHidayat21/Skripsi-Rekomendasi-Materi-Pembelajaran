import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // ⭐ Refresh session to ensure cookies are set properly
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 🔥 Force cookie refresh
  await supabase.auth.refreshSession();

  console.log('Middleware path:', req.nextUrl.pathname);
  console.log('Middleware session exists:', !!session);

  // Redirect root to appropriate page
  if (req.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  }

  // Protect dashboard routes - redirect to auth if not logged in
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = new URL('/auth', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ⭐ Redirect auth page if already logged in (with exception for callback)
  if (req.nextUrl.pathname.startsWith('/auth') && 
      !req.nextUrl.pathname.startsWith('/auth/callback')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect complete-profile - only accessible after auth
  if (req.nextUrl.pathname === '/complete-profile') {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/dashboard/:path*',
    '/complete-profile',
  ],
};