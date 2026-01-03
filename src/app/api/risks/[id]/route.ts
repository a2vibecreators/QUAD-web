/**
 * GET /api/risks/[id] - Get risk factor details
 * PUT /api/risks/[id] - Update risk factor
 * DELETE /api/risks/[id] - Delete risk factor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get risk factor details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const risk = await prisma.qUAD_risk_factors.findUnique({
      where: { id }
    });

    if (!risk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    // Verify domain belongs to org
    const domain = await prisma.qUAD_domains.findFirst({
      where: { id: risk.domain_id, org_id: payload.companyId }
    });

    if (!domain) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    // Get owner name if assigned
    let owner = null;
    if (risk.owner_user_id) {
      owner = await prisma.qUAD_users.findUnique({
        where: { id: risk.owner_user_id },
        select: { id: true, full_name: true, email: true }
      });
    }

    return NextResponse.json({
      risk: {
        ...risk,
        domain_name: domain.name,
        owner
      }
    });

  } catch (error) {
    console.error('Get risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update risk factor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      risk_name,
      description,
      probability,
      impact,
      status,
      mitigation_plan,
      owner_user_id,
      review_due_at
    } = body;

    // Find risk and verify access
    const existingRisk = await prisma.qUAD_risk_factors.findUnique({
      where: { id }
    });

    if (!existingRisk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    const domain = await prisma.qUAD_domains.findFirst({
      where: { id: existingRisk.domain_id, org_id: payload.companyId }
    });

    if (!domain) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    // Validate status if provided
    const validStatuses = ['identified', 'mitigating', 'resolved', 'accepted'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate new risk score if probability or impact changed
    const newProb = probability ?? existingRisk.probability;
    const newImp = impact ?? existingRisk.impact;
    const newScore = newProb * newImp;

    let newLevel = existingRisk.risk_level;
    if (probability !== undefined || impact !== undefined) {
      if (newScore >= 20) newLevel = 'critical';
      else if (newScore >= 12) newLevel = 'high';
      else if (newScore >= 6) newLevel = 'medium';
      else newLevel = 'low';
    }

    const risk = await prisma.qUAD_risk_factors.update({
      where: { id },
      data: {
        ...(risk_name && { risk_name }),
        ...(description !== undefined && { description }),
        ...(probability !== undefined && { probability }),
        ...(impact !== undefined && { impact }),
        risk_score: newScore,
        risk_level: newLevel,
        ...(status && { status }),
        ...(status === 'resolved' && { resolved_at: new Date() }),
        ...(mitigation_plan !== undefined && { mitigation_plan }),
        ...(owner_user_id !== undefined && { owner_user_id }),
        ...(review_due_at !== undefined && {
          review_due_at: review_due_at ? new Date(review_due_at) : null
        })
      }
    });

    return NextResponse.json({ risk });

  } catch (error) {
    console.error('Update risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete risk factor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find risk and verify access
    const existingRisk = await prisma.qUAD_risk_factors.findUnique({
      where: { id }
    });

    if (!existingRisk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    const domain = await prisma.qUAD_domains.findFirst({
      where: { id: existingRisk.domain_id, org_id: payload.companyId }
    });

    if (!domain) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    await prisma.qUAD_risk_factors.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Risk deleted successfully' });

  } catch (error) {
    console.error('Delete risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
