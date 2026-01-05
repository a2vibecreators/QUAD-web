/**
 * POST /api/auth/complete-oauth-signup
 *
 * Completes OAuth signup for new users.
 * Called after user selects account type on /auth/signup page (OAuth flow).
 *
 * Flow:
 * 1. User signs in with Google/GitHub
 * 2. NextAuth callback detects new user, redirects to /auth/signup?oauth=true
 * 3. User selects account type (Startup/Business/Enterprise)
 * 4. This endpoint creates organization + user account
 * 5. User is redirected to dashboard
 */

import { NextRequest, NextResponse } from 'next/server';

const QUAD_API_URL = process.env.QUAD_API_URL || 'http://quad-services-dev:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, email, fullName, orgType } = body;

    // Validation
    if (!provider || !email || !fullName || !orgType) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, email, fullName, orgType' },
        { status: 400 }
      );
    }

    if (!['startup', 'business', 'enterprise'].includes(orgType)) {
      return NextResponse.json(
        { error: 'Invalid orgType. Must be: startup, business, or enterprise' },
        { status: 400 }
      );
    }

    // Generate default company name from user's name
    // e.g., "John Smith" → "John Smith's Team"
    const companyName = `${fullName.split(' ')[0]}'s Team`;

    // Call Java backend signup endpoint with OAuth flag
    const response = await fetch(`${QUAD_API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fullName,
        companyName,
        orgType,
        isOAuth: true,
        oauthProvider: provider,
        isEmailVerified: true, // OAuth users are pre-verified
        password: null, // No password for OAuth users
      }),
    });

    const data = await response.json();

    // Return Java backend response with same status
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('OAuth signup completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup. Please try again.' },
      { status: 500 }
    );
  }
}
