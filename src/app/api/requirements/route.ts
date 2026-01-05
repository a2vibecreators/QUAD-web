/**
 * GET /api/requirements - List requirements for a domain
 * POST /api/requirements - Create a new requirement
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
  sequence_order: number;
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
  created_at: Date;
  domain?: { id: string; name: string };
  milestones?: Milestone[];
  _count?: { milestones: number };
}

// ============================================================================
// Stub Functions
// ============================================================================

async function stubFindManyDomains(orgId: string): Promise<{ id: string }[]> {
  console.log('[STUB] findManyDomains called with orgId:', orgId);
  return [];
}

async function stubFindManyRequirements(
  _where: Record<string, unknown>
): Promise<Requirement[]> {
  console.log('[STUB] findManyRequirements called');
  return [];
}

async function stubFindUniqueDomain(domainId: string): Promise<Domain | null> {
  console.log('[STUB] findUniqueDomain called with id:', domainId);
  return null;
}

async function stubCreateRequirement(
  data: Record<string, unknown>
): Promise<Requirement> {
  console.log('[STUB] createRequirement called with data:', data);
  return {
    id: 'stub-requirement-id',
    domain_id: data.domain_id as string,
    title: data.title as string,
    description: data.description as string | null,
    source_type: data.source_type as string,
    source_file_url: data.source_file_url as string | null,
    source_file_name: data.source_file_name as string | null,
    status: 'draft',
    created_by: data.created_by as string,
    created_at: new Date(),
    domain: { id: data.domain_id as string, name: 'Stub Domain' }
  };
}

// ============================================================================
// API Handlers
// ============================================================================

// GET: List requirements with filtering
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
    const status = searchParams.get('status');
    const sourceType = searchParams.get('source_type');
    const aiProcessed = searchParams.get('ai_processed');

    // Get organization domains
    const orgDomains = await stubFindManyDomains(payload.companyId);
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (status) where.status = status;
    if (sourceType) where.source_type = sourceType;
    if (aiProcessed !== null) where.ai_processed = aiProcessed === 'true';

    const requirements = await stubFindManyRequirements(where);

    // Group by status
    const byStatus = {
      draft: requirements.filter(r => r.status === 'draft'),
      processing: requirements.filter(r => r.status === 'processing'),
      approved: requirements.filter(r => r.status === 'approved'),
      archived: requirements.filter(r => r.status === 'archived')
    };

    return NextResponse.json({
      requirements,
      by_status: byStatus,
      total: requirements.length
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new requirement
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

    const body = await request.json();
    const {
      domain_id,
      title,
      description,
      source_type,
      source_file_url,
      source_file_name
    } = body;

    // Validation
    if (!domain_id || !title) {
      return NextResponse.json(
        { error: 'domain_id and title are required' },
        { status: 400 }
      );
    }

    if (!source_type || !['UPLOAD', 'MANUAL', 'MEETING_TRANSCRIPT'].includes(source_type)) {
      return NextResponse.json(
        { error: 'source_type must be UPLOAD, MANUAL, or MEETING_TRANSCRIPT' },
        { status: 400 }
      );
    }

    // Verify domain exists and belongs to user's company
    const domain = await stubFindUniqueDomain(domain_id);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Create requirement
    const requirement = await stubCreateRequirement({
      domain_id,
      title,
      description,
      source_type,
      source_file_url,
      source_file_name,
      status: 'draft',
      created_by: payload.userId
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error('Create requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
