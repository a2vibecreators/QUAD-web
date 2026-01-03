/**
 * GET /api/organizations - List user's organizations
 * POST /api/organizations - Create a new organization
 *
 * Multi-Org Support:
 * - User can be OWNER of their own org
 * - User can be MEMBER of other orgs (invited)
 * - Returns all orgs user belongs to with their role in each
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// GET: List all organizations user belongs to
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all org memberships for user
    const memberships = await prisma.qUAD_org_members.findMany({
      where: {
        user_id: payload.userId,
        is_active: true
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            admin_email: true,
            size: true,
            is_active: true,
            created_at: true,
            _count: {
              select: {
                users: true,
                domains: true
              }
            }
          }
        }
      },
      orderBy: [
        { is_primary: 'desc' }, // Primary org first
        { joined_at: 'asc' }
      ]
    });

    // Transform to org list with user's role
    const organizations = memberships.map(m => ({
      ...m.organization,
      role: m.role,
      is_primary: m.is_primary,
      joined_at: m.joined_at
    }));

    // Find current/active org (primary or first one)
    const currentOrg = organizations.find(o => o.is_primary) || organizations[0];

    return NextResponse.json({
      organizations,
      current_organization: currentOrg,
      total: organizations.length
    });
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
    const { name, size } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Get user's email for admin_email
    const user = await prisma.qUAD_users.findUnique({
      where: { id: payload.userId },
      select: { email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.qUAD_organizations.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const organization = await prisma.qUAD_organizations.create({
      data: {
        name,
        slug,
        admin_email: user.email,
        size: size || 'medium'
      }
    });

    // Add user as OWNER
    await prisma.qUAD_org_members.create({
      data: {
        org_id: organization.id,
        user_id: payload.userId,
        role: 'OWNER',
        is_primary: false // Not primary since they already have a primary org
      }
    });

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: 'OWNER'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
