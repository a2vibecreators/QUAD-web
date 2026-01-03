/**
 * GET /api/organizations - List user's organizations
 * POST /api/organizations - Create a new organization
 *
 * MIGRATED: Now uses Java backend API via java-backend.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizations, createOrganization, getUserById } from '@/lib/java-backend';
import { verifyToken } from '@/lib/auth';

// Generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// GET: List all organizations
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

    // Get all organizations from Java backend
    const organizations = await getOrganizations();

    // Filter to user's organization (for now, single org per user)
    const userOrgs = organizations.filter((o: { id: string }) => o.id === payload.companyId);

    return NextResponse.json({
      organizations: userOrgs,
      current_organization: userOrgs[0] || null,
      total: userOrgs.length
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
    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate slug
    const slug = generateSlug(name);

    // Create organization via Java backend
    const organization = await createOrganization({
      name,
      slug,
      adminEmail: user.email,
      size: size || 'medium',
      isActive: true
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
