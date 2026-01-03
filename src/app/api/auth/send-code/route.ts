/**
 * POST /api/auth/send-code
 * Send verification code to email for passwordless login
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendVerificationCode, generateVerificationCode } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting: Check if we sent a code in the last 60 seconds
    const recentCode = await query(
      `SELECT id FROM "QUAD_email_verification_codes"
       WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds' AND used = false`,
      [email]
    );

    if (recentCode.rows.length > 0) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting a new code' },
        { status: 429 }
      );
    }

    // Generate 6-digit code
    const code = generateVerificationCode();

    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete old unused codes for this email (cleanup)
    await query(
      `DELETE FROM "QUAD_email_verification_codes"
       WHERE email = $1 AND (used = true OR expires_at < NOW())`,
      [email]
    );

    // Store the code
    await query(
      `INSERT INTO "QUAD_email_verification_codes" (email, code, expires_at)
       VALUES ($1, $2, $3)`,
      [email, code, expiresAt]
    );

    // Send the email
    const sent = await sendVerificationCode(email, code);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    // Check if this email exists as a user (for UI hint)
    const existingUser = await query(
      `SELECT id FROM "QUAD_users" WHERE email = $1`,
      [email]
    );

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      isExistingUser: existingUser.rows.length > 0,
      expiresIn: 600, // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
