/**
 * GET /api/setup/check
 *
 * Quick check if setup is complete. Used by middleware.
 * Returns minimal data for performance.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { isSetupComplete, getNextRequiredStep } from '@/lib/integrations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Not logged in - no setup required
      return NextResponse.json({ setupComplete: true });
    }

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      // No org - redirect to org creation
      return NextResponse.json({
        setupComplete: false,
        redirectTo: '/onboarding',
      });
    }

    // Quick check if setup is complete
    const complete = await isSetupComplete(user.org_id);

    if (complete) {
      return NextResponse.json({ setupComplete: true });
    }

    // Get redirect URL for next step
    const nextStep = await getNextRequiredStep(user.org_id);

    return NextResponse.json({
      setupComplete: false,
      redirectTo: nextStep?.url || '/setup',
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    // On error, allow access (don't block)
    return NextResponse.json({ setupComplete: true });
  }
}
