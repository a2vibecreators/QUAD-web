/**
 * GET /api/resources/[resourceId] - Get resource by ID
 * PUT /api/resources/[resourceId] - Update resource
 * DELETE /api/resources/[resourceId] - Delete resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ resourceId: string }>;
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

    const resource = await prisma.qUAD_domain_resources.findUnique({
      where: { id: resourceId },
      include: {
        domain: {
          select: { id: true, name: true, org_id: true }
        },
        attributes: true
      }
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

    const existing = await prisma.qUAD_domain_resources.findUnique({
      where: { id: resourceId },
      include: {
        domain: { select: { org_id: true } }
      }
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
    const resource = await prisma.qUAD_domain_resources.update({
      where: { id: resourceId },
      data: {
        ...(resource_name !== undefined && { resource_name }),
        ...(resource_status !== undefined && { resource_status })
      },
      include: {
        domain: { select: { id: true, name: true } },
        attributes: true
      }
    });

    // Handle attributes updates (EAV pattern)
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (!attr.name) continue;

        // Upsert each attribute
        await prisma.qUAD_resource_attributes.upsert({
          where: {
            resource_id_attribute_name: {
              resource_id: resourceId,
              attribute_name: attr.name
            }
          },
          update: {
            attribute_value: attr.value
          },
          create: {
            resource_id: resourceId,
            attribute_name: attr.name,
            attribute_value: attr.value
          }
        });
      }

      // Refresh to get updated attributes
      const updated = await prisma.qUAD_domain_resources.findUnique({
        where: { id: resourceId },
        include: {
          domain: { select: { id: true, name: true } },
          attributes: true
        }
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

    const existing = await prisma.qUAD_domain_resources.findUnique({
      where: { id: resourceId },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete resource (cascade will delete attributes)
    await prisma.qUAD_domain_resources.delete({
      where: { id: resourceId }
    });

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
