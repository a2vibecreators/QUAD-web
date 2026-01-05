/**
 * GET /api/requirements/[id] - Get single requirement
 * PUT /api/requirements/[id] - Update requirement
 * DELETE /api/requirements/[id] - Delete requirement
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Cycle {
  id: string;
  cycle_number: number;
  name: string;
  status: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
  sequence_order: number;
  cycles?: Cycle[];
  _count?: { cycles: number };
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface Requirement {
  id: string;
  domain_id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_file_url: string | null;
  source_file_name: string | null;
  status: string;
  created_by: string;
  approved_by?: string | null;
  approved_at?: Date | null;
  domain: Domain;
  milestones?: Milestone[];
}

// ============================================================================
// Stub Functions
// ============================================================================

async function stubFindUniqueRequirementWithDetails(
  id: string
): Promise<Requirement | null> {
  console.log('[STUB] findUniqueRequirementWithDetails called with id:', id);
  return null;
}

async function stubFindUniqueRequirement(
  id: string
): Promise<(Requirement & { domain: { org_id: string } }) | null> {
  console.log('[STUB] findUniqueRequirement called with id:', id);
  return null;
}

async function stubUpdateRequirement(
  id: string,
  data: Record<string, unknown>
): Promise<Requirement> {
  console.log('[STUB] updateRequirement called with id:', id, 'data:', data);
  return {
    id,
    domain_id: 'stub-domain-id',
    title: (data.title as string) || 'Stub Title',
    description: (data.description as string) || null,
    source_type: 'MANUAL',
    source_file_url: null,
    source_file_name: null,
    status: (data.status as string) || 'draft',
    created_by: 'stub-user-id',
    domain: { id: 'stub-domain-id', name: 'Stub Domain', org_id: 'stub-org-id' },
    milestones: []
  };
}

async function stubDeleteRequirement(id: string): Promise<void> {
  console.log('[STUB] deleteRequirement called with id:', id);
}

// ============================================================================
// API Handlers
// ============================================================================

// GET: Get single requirement with milestones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const requirement = await stubFindUniqueRequirementWithDetails(id);

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (requirement.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Get requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update requirement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch existing requirement
    const existing = await stubFindUniqueRequirement(id);

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      source_file_url,
      source_file_name
    } = body;

    // Handle status transitions
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (source_file_url !== undefined) updateData.source_file_url = source_file_url;
    if (source_file_name !== undefined) updateData.source_file_name = source_file_name;

    // Handle approval
    if (status === 'approved' && existing.status !== 'approved') {
      updateData.status = 'approved';
      updateData.approved_by = payload.userId;
      updateData.approved_at = new Date();
    } else if (status !== undefined) {
      updateData.status = status;
    }

    const requirement = await stubUpdateRequirement(id, updateData);

    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Update requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete requirement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only admins can delete requirements
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch existing requirement
    const existing = await stubFindUniqueRequirement(id);

    if (!existing) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    await stubDeleteRequirement(id);

    return NextResponse.json({ message: 'Requirement deleted' });
  } catch (error) {
    console.error('Delete requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
