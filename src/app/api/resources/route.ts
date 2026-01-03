/**
 * GET /api/resources - List domain resources
 * POST /api/resources - Create a new resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (resourceType) where.resource_type = resourceType;
    if (resourceStatus) where.resource_status = resourceStatus;

    const resources = await prisma.qUAD_domain_resources.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        attributes: true
      },
      orderBy: [
        { domain_id: 'asc' },
        { resource_type: 'asc' },
        { resource_name: 'asc' }
      ]
    });

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
    const domain = await prisma.qUAD_domains.findUnique({
      where: { id: domain_id }
    });

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Create resource with optional attributes (EAV pattern)
    const resource = await prisma.qUAD_domain_resources.create({
      data: {
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
      include: {
        domain: { select: { id: true, name: true } },
        attributes: true
      }
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
