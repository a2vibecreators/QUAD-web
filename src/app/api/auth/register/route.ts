/**
 * POST /api/auth/register
 * Register a new user
 *
 * Multi-Org Flow:
 * 1. New signup with orgName → Creates org, user is OWNER
 * 2. Signup with inviteToken → Joins existing org as invited role
 * 3. User can be OWNER of their org and MEMBER of other orgs
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { createUser, generateToken, createSession } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

interface User {
  id: string;
  email: string;
  full_name: string | null;
  org_id: string;
}

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  expires_at: Date;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

async function findUserByEmail(_email: string): Promise<User | null> {
  console.log('[Register] findUserByEmail - stub');
  return null;
}

async function findInvitation(_token: string): Promise<Invitation | null> {
  console.log('[Register] findInvitation - stub');
  return null;
}

async function acceptInvitation(_id: string): Promise<void> {
  console.log('[Register] acceptInvitation - stub');
}

async function findOrgBySlug(_slug: string): Promise<Organization | null> {
  console.log('[Register] findOrgBySlug - stub');
  return null;
}

async function createOrganization(_data: { name: string; slug: string; admin_email: string }): Promise<Organization> {
  console.log('[Register] createOrganization - stub');
  return { id: 'mock-org-id', name: _data.name, slug: _data.slug };
}

async function addOrgMember(_data: { org_id: string; user_id: string; role: string; is_primary: boolean }): Promise<void> {
  console.log('[Register] addOrgMember - stub');
}

async function findOrgById(_id: string): Promise<Organization | null> {
  console.log('[Register] findOrgById - stub');
  return null;
}

// Generate URL-friendly slug from org name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      orgName,          // New: organization name (replaces companyName)
      companyName,      // Legacy: still supported
      orgId,        // Legacy: join existing company
      inviteToken       // New: accept invitation to join org
    } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    let targetOrgId = orgId;
    let userRole = 'DEVELOPER';
    let isNewOrg = false;

    // FLOW 1: Accept invitation
    if (inviteToken) {
      const invitation = await findInvitation(inviteToken);

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      if (invitation.expires_at < new Date()) {
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        );
      }

      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match invitation' },
          { status: 400 }
        );
      }

      targetOrgId = invitation.org_id;
      userRole = invitation.role;

      // Mark invitation as accepted
      await acceptInvitation(invitation.id);
    }
    // FLOW 2: Create new organization
    else if (orgName || companyName) {
      const organizationName = orgName || companyName;
      const baseSlug = generateSlug(organizationName);

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await findOrgBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create new organization
      const organization = await createOrganization({
        name: organizationName,
        slug,
        admin_email: email,
      });
      targetOrgId = organization.id;
      userRole = 'OWNER';
      isNewOrg = true;
    }
    // FLOW 3: Legacy - join existing company by ID
    else if (orgId) {
      targetOrgId = orgId;
      userRole = 'DEVELOPER';
    }
    else {
      return NextResponse.json(
        { error: 'Organization name or invitation is required' },
        { status: 400 }
      );
    }

    // Create user in the organization
    const user = await createUser({
      orgId: targetOrgId,
      email,
      password,
      fullName,
      role: userRole === 'OWNER' ? 'QUAD_ADMIN' : userRole,
    });

    // Add to org_members table (new multi-org tracking)
    await addOrgMember({
      org_id: targetOrgId,
      user_id: user.id,
      role: userRole,
      is_primary: true, // This is their primary/home org
    });

    // Generate JWT token
    const token = generateToken(user);

    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    await createSession(user.id, token, ipAddress, userAgent);

    // Get organization details
    const organization = await findOrgById(targetOrgId);

    // Return token and user info
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: userRole,
        company_id: user.org_id,  // Keep response field name for API compatibility
      },
      organization: {
        id: organization?.id,
        name: organization?.name,
        slug: organization?.slug,
        is_owner: userRole === 'OWNER',
        is_new: isNewOrg
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
