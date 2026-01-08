/**
 * GET /api/circles/[id] - Get circle by ID
 * PUT /api/circles/[id] - Update circle
 * DELETE /api/circles/[id] - Delete circle
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface AdoptionMatrix {
  skill_level: number;
  trust_level: number;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  org_id: string;
  adoption_matrix: AdoptionMatrix | null;
}

interface CircleMember {
  user: Pick<User, 'id' | 'email' | 'full_name' | 'role' | 'adoption_matrix'>;
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface Circle {
  id: string;
  domain_id: string;
  circle_number: number;
  circle_name: string;
  description: string | null;
  lead_user_id: string | null;
  is_active: boolean;
  domain: Domain;
  lead: Pick<User, 'id' | 'email' | 'full_name' | 'adoption_matrix'> | null;
  members: CircleMember[];
}

interface CircleWithOrgId {
  id: string;
  domain: { org_id: string };
}

// Stub functions
async function stubFindCircleById(id: string): Promise<Circle | null> {
  console.log(`[STUB] Finding circle by ID: ${id}`);
  return null;
}

async function stubFindCircleWithOrgId(id: string): Promise<CircleWithOrgId | null> {
  console.log(`[STUB] Finding circle with org ID: ${id}`);
  return null;
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log(`[STUB] Finding user by ID: ${userId}`);
  return null;
}

async function stubUpdateCircle(id: string, data: Partial<Circle>): Promise<Circle | null> {
  console.log(`[STUB] Updating circle ${id} with data:`, data);
  return null;
}

async function stubDeleteCircle(id: string): Promise<void> {
  console.log(`[STUB] Deleting circle: ${id}`);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get circle by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const circle = await stubFindCircleById(id);

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Verify circle belongs to user's organization
    if (circle.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Get circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update circle
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and managers can update circles
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await stubFindCircleWithOrgId(id);

    if (!existing) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { circle_name, description, lead_user_id, is_active } = body;

    // If changing lead, verify they're in same company
    if (lead_user_id !== undefined && lead_user_id !== null) {
      const leadUser = await stubFindUserById(lead_user_id);
      if (!leadUser || leadUser.org_id !== payload.orgId) {
        return NextResponse.json({ error: 'Lead user not found' }, { status: 404 });
      }
    }

    const circle = await stubUpdateCircle(id, {
      ...(circle_name !== undefined && { circle_name }),
      ...(description !== undefined && { description }),
      ...(lead_user_id !== undefined && { lead_user_id }),
      ...(is_active !== undefined && { is_active })
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Update circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete circle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins can delete circles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await stubFindCircleWithOrgId(id);

    if (!existing) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await stubDeleteCircle(id);

    return NextResponse.json({ message: 'Circle deleted successfully' });
  } catch (error) {
    console.error('Delete circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
