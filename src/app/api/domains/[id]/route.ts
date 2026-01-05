/**
 * GET /api/domains/[id] - Get domain by ID
 * PUT /api/domains/[id] - Update domain
 * DELETE /api/domains/[id] - Delete domain
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface DomainParent {
  id: string;
  name: string;
  path: string | null;
}

interface SubDomain {
  id: string;
  name: string;
  domain_type: string | null;
  is_deleted: boolean;
  _count: { members: number; flows: number };
}

interface DomainMember {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
}

interface DomainResource {
  id: string;
  resource_type: string;
  resource_name: string;
  resource_status: string;
}

interface DomainCircle {
  id: string;
  circle_number: number;
  circle_name: string;
  is_active: boolean;
}

interface DomainCreator {
  id: string;
  email: string;
  full_name: string | null;
}

interface Domain {
  id: string;
  name: string;
  domain_type: string | null;
  org_id: string;
  path: string | null;
  parent_domain_id: string | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by: string | null;
  created_by: string;
  parent_domain: DomainParent | null;
  sub_domains: SubDomain[];
  members: DomainMember[];
  resources: DomainResource[];
  circles: DomainCircle[];
  creator: DomainCreator | null;
  _count: {
    members: number;
    resources: number;
    flows: number;
    circles: number;
    sub_domains: number;
  };
}

// Stub functions
async function stubFindDomainById(id: string, _includeDeleted: boolean): Promise<Domain | null> {
  console.log(`[STUB] Finding domain by ID: ${id}`);
  return null;
}

async function stubFindDomainSimple(id: string): Promise<Pick<Domain, 'id' | 'org_id' | 'path' | 'parent_domain_id' | 'name' | 'is_deleted' | 'created_by'> | null> {
  console.log(`[STUB] Finding domain (simple) by ID: ${id}`);
  return null;
}

async function stubFindDomainWithCreator(id: string): Promise<(Pick<Domain, 'id' | 'org_id' | 'is_deleted' | 'created_by'> & { creator: DomainCreator | null; _count: { sub_domains: number } }) | null> {
  console.log(`[STUB] Finding domain with creator by ID: ${id}`);
  return null;
}

async function stubUpdateDomain(id: string, data: Partial<Domain>): Promise<Domain | null> {
  console.log(`[STUB] Updating domain ${id} with data:`, data);
  return null;
}

async function stubFindSubDomains(parentDomainId: string): Promise<{ id: string }[]> {
  console.log(`[STUB] Finding sub-domains for parent: ${parentDomainId}`);
  return [];
}

async function stubSoftDeleteDomain(domainId: string, deletedBy: string): Promise<void> {
  console.log(`[STUB] Soft-deleting domain ${domainId} by user ${deletedBy}`);
}

async function stubRestoreDomain(domainId: string): Promise<Domain | null> {
  console.log(`[STUB] Restoring domain: ${domainId}`);
  return null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get domain by ID with full details
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

    // Check if admin wants to include deleted domains
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('include_deleted') === 'true' && payload.role === 'ADMIN';

    const domain = await stubFindDomainById(id, includeDeleted);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Don't show deleted domains unless admin requested
    if (domain.is_deleted && !includeDeleted) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Verify domain belongs to user's organization
    if (domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Get domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update domain
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

    // Only admins and managers can update domains
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if domain exists
    const existing = await stubFindDomainSimple(id);

    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, domain_type, parent_domain_id } = body;

    // If changing parent, recalculate path
    let newPath = existing.path;
    if (parent_domain_id !== undefined && parent_domain_id !== existing.parent_domain_id) {
      if (parent_domain_id === null) {
        newPath = `/${name || existing.name}`;
      } else {
        const parentDomain = await stubFindDomainSimple(parent_domain_id);
        if (parentDomain && parentDomain.org_id === payload.companyId) {
          newPath = `${parentDomain.path || ''}/${name || existing.name}`;
        }
      }
    } else if (name && name !== existing.name && existing.path) {
      // Just update name in path
      const pathParts = existing.path.split('/');
      pathParts[pathParts.length - 1] = name;
      newPath = pathParts.join('/');
    }

    const domain = await stubUpdateDomain(id, {
      ...(name && { name }),
      ...(domain_type !== undefined && { domain_type }),
      ...(parent_domain_id !== undefined && { parent_domain_id }),
      path: newPath
    });

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Update domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Recursively soft-delete domain and all sub-domains
async function softDeleteDomainTree(domainId: string, deletedBy: string): Promise<number> {
  // Get all sub-domains first
  const subDomains = await stubFindSubDomains(domainId);

  let deletedCount = 0;

  // Recursively soft-delete sub-domains
  for (const subDomain of subDomains) {
    deletedCount += await softDeleteDomainTree(subDomain.id, deletedBy);
  }

  // Soft-delete this domain
  await stubSoftDeleteDomain(domainId, deletedBy);

  return deletedCount + 1;
}

// DELETE: Soft-delete domain (only creator/DOMAIN_ADMIN or ORG_ADMIN can delete)
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

    // Check if domain exists
    const existing = await stubFindDomainWithCreator(id);

    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Already deleted?
    if (existing.is_deleted) {
      return NextResponse.json({ error: 'Domain already deleted' }, { status: 400 });
    }

    // Permission check: Only ORG_ADMIN or the creator (DOMAIN_ADMIN) can delete
    const isOrgAdmin = payload.role === 'ADMIN';
    const isCreator = existing.created_by === payload.userId;

    if (!isOrgAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Forbidden - Only the domain creator or organization admin can delete this domain' },
        { status: 403 }
      );
    }

    // Check for cascade deletion confirmation
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get('cascade') === 'true';

    if (existing._count.sub_domains > 0 && !cascade) {
      return NextResponse.json(
        {
          error: 'Domain has sub-domains',
          sub_domain_count: existing._count.sub_domains,
          message: 'Add ?cascade=true to delete this domain and all sub-domains'
        },
        { status: 400 }
      );
    }

    // Soft-delete domain and all sub-domains
    const deletedCount = await softDeleteDomainTree(id, payload.userId);

    return NextResponse.json({
      message: 'Domain soft-deleted successfully',
      deleted_count: deletedCount,
      can_restore: true,
      restore_instructions: 'Contact admin to restore deleted domains'
    });
  } catch (error) {
    console.error('Delete domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Restore soft-deleted domain (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Only admins can restore deleted domains
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'restore') {
      return NextResponse.json({ error: 'Invalid action. Use { "action": "restore" }' }, { status: 400 });
    }

    // Check if domain exists and is deleted
    const existing = await stubFindDomainSimple(id);

    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existing.is_deleted) {
      return NextResponse.json({ error: 'Domain is not deleted' }, { status: 400 });
    }

    // Restore domain
    const domain = await stubRestoreDomain(id);

    return NextResponse.json({
      message: 'Domain restored successfully',
      domain
    });
  } catch (error) {
    console.error('Restore domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
