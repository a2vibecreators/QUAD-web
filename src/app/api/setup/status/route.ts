/**
 * GET /api/setup/status
 *
 * Returns detailed setup completion status for the organization.
 * Used by the setup wizard to show progress.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getSetupStatus, getNextRequiredStep } from '@/lib/integrations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get setup status
    const status = await getSetupStatus(user.org_id);

    // Get next required step if not complete
    const nextStep = status.isComplete
      ? null
      : await getNextRequiredStep(user.org_id);

    return NextResponse.json({
      ...status,
      nextStep,
      orgId: user.org_id,
    });
  } catch (error) {
    console.error('Error fetching setup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup status' },
      { status: 500 }
    );
  }
}
