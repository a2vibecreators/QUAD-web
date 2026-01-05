/**
 * GET /api/resources - List domain resources
 * POST /api/resources - Create a new resource
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

interface ResourceAttribute {
  id: string;
  resource_id: string;
  attribute_name: string;
  attribute_value: string | null;
}

interface DomainResource {
  id: string;
  domain_id: string;
  resource_type: string;
  resource_name: string;
  resource_status: string;
  created_by: string | null;
  domain?: Partial<Domain>;
  attributes: ResourceAttribute[];
}

// Stub functions for database operations
async function findManyDomains(where: Record<string, unknown>): Promise<{ id: string }[]> {
  console.log('[STUB] findManyDomains called with:', where);
  return [];
}

async function findManyResources(where: Record<string, unknown>, include?: Record<string, unknown>, orderBy?: unknown[]): Promise<DomainResource[]> {
  console.log('[STUB] findManyResources called with:', { where, include, orderBy });
  return [];
}

async function findUniqueDomain(id: string): Promise<Domain | null> {
  console.log('[STUB] findUniqueDomain called with id:', id);
  return null;
}

async function createResource(data: Record<string, unknown>, include?: Record<string, unknown>): Promise<DomainResource> {
  console.log('[STUB] createResource called with:', { data, include });
  return {
    id: 'stub-resource-id',
    domain_id: data.domain_id as string,
    resource_type: data.resource_type as string,
    resource_name: data.resource_name as string,
    resource_status: data.resource_status as string || 'pending_setup',
    created_by: data.created_by as string | null,
    attributes: []
  };
}

// GET: List domain resources
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
    const resourceType = searchParams.get('resource_type');
    const resourceStatus = searchParams.get('resource_status');

    // Get organization's domains
    const orgDomains = await findManyDomains({ org_id: payload.companyId });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (resourceType) where.resource_type = resourceType;
    if (resourceStatus) where.resource_status = resourceStatus;

    const resources = await findManyResources(
      where,
      {
        domain: {
          select: { id: true, name: true }
        },
        attributes: true
      },
      [
        { domain_id: 'asc' },
        { resource_type: 'asc' },
        { resource_name: 'asc' }
      ]
    );

    // Group by type
    const byType: Record<string, typeof resources> = {};
    resources.forEach(r => {
      if (!byType[r.resource_type]) {
        byType[r.resource_type] = [];
      }
      byType[r.resource_type].push(r);
    });

    return NextResponse.json({
      resources,
      by_type: byType,
      total: resources.length
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new resource
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

    // Only admins and managers can create resources
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { domain_id, resource_type, resource_name, resource_status, attributes } = body;

    // Validation
    if (!domain_id || !resource_type || !resource_name) {
      return NextResponse.json(
        { error: 'domain_id, resource_type, and resource_name are required' },
        { status: 400 }
      );
    }

    // Verify domain exists and belongs to user's company
    const domain = await findUniqueDomain(domain_id);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Create resource with optional attributes (EAV pattern)
    const resource = await createResource(
      {
        domain_id,
        resource_type,
        resource_name,
        resource_status: resource_status || 'pending_setup',
        created_by: payload.userId,
        // Create attributes if provided
        attributes: attributes && Array.isArray(attributes) ? {
          create: attributes.map((attr: { name: string; value: string }) => ({
            attribute_name: attr.name,
            attribute_value: attr.value
          }))
        } : undefined
      },
      {
        domain: { select: { id: true, name: true } },
        attributes: true
      }
    );

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
