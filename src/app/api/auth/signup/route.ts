/**
 * POST /api/auth/signup
 *
 * Proxy to Java backend API for signup.
 * Forwards request to http://quad-services-dev:8080/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';

const QUAD_API_URL = process.env.QUAD_API_URL || 'http://quad-services-dev:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to Java backend
    const response = await fetch(`${QUAD_API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Return Java backend response with same status
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Signup proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
