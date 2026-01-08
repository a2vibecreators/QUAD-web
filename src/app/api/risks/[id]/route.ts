/**
 * GET /api/risks/[id] - Get risk factor details
 * PUT /api/risks/[id] - Update risk factor
 * DELETE /api/risks/[id] - Delete risk factor
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface RiskFactor {
  id: string;
  domain_id: string;
  risk_type: string;
  risk_name: string;
  description: string | null;
  probability: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  status: string;
  mitigation_plan: string | null;
  owner_user_id: string | null;
  review_due_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

// Stub functions for database operations
async function findRiskFactorById(id: string): Promise<RiskFactor | null> {
  console.log('[STUB] findRiskFactorById called with id:', id);
  return null;
}

async function findDomainByIdAndOrg(domainId: string, orgId: string): Promise<Domain | null> {
  console.log('[STUB] findDomainByIdAndOrg called with domainId:', domainId, 'orgId:', orgId);
  return null;
}

async function findUserById(userId: string): Promise<User | null> {
  console.log('[STUB] findUserById called with userId:', userId);
  return null;
}

async function updateRiskFactor(id: string, data: Partial<RiskFactor>): Promise<RiskFactor> {
  console.log('[STUB] updateRiskFactor called with id:', id, 'data:', data);
  return {
    id,
    domain_id: data.domain_id || '',
    risk_type: data.risk_type || '',
    risk_name: data.risk_name || '',
    description: data.description || null,
    probability: data.probability || 3,
    impact: data.impact || 3,
    risk_score: data.risk_score || 9,
    risk_level: data.risk_level || 'medium',
    status: data.status || 'identified',
    mitigation_plan: data.mitigation_plan || null,
    owner_user_id: data.owner_user_id || null,
    review_due_at: data.review_due_at || null,
    resolved_at: data.resolved_at || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

async function deleteRiskFactor(id: string): Promise<void> {
  console.log('[STUB] deleteRiskFactor called with id:', id);
}

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

    const risk = await findRiskFactorById(id);

    if (!risk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    // Verify domain belongs to org
    const domain = await findDomainByIdAndOrg(risk.domain_id, payload.orgId);

    if (!domain) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    // Get owner name if assigned
    let owner: any = null;
    if (risk.owner_user_id) {
      owner = await findUserById(risk.owner_user_id);
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
    const existingRisk = await findRiskFactorById(id);

    if (!existingRisk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    const domain = await findDomainByIdAndOrg(existingRisk.domain_id, payload.orgId);

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

    const updateData: Partial<RiskFactor> = {
      risk_score: newScore,
      risk_level: newLevel,
    };

    if (risk_name) updateData.risk_name = risk_name;
    if (description !== undefined) updateData.description = description;
    if (probability !== undefined) updateData.probability = probability;
    if (impact !== undefined) updateData.impact = impact;
    if (status) {
      updateData.status = status;
      if (status === 'resolved') updateData.resolved_at = new Date();
    }
    if (mitigation_plan !== undefined) updateData.mitigation_plan = mitigation_plan;
    if (owner_user_id !== undefined) updateData.owner_user_id = owner_user_id;
    if (review_due_at !== undefined) {
      updateData.review_due_at = review_due_at ? new Date(review_due_at) : null;
    }

    const risk = await updateRiskFactor(id, updateData);

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
    const existingRisk = await findRiskFactorById(id);

    if (!existingRisk) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    const domain = await findDomainByIdAndOrg(existingRisk.domain_id, payload.orgId);

    if (!domain) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    await deleteRiskFactor(id);

    return NextResponse.json({ message: 'Risk deleted successfully' });

  } catch (error) {
    console.error('Delete risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
