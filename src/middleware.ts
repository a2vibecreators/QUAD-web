import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * QUAD Framework Middleware
 *
 * Enforces setup completion before allowing access to protected routes.
 * Users cannot access dashboard/domains/cycles etc until they:
 * 1. Select AI Tier
 * 2. Connect Meeting Provider
 */

// Routes that require setup completion
const PROTECTED_ROUTES = [
  '/dashboard',
  '/domains',
  '/cycles',
  '/flows',
  '/tickets',
  '/circles',
  '/reporting',
  '/mastery',
];

// Routes that are always accessible (setup, auth, public pages)
const PUBLIC_ROUTES = [
  '/setup',
  '/onboarding',
  '/auth',
  '/api',
  '/_next',
  '/favicon',
  '/docs',
  '/demo',
  '/concept',
  '/pitch',
  '/support',
  '/configure',
  '/architecture',
];

// Static assets and other paths to skip
const SKIP_PATTERNS = [
  /^\/(_next|static|images|fonts)/,
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/,
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (SKIP_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not logged in - let NextAuth handle redirect
  if (!token) {
    return NextResponse.next();
  }

  // Check setup status via cookie or API
  // We use a cookie to cache setup status to avoid API calls on every request
  const setupCompleteCookie = request.cookies.get('quad_setup_complete');

  if (setupCompleteCookie?.value === 'true') {
    // Setup already complete - allow access
    return NextResponse.next();
  }

  // Check setup status via API (only if cookie not set)
  try {
    const setupCheckUrl = new URL('/api/setup/check', request.url);
    const setupRes = await fetch(setupCheckUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (setupRes.ok) {
      const setupData = await setupRes.json();

      if (setupData.setupComplete) {
        // Set cookie for future requests
        const response = NextResponse.next();
        response.cookies.set('quad_setup_complete', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
        });
        return response;
      }

      // Setup not complete - redirect to setup
      if (setupData.redirectTo) {
        return NextResponse.redirect(new URL(setupData.redirectTo, request.url));
      }

      return NextResponse.redirect(new URL('/setup', request.url));
    }
  } catch (error) {
    console.error('Middleware setup check error:', error);
    // On error, allow access to not block users
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
