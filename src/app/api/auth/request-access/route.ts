import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, adminEmail, companySize, ssoProvider, message } = body;

    // Validation
    if (!companyName || !adminEmail || !companySize || !ssoProvider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if organization/email already exists
    const existingOrg = await query(
      'SELECT id FROM "QUAD_organizations" WHERE admin_email = $1',
      [adminEmail]
    );

    if (existingOrg.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create pending organization (admin must approve via email)
    const result = await query(
      `INSERT INTO "QUAD_organizations" (
        name,
        admin_email,
        size
      ) VALUES ($1, $2, $3)
      RETURNING id`,
      [
        companyName,
        adminEmail,
        companySize,
      ]
    );

    const orgId = (result.rows[0] as { id: string }).id;

    // TODO: Store access request metadata when QUAD_access_requests table is added
    // For now, log the request details
    console.log('Access request metadata:', {
      orgId,
      ssoProvider,
      message,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    });

    // TODO: Send email notification to QUAD support team
    // TODO: Send confirmation email to user
    console.log('Access request submitted:', {
      orgId,
      companyName,
      adminEmail,
      ssoProvider,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Access request submitted successfully',
        orgId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
