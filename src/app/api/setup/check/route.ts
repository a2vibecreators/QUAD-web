/**
 * GET /api/setup/check
 *
 * Quick check if setup is complete. Used by middleware.
 * Returns minimal data for performance.
 *
 * NOTE: Simplified to not use Prisma - uses session data from JWT instead.
 * Full setup validation will be added when Java backend has config endpoints.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Not logged in - no setup required (let NextAuth handle redirect)
      return NextResponse.json({ setupComplete: true });
    }

    // Check if user has an organization (orgId is set in JWT callback from Java backend)
    if (!session.user.orgId) {
      // No org - redirect to onboarding
      return NextResponse.json({
        setupComplete: false,
        redirectTo: '/onboarding',
      });
    }

    // For now, if user has org, consider setup complete
    // TODO: Add proper setup validation when Java backend has config endpoints
    // This could check: AI tier selected, meeting provider connected, etc.
    return NextResponse.json({ setupComplete: true });

  } catch (error) {
    console.error('Error checking setup status:', error);
    // On error, allow access (don't block)
    return NextResponse.json({ setupComplete: true });
  }
}
