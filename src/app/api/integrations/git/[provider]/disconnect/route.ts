/**
 * POST /api/integrations/git/[provider]/disconnect
 *
 * Disconnects a Git provider integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { gitHubService } from '@/lib/integrations';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await context.params;

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { id: true, org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Disconnect based on provider
    switch (provider) {
      case 'github':
        await gitHubService.disconnect(user.org_id);
        break;

      default:
        return NextResponse.json(
          { error: 'Provider not supported' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected',
    });
  } catch (error) {
    console.error('Git disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
