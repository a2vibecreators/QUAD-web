/**
 * GET /api/companies - List all organizations (legacy endpoint)
 * POST /api/companies - Create a new organization (legacy endpoint)
 *
 * NOTE: This is a legacy endpoint. Use /api/organizations instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: List all organizations (admin only)
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

    // Check if user is admin
    if (payload.role !== 'ADMIN') {
      // Non-admins can only see their own organization
      const organization = await prisma.qUAD_organizations.findUnique({
        where: { id: payload.companyId },
        include: {
          _count: {
            select: { users: true, domains: true }
          }
        }
      });

      return NextResponse.json({ companies: organization ? [organization] : [] });
    }

    // Admins can see all organizations
    const organizations = await prisma.qUAD_organizations.findMany({
      include: {
        _count: {
          select: { users: true, domains: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ companies: organizations });
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, admin_email, size } = body;

    // Validation
    if (!name || !admin_email) {
      return NextResponse.json(
        { error: 'Name and admin_email are required' },
        { status: 400 }
      );
    }

    // Note: admin_email is not unique - sub-orgs can share admin
    // Check for duplicate organization name instead
    const existing = await prisma.qUAD_organizations.findFirst({
      where: { name, admin_email }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Organization with this name and admin email already exists' },
        { status: 409 }
      );
    }

    // Create organization
    const organization = await prisma.qUAD_organizations.create({
      data: {
        name,
        admin_email,
        size: size || 'medium'
      }
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Create organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
