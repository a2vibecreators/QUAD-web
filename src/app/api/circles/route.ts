/**
 * GET /api/circles - Get circles (team groups within domains)
 * POST /api/circles - Create a new circle
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
  org_id: string;
  adoption_matrix: AdoptionMatrix | null;
}

interface CircleMember {
  user: Pick<User, 'id' | 'email' | 'full_name' | 'adoption_matrix'>;
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
  domain: Pick<Domain, 'id' | 'name'>;
  lead: Pick<User, 'id' | 'email' | 'full_name'> | null;
  members: CircleMember[];
  _count: { members: number };
}

// Stub functions
async function stubFindOrgDomains(orgId: string): Promise<{ id: string }[]> {
  console.log(`[STUB] Finding domains for org: ${orgId}`);
  return [];
}

async function stubFindCircles(_where: Record<string, unknown>): Promise<Circle[]> {
  console.log(`[STUB] Finding circles with filter:`, _where);
  return [];
}

async function stubFindDomainById(domainId: string): Promise<Domain | null> {
  console.log(`[STUB] Finding domain by ID: ${domainId}`);
  return null;
}

async function stubFindCircleByDomainAndNumber(domainId: string, circleNumber: number): Promise<Circle | null> {
  console.log(`[STUB] Finding circle ${circleNumber} in domain ${domainId}`);
  return null;
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log(`[STUB] Finding user by ID: ${userId}`);
  return null;
}

async function stubCreateCircle(data: {
  domain_id: string;
  circle_number: number;
  circle_name: string;
  description?: string;
  lead_user_id?: string;
}): Promise<Circle | null> {
  console.log(`[STUB] Creating circle:`, data);
  return null;
}

// GET: Get circles
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    const isActive = searchParams.get('is_active');

    // Get organization's domains
    const orgDomains = await stubFindOrgDomains(payload.orgId);
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (isActive !== null && isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const circles = await stubFindCircles(where);

    return NextResponse.json({ circles });
  } catch (error) {
    console.error('Get circles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new circle
export async function POST(request: NextRequest) {
  try {
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

    // Only admins and managers can create circles
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { domain_id, circle_number, circle_name, description, lead_user_id } = body;

    // Validation
    if (!domain_id || !circle_number || !circle_name) {
      return NextResponse.json(
        { error: 'domain_id, circle_number, and circle_name are required' },
        { status: 400 }
      );
    }

    // Verify domain exists and belongs to user's company
    const domain = await stubFindDomainById(domain_id);

    if (!domain || domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check if circle_number already exists in domain
    const existing = await stubFindCircleByDomainAndNumber(domain_id, circle_number);

    if (existing) {
      return NextResponse.json(
        { error: `Circle ${circle_number} already exists in this domain` },
        { status: 409 }
      );
    }

    // If lead_user_id provided, verify they're in same company
    if (lead_user_id) {
      const leadUser = await stubFindUserById(lead_user_id);
      if (!leadUser || leadUser.org_id !== payload.orgId) {
        return NextResponse.json({ error: 'Lead user not found' }, { status: 404 });
      }
    }

    const circle = await stubCreateCircle({
      domain_id,
      circle_number,
      circle_name,
      description,
      lead_user_id
    });

    return NextResponse.json(circle, { status: 201 });
  } catch (error) {
    console.error('Create circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
