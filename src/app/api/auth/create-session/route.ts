/**
 * POST /api/auth/create-session
 *
 * Creates NextAuth session after OAuth signup without triggering OAuth redirect.
 *
 * Flow:
 * 1. User completes OAuth signup (account created in database)
 * 2. Frontend calls this endpoint with email + provider
 * 3. We manually create JWT token + session cookie
 * 4. User is redirected to dashboard (no OAuth redirect!)
 *
 * This fixes the "double redirect" issue where new OAuth users see Google twice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { getUserByEmail } from '@/lib/java-backend';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, provider } = body;

    // Validation
    if (!email || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: email, provider' },
        { status: 400 }
      );
    }

    // Fetch user from backend
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create JWT token (same structure as NextAuth jwt callback)
    const token = await encode({
      secret: JWT_SECRET,
      token: {
        sub: user.id,
        email: user.email,
        name: user.fullName,
        picture: null,
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        fullName: user.fullName,
        domainId: null,
        domainRole: null,
        allocationPercentage: null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set session cookie
    cookies().set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    console.log(`[create-session] Session created for ${email} via ${provider}`);

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
    });

  } catch (error) {
    console.error('[create-session] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
