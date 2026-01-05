/**
 * GET /api/domains/[id]/members - List domain members
 * POST /api/domains/[id]/members - Add member to domain
 * DELETE /api/domains/[id]/members - Remove member from domain
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

interface DomainMember {
  id: string;
  user_id: string;
  domain_id: string;
  role: string;
  allocation_percentage: number;
  created_at: Date;
  user: Pick<User, 'id' | 'email' | 'full_name' | 'role' | 'is_active'> & { adoption_matrix: AdoptionMatrix | null };
}

interface Domain {
  id: string;
  org_id: string;
}

// Stub functions
async function stubFindDomainById(domainId: string): Promise<Domain | null> {
  console.log(`[STUB] Finding domain by ID: ${domainId}`);
  return null;
}

async function stubFindDomainMembers(domainId: string): Promise<DomainMember[]> {
  console.log(`[STUB] Finding members for domain: ${domainId}`);
  return [];
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log(`[STUB] Finding user by ID: ${userId}`);
  return null;
}

async function stubFindDomainMembership(userId: string, domainId: string): Promise<DomainMember | null> {
  console.log(`[STUB] Finding domain membership for user ${userId} in domain ${domainId}`);
  return null;
}

async function stubCreateDomainMember(data: { user_id: string; domain_id: string; role: string; allocation_percentage: number }): Promise<DomainMember | null> {
  console.log(`[STUB] Creating domain member:`, data);
  return null;
}

async function stubDeleteDomainMember(userId: string, domainId: string): Promise<void> {
  console.log(`[STUB] Deleting domain member: user ${userId} from domain ${domainId}`);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List domain members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: domainId } = await params;

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

    // Verify domain exists and belongs to user's organization
    const domain = await stubFindDomainById(domainId);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const members = await stubFindDomainMembers(domainId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get domain members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add member to domain
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: domainId } = await params;

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

    // Verify domain exists and belongs to user's organization
    const domain = await stubFindDomainById(domainId);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const body = await request.json();
    const { user_id, role, allocation_percentage } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is in same company
    const user = await stubFindUserById(user_id);

    if (!user || user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await stubFindDomainMembership(user_id, domainId);

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this domain' },
        { status: 409 }
      );
    }

    const member = await stubCreateDomainMember({
      user_id,
      domain_id: domainId,
      role: role || 'DEVELOPER',
      allocation_percentage: allocation_percentage || 100
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Add domain member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from domain
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: domainId } = await params;

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

    // Verify domain exists and belongs to user's organization
    const domain = await stubFindDomainById(domainId);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check membership exists
    const existing = await stubFindDomainMembership(userId, domainId);

    if (!existing) {
      return NextResponse.json(
        { error: 'User is not a member of this domain' },
        { status: 404 }
      );
    }

    await stubDeleteDomainMember(userId, domainId);

    return NextResponse.json({ message: 'Member removed from domain' });
  } catch (error) {
    console.error('Remove domain member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
