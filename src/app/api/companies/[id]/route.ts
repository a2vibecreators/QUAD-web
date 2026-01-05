/**
 * GET /api/companies/[id] - Get organization by ID (legacy endpoint)
 * PUT /api/companies/[id] - Update organization (legacy endpoint)
 * DELETE /api/companies/[id] - Delete organization (legacy endpoint)
 *
 * NOTE: This is a legacy endpoint. Use /api/organizations instead.
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Organization {
  id: string;
  name: string;
  size: string | null;
  users?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  }[];
  domains?: {
    id: string;
    name: string;
    domain_type: string | null;
  }[];
  _count?: {
    users: number;
    domains: number;
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Stub Functions
// ============================================================================

async function findOrganizationById(id: string): Promise<Organization | null> {
  console.log('[STUB] findOrganizationById called with:', id);
  // TODO: Implement via Java backend GET /organizations/{id}
  return null;
}

async function findOrganizationWithRelations(id: string): Promise<Organization | null> {
  console.log('[STUB] findOrganizationWithRelations called with:', id);
  // TODO: Implement via Java backend GET /organizations/{id}?include=users,domains
  return null;
}

async function updateOrganization(id: string, data: { name?: string; size?: string }): Promise<Organization> {
  console.log('[STUB] updateOrganization called with:', id, JSON.stringify(data));
  // TODO: Implement via Java backend PUT /organizations/{id}
  return {
    id,
    name: data.name || 'Stub Organization',
    size: data.size || null,
  };
}

async function deleteOrganization(id: string): Promise<void> {
  console.log('[STUB] deleteOrganization called with:', id);
  // TODO: Implement via Java backend DELETE /organizations/{id}
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get organization by ID
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

    // Non-admins can only view their own organization
    if (payload.role !== 'ADMIN' && payload.companyId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await findOrganizationWithRelations(id);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update organization
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

    // Only admins can update organizations
    if (payload.role !== 'ADMIN' && payload.companyId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, size } = body;

    // Check if organization exists
    const existing = await findOrganizationById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization
    const organization = await updateOrganization(id, {
      ...(name && { name }),
      ...(size && { size })
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete organization
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

    // Only admins can delete organizations
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if organization exists
    const existing = await findOrganizationById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete organization (cascade will delete users, domains, etc.)
    await deleteOrganization(id);

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
