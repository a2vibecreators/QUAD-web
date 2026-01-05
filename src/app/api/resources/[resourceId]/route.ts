/**
 * GET /api/resources/[resourceId] - Get resource by ID
 * PUT /api/resources/[resourceId] - Update resource
 * DELETE /api/resources/[resourceId] - Delete resource
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
  domain: Domain;
  attributes: ResourceAttribute[];
}

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

// Stub functions for database operations
async function findUniqueResource(id: string, include?: Record<string, unknown>): Promise<DomainResource | null> {
  console.log('[STUB] findUniqueResource called with:', { id, include });
  return null;
}

async function updateResource(id: string, data: Record<string, unknown>, include?: Record<string, unknown>): Promise<DomainResource> {
  console.log('[STUB] updateResource called with:', { id, data, include });
  return {
    id,
    domain_id: 'stub-domain-id',
    resource_type: 'git_repo',
    resource_name: 'Stub Resource',
    resource_status: 'active',
    created_by: null,
    domain: { id: 'stub-domain-id', name: 'Stub Domain', org_id: 'stub-org-id' },
    attributes: []
  };
}

async function upsertResourceAttribute(
  resourceId: string,
  attributeName: string,
  attributeValue: string
): Promise<ResourceAttribute> {
  console.log('[STUB] upsertResourceAttribute called with:', { resourceId, attributeName, attributeValue });
  return {
    id: 'stub-attribute-id',
    resource_id: resourceId,
    attribute_name: attributeName,
    attribute_value: attributeValue
  };
}

async function deleteResource(id: string): Promise<void> {
  console.log('[STUB] deleteResource called with id:', id);
}

// GET: Get resource by ID with attributes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

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

    const resource = await findUniqueResource(resourceId, {
      domain: {
        select: { id: true, name: true, org_id: true }
      },
      attributes: true
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Verify resource belongs to user's organization
    if (resource.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Convert attributes array to key-value object for convenience
    const attributesMap: Record<string, string> = {};
    resource.attributes.forEach(attr => {
      attributesMap[attr.attribute_name] = attr.attribute_value || '';
    });

    return NextResponse.json({
      ...resource,
      attributes_map: attributesMap
    });
  } catch (error) {
    console.error('Get resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update resource
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

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

    // Only admins and managers can update resources
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await findUniqueResource(resourceId, {
      domain: { select: { org_id: true } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { resource_name, resource_status, attributes } = body;

    // Update resource
    const resource = await updateResource(
      resourceId,
      {
        ...(resource_name !== undefined && { resource_name }),
        ...(resource_status !== undefined && { resource_status })
      },
      {
        domain: { select: { id: true, name: true } },
        attributes: true
      }
    );

    // Handle attributes updates (EAV pattern)
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (!attr.name) continue;

        // Upsert each attribute
        await upsertResourceAttribute(resourceId, attr.name, attr.value);
      }

      // Refresh to get updated attributes
      const updated = await findUniqueResource(resourceId, {
        domain: { select: { id: true, name: true } },
        attributes: true
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete resource
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { resourceId } = await params;

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

    // Only admins can delete resources
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await findUniqueResource(resourceId, {
      domain: { select: { org_id: true } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete resource (cascade will delete attributes)
    await deleteResource(resourceId);

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
