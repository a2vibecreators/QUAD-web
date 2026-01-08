/**
 * GET /api/circles/[id]/members - List circle members
 * POST /api/circles/[id]/members - Add member to circle
 * DELETE /api/circles/[id]/members - Remove member from circle
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
  is_active: boolean;
  org_id: string;
  adoption_matrix: AdoptionMatrix | null;
}

interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: string;
  allocation_pct: number;
  created_at: Date;
  user: Pick<User, 'id' | 'email' | 'full_name' | 'role' | 'is_active'> & { adoption_matrix: AdoptionMatrix | null };
}

interface Circle {
  id: string;
  domain: { org_id: string };
}

// Stub functions
async function stubFindCircleWithOrgId(circleId: string): Promise<Circle | null> {
  console.log(`[STUB] Finding circle with org ID: ${circleId}`);
  return null;
}

async function stubFindCircleMembers(circleId: string): Promise<CircleMember[]> {
  console.log(`[STUB] Finding members for circle: ${circleId}`);
  return [];
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log(`[STUB] Finding user by ID: ${userId}`);
  return null;
}

async function stubFindCircleMembership(circleId: string, userId: string): Promise<CircleMember | null> {
  console.log(`[STUB] Finding circle membership for user ${userId} in circle ${circleId}`);
  return null;
}

async function stubCreateCircleMember(data: {
  circle_id: string;
  user_id: string;
  role: string;
  allocation_pct: number;
}): Promise<CircleMember | null> {
  console.log(`[STUB] Creating circle member:`, data);
  return null;
}

async function stubDeleteCircleMember(circleId: string, userId: string): Promise<void> {
  console.log(`[STUB] Deleting circle member: user ${userId} from circle ${circleId}`);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List circle members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

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

    // Verify circle exists and belongs to user's company
    const circle = await stubFindCircleWithOrgId(circleId);

    if (!circle || circle.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const members = await stubFindCircleMembers(circleId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get circle members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add member to circle
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

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

    // Only admins and managers can add members
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify circle exists and belongs to user's company
    const circle = await stubFindCircleWithOrgId(circleId);

    if (!circle || circle.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const body = await request.json();
    const { user_id, role, allocation_pct } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is in same company
    const user = await stubFindUserById(user_id);

    if (!user || user.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await stubFindCircleMembership(circleId, user_id);

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this circle' },
        { status: 409 }
      );
    }

    const member = await stubCreateCircleMember({
      circle_id: circleId,
      user_id,
      role: role || 'member',
      allocation_pct: allocation_pct || 100
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Add circle member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from circle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: circleId } = await params;

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

    // Only admins and managers can remove members
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify circle exists and belongs to user's company
    const circle = await stubFindCircleWithOrgId(circleId);

    if (!circle || circle.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Check membership exists
    const existing = await stubFindCircleMembership(circleId, userId);

    if (!existing) {
      return NextResponse.json(
        { error: 'User is not a member of this circle' },
        { status: 404 }
      );
    }

    await stubDeleteCircleMember(circleId, userId);

    return NextResponse.json({ message: 'Member removed from circle' });
  } catch (error) {
    console.error('Remove circle member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
