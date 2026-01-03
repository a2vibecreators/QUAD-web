import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      toolName,
      category,
      website,
      useCase,
      companyName,
      email,
      plan,
      urgency,
    } = body;

    // Validation
    if (!toolName || !category || !useCase || !companyName || !email || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // TODO: Store in database (QUAD_integration_requests table)
    // For now, log to console (will be replaced with DB insert)
    console.log('Integration request received:', {
      toolName,
      category,
      website,
      useCase,
      companyName,
      email,
      plan,
      urgency,
      requestedAt: new Date().toISOString(),
    });

    // TODO: Send email notification to QUAD team
    // TODO: Send confirmation email to user

    // For now, return success
    return NextResponse.json(
      {
        success: true,
        message: 'Integration request submitted successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Integration request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
