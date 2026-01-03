/**
 * GET /api/integrations/git/status
 *
 * Returns the current Git integration status for the user's organization.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getAllGitProviders } from '@/lib/integrations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get all Git integrations for the org
    const integrations = await prisma.qUAD_git_integrations.findMany({
      where: { org_id: user.org_id },
      select: {
        id: true,
        provider: true,
        provider_name: true,
        account_login: true,
        account_type: true,
        is_configured: true,
        is_enabled: true,
        scope: true,
        setup_completed_at: true,
        last_sync_at: true,
        sync_status: true,
      },
    });

    // Get all available providers
    const providers = getAllGitProviders();

    // Build status for each provider
    const providerStatus = providers.map((provider) => {
      const integration = integrations.find((i) => i.provider === provider.id);

      return {
        provider: provider.id,
        name: provider.name,
        icon: provider.icon,
        comingSoon: provider.comingSoon || false,
        connected: integration?.is_configured || false,
        enabled: integration?.is_enabled || false,
        account: integration?.account_login || null,
        accountType: integration?.account_type || null,
        lastSyncAt: integration?.last_sync_at || null,
        syncStatus: integration?.sync_status || null,
      };
    });

    // Check if any provider is connected
    const hasConnectedProvider = providerStatus.some((p) => p.connected);

    return NextResponse.json({
      hasConnectedProvider,
      providers: providerStatus,
      connectedCount: integrations.filter((i) => i.is_configured).length,
    });
  } catch (error) {
    console.error('Git status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Git status' },
      { status: 500 }
    );
  }
}
