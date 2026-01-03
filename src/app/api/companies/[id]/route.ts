/**
 * GET /api/companies/[id] - Get organization by ID (legacy endpoint)
 * PUT /api/companies/[id] - Update organization (legacy endpoint)
 * DELETE /api/companies/[id] - Delete organization (legacy endpoint)
 *
 * NOTE: This is a legacy endpoint. Use /api/organizations instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const organization = await prisma.qUAD_organizations.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            is_active: true
          }
        },
        domains: {
          select: {
            id: true,
            name: true,
            domain_type: true
          }
        },
        _count: {
          select: { users: true, domains: true }
        }
      }
    });

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
    const existing = await prisma.qUAD_organizations.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization
    const organization = await prisma.qUAD_organizations.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(size && { size })
      }
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
    const existing = await prisma.qUAD_organizations.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete organization (cascade will delete users, domains, etc.)
    await prisma.qUAD_organizations.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
