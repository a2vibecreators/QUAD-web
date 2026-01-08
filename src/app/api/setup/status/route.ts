/**
 * GET /api/setup/status
 *
 * Returns detailed setup completion status for the organization.
 * Used by the setup wizard to show progress.
 *
 * NOTE: Updated to use session data instead of Prisma.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getSetupStatus, getNextRequiredStep } from '@/lib/integrations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org from session (set by JWT callback from Java backend)
    const orgId = session.user.orgId;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get setup status
    const status = await getSetupStatus(orgId);

    // Get next required step if not complete
    const nextStep = status.isComplete
      ? null
      : await getNextRequiredStep(orgId);

    return NextResponse.json({
      ...status,
      nextStep,
      orgId,
    });
  } catch (error) {
    console.error('Error fetching setup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup status' },
      { status: 500 }
    );
  }
}
