import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('abis_token');
  const isProtected =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/residents') ||
    request.nextUrl.pathname.startsWith('/households') ||
    request.nextUrl.pathname.startsWith('/certificates') ||
    request.nextUrl.pathname.startsWith('/services') ||
    request.nextUrl.pathname.startsWith('/reports') ||
    request.nextUrl.pathname.startsWith('/users') ||
    request.nextUrl.pathname.startsWith('/logs') ||
    request.nextUrl.pathname.startsWith('/me') ||
    request.nextUrl.pathname.startsWith('/home') ||
    request.nextUrl.pathname.startsWith('/my-requests') ||
    request.nextUrl.pathname.startsWith('/corrections') ||
    request.nextUrl.pathname.startsWith('/settings');

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/home/:path*', '/residents/:path*', '/households/:path*', '/certificates/:path*', '/services/:path*', '/reports/:path*', '/users/:path*', '/logs/:path*', '/corrections/:path*', '/me/:path*', '/my-requests/:path*', '/settings/:path*'],
};
