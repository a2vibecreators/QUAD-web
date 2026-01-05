/**
 * POST /api/integrations/meeting/[provider]/connect
 *
 * Initiates OAuth flow for meeting providers.
 * For API key providers, validates and saves the key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getProviderConfig,
  isOAuthProvider,
  GoogleCalendarService,
  CalComService,
  type MeetingProvider,
} from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrg(userId: string): Promise<string | null> {
  console.log(`[MeetingConnect] getUserOrg for user: ${userId}`);
  return 'mock-org-id';
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await context.params;

    // Validate provider
    const providerConfig = getProviderConfig(provider as MeetingProvider);
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get user's org
    const orgId = await getUserOrg(session.user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Handle OAuth providers
    if (isOAuthProvider(provider as MeetingProvider)) {
      return handleOAuthConnect(provider as MeetingProvider, orgId, session.user.id);
    }

    // Handle API key providers (Cal.com)
    const body = await request.json().catch(() => ({}));
    return handleApiKeyConnect(
      provider as MeetingProvider,
      orgId,
      session.user.id,
      body.apiKey
    );
  } catch (error) {
    console.error('Error connecting provider:', error);
    return NextResponse.json(
      { error: 'Failed to connect provider' },
      { status: 500 }
    );
  }
}

/**
 * Handle OAuth provider connection
 */
async function handleOAuthConnect(
  provider: MeetingProvider,
  orgId: string,
  userId: string
): Promise<NextResponse> {
  switch (provider) {
    case 'google_calendar': {
      const googleService = new GoogleCalendarService();

      // Create state with org_id and user_id for callback
      const state = Buffer.from(
        JSON.stringify({ orgId, userId, provider })
      ).toString('base64');

      const authUrl = googleService.getAuthUrl(state);

      return NextResponse.json({
        type: 'oauth',
        authUrl,
        message: 'Redirect user to authUrl to complete OAuth flow',
      });
    }

    case 'outlook': {
      // TODO: Implement Microsoft OAuth
      return NextResponse.json(
        { error: 'Outlook integration coming soon' },
        { status: 501 }
      );
    }

    case 'zoom': {
      // TODO: Implement Zoom OAuth
      return NextResponse.json(
        { error: 'Zoom integration coming soon' },
        { status: 501 }
      );
    }

    default:
      return NextResponse.json(
        { error: 'Provider not supported for OAuth' },
        { status: 400 }
      );
  }
}

/**
 * Handle API key provider connection
 */
async function handleApiKeyConnect(
  provider: MeetingProvider,
  orgId: string,
  userId: string,
  apiKey?: string
): Promise<NextResponse> {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 400 }
    );
  }

  switch (provider) {
    case 'cal_com': {
      const calService = new CalComService();

      // Verify API key by fetching user info
      try {
        const userInfo = await calService.verifyApiKey(apiKey);

        // Save to database
        await calService.saveIntegration(orgId, userId, apiKey, userInfo);

        return NextResponse.json({
          type: 'api_key',
          success: true,
          message: 'Cal.com connected successfully',
          account: {
            email: userInfo.email,
            name: userInfo.name,
            username: userInfo.username,
          },
        });
      } catch {
        return NextResponse.json(
          { error: 'Invalid API key. Please check and try again.' },
          { status: 400 }
        );
      }
    }

    default:
      return NextResponse.json(
        { error: 'Provider does not support API key authentication' },
        { status: 400 }
      );
  }
}
