/**
 * POST /api/auth/verify-code
 * Verify email code and return JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Find valid verification code
    const codeResult = await query(
      `SELECT id, expires_at, attempts FROM "QUAD_email_verification_codes"
       WHERE email = $1 AND code = $2 AND used = false`,
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      // Check if code exists but was wrong (for rate limiting)
      const anyCode = await query(
        `SELECT id, attempts FROM "QUAD_email_verification_codes"
         WHERE email = $1 AND used = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      if (anyCode.rows.length > 0) {
        const record = anyCode.rows[0] as { id: string; attempts: number };

        // Increment attempt counter
        await query(
          `UPDATE "QUAD_email_verification_codes" SET attempts = attempts + 1 WHERE id = $1`,
          [record.id]
        );

        // Lock out after 5 attempts
        if (record.attempts >= 4) {
          await query(
            `UPDATE "QUAD_email_verification_codes" SET used = true WHERE id = $1`,
            [record.id]
          );
          return NextResponse.json(
            { error: 'Too many attempts. Please request a new code.' },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    const codeRecord = codeResult.rows[0] as { id: string; expires_at: Date };

    // Check expiration
    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Mark code as used
    await query(
      `UPDATE "QUAD_email_verification_codes" SET used = true WHERE id = $1`,
      [codeRecord.id]
    );

    // Check if user exists
    const userResult = await query(
      `SELECT id, company_id, email, role, full_name, is_active FROM "QUAD_users" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length > 0) {
      // Existing user - generate token and log them in
      const user = userResult.rows[0] as {
        id: string;
        company_id: string;
        email: string;
        role: string;
        full_name: string;
        is_active: boolean;
      };

      if (!user.is_active) {
        return NextResponse.json(
          { error: 'Your account has been deactivated. Please contact support.' },
          { status: 403 }
        );
      }

      // Update email_verified flag
      await query(
        `UPDATE "QUAD_users" SET email_verified = true, updated_at = NOW() WHERE id = $1`,
        [user.id]
      );

      // Generate JWT token (map company_id to org_id for QuadUser type)
      const token = generateToken({
        id: user.id,
        org_id: user.company_id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        is_active: user.is_active,
      });

      // Create session
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
      const userAgent = request.headers.get('user-agent') || null;
      await createSession(user.id, token, ipAddress, userAgent);

      return NextResponse.json({
        success: true,
        isNewUser: false,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
        },
        redirectTo: '/dashboard',
      });
    } else {
      // New user - they need to create or join an organization
      return NextResponse.json({
        success: true,
        isNewUser: true,
        email,
        message: 'Email verified. Please complete your account setup.',
        redirectTo: '/auth/signup?email=' + encodeURIComponent(email) + '&verified=true',
      });
    }

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
