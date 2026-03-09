import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Redirect Firebase auth action URLs to our custom handler
  if (pathname === '/__/auth/action') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/action';
    // Keep all query parameters (mode, oobCode, etc.)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/__/auth/action',
};
