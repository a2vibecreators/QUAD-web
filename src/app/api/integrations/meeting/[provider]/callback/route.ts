/**
 * GET /api/integrations/meeting/[provider]/callback
 *
 * OAuth callback handler for meeting providers.
 * Exchanges authorization code for tokens and saves integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { provider } = await context.params;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      return redirectToSetup(`error=${encodeURIComponent(errorDescription)}`);
    }

    if (!code || !state) {
      return redirectToSetup('error=Missing+authorization+code');
    }

    // Decode state to get org_id and user_id
    let stateData: { orgId: string; userId: string; provider: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return redirectToSetup('error=Invalid+state+parameter');
    }

    // Verify provider matches
    if (stateData.provider !== provider) {
      return redirectToSetup('error=Provider+mismatch');
    }

    // Handle by provider
    switch (provider) {
      case 'google_calendar':
        return handleGoogleCallback(code, stateData.orgId, stateData.userId);

      case 'outlook':
        // TODO: Implement Microsoft OAuth callback
        return redirectToSetup('error=Outlook+not+implemented');

      case 'zoom':
        // TODO: Implement Zoom OAuth callback
        return redirectToSetup('error=Zoom+not+implemented');

      default:
        return redirectToSetup('error=Invalid+provider');
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return redirectToSetup('error=OAuth+callback+failed');
  }
}

/**
 * Handle Google OAuth callback
 */
async function handleGoogleCallback(
  code: string,
  orgId: string,
  userId: string
): Promise<NextResponse> {
  const googleService = new GoogleCalendarService();

  try {
    // Exchange code for tokens
    const tokens = await googleService.exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await googleService.getUserInfo(tokens.access_token);

    // Save integration to database
    await googleService.saveIntegration(orgId, userId, tokens, userInfo);

    // Redirect to setup page with success
    return redirectToSetup(
      `success=true&provider=google_calendar&email=${encodeURIComponent(userInfo.email)}`
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Failed to connect Google Calendar';
    return redirectToSetup(`error=${encodeURIComponent(message)}`);
  }
}

/**
 * Redirect to setup page with query params
 */
function redirectToSetup(queryParams: string): NextResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://dev.quadframe.work';
  return NextResponse.redirect(`${baseUrl}/setup/meetings?${queryParams}`);
}
