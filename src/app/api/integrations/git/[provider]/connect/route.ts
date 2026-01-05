/**
 * POST /api/integrations/git/[provider]/connect
 *
 * Initiates OAuth flow for Git provider connection.
 * Returns authorization URL for user to visit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { gitHubService, getGitProviderConfig } from '@/lib/integrations';
// NOTE: Prisma removed - using stubs until Java backend ready
import crypto from 'crypto';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserWithOrg(email: string): Promise<{ id: string; org_id: string } | null> {
  console.log(`[GitConnect] getUserWithOrg for email: ${email}`);
  // Return mock user until backend ready
  return { id: 'mock-user-id', org_id: 'mock-org-id' };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await context.params;

    // Validate provider
    const providerConfig = getGitProviderConfig(provider);
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    if (providerConfig.comingSoon) {
      return NextResponse.json(
        { error: 'Provider not yet available' },
        { status: 400 }
      );
    }

    // Get user's org
    const user = await getUserWithOrg(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Generate state token for OAuth security
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in session or database for verification
    // For now, encode org_id and user_id in state (in production, use encrypted storage)
    const stateData = Buffer.from(
      JSON.stringify({
        orgId: user.org_id,
        userId: user.id,
        provider,
        nonce: state,
        timestamp: Date.now(),
      })
    ).toString('base64url');

    // Get authorization URL based on provider
    let authUrl: string;

    switch (provider) {
      case 'github':
        authUrl = gitHubService.getAuthUrl(stateData);
        break;

      case 'gitlab':
      case 'bitbucket':
      case 'azure_devops':
        return NextResponse.json(
          { error: 'Provider not yet implemented' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Unknown provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      authUrl,
      provider,
      state: stateData,
    });
  } catch (error) {
    console.error('Git connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
