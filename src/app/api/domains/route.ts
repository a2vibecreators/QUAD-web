/**
 * GET /api/domains - List domains in organization
 * POST /api/domains - Create a new domain
 *
 * MIGRATED: Now uses Java backend API via java-backend.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDomains, getDomainById, createDomain } from '@/lib/java-backend';
import { verifyToken } from '@/lib/auth';

// GET: List domains in organization
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

    // Get domains from Java backend filtered by org
    const domains = await getDomains(payload.orgId);

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Get domains error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new domain
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

    // Only admins and managers can create domains
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, parent_domain_id, domain_type, description } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // If parent_domain_id provided, verify it exists
    if (parent_domain_id) {
      const parentDomain = await getDomainById(parent_domain_id);
      if (!parentDomain || parentDomain.orgId !== payload.orgId) {
        return NextResponse.json(
          { error: 'Parent domain not found' },
          { status: 404 }
        );
      }
    }

    // Build path for hierarchical navigation
    let path = `/${name}`;
    if (parent_domain_id) {
      const parentDomain = await getDomainById(parent_domain_id);
      if (parentDomain) {
        path = `${parentDomain.path || ''}/${name}`;
      }
    }

    // Create domain via Java backend
    const domain = await createDomain({
      orgId: payload.orgId,
      name,
      parentDomainId: parent_domain_id || null,
      domainType: domain_type || 'PROJECT',
      path,
      description: description || null,
      createdBy: payload.userId,
      isDeleted: false
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error('Create domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
