/**
 * GET /api/integrations/git/[provider]/callback
 *
 * OAuth callback handler for Git providers.
 * Exchanges authorization code for tokens and saves integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { gitHubService } from '@/lib/integrations';
import { markStepComplete } from '@/lib/integrations';

interface RouteContext {
  params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { provider } = await context.params;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      console.error('Git OAuth error:', errorDescription);
      return NextResponse.redirect(
        new URL(`/configure/integrations?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/configure/integrations?error=Missing+authorization+code', request.url)
      );
    }

    // Decode state to get org and user info
    let stateData: {
      orgId: string;
      userId: string;
      provider: string;
      nonce: string;
      timestamp: number;
    };

    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/configure/integrations?error=Invalid+state+parameter', request.url)
      );
    }

    // Verify state is not too old (15 minute expiry)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/configure/integrations?error=Authorization+expired', request.url)
      );
    }

    // Verify provider matches
    if (stateData.provider !== provider) {
      return NextResponse.redirect(
        new URL('/configure/integrations?error=Provider+mismatch', request.url)
      );
    }

    // Handle by provider
    switch (provider) {
      case 'github': {
        // Exchange code for tokens
        const tokens = await gitHubService.exchangeCodeForTokens(code);

        // Get user info
        const user = await gitHubService.getUser(tokens.access_token);

        // Save integration to database
        await gitHubService.saveIntegration(
          stateData.orgId,
          stateData.userId,
          tokens,
          user
        );

        // Mark git_provider_connected step as complete
        await markStepComplete(stateData.orgId, 'git_provider_connected');

        break;
      }

      default:
        return NextResponse.redirect(
          new URL('/configure/integrations?error=Provider+not+implemented', request.url)
        );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/configure/integrations?success=git_connected', request.url)
    );
  } catch (error) {
    console.error('Git callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/configure/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
