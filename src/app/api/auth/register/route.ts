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
import { prisma } from '@/lib/db';
import { createUser, generateToken, createSession } from '@/lib/auth';

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
      companyId,        // Legacy: join existing company
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
    const existingUser = await prisma.qUAD_users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    let targetOrgId = companyId;
    let userRole = 'DEVELOPER';
    let isNewOrg = false;

    // FLOW 1: Accept invitation
    if (inviteToken) {
      const invitation = await prisma.qUAD_org_invitations.findUnique({
        where: { invite_token: inviteToken }
      });

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
      await prisma.qUAD_org_invitations.update({
        where: { id: invitation.id },
        data: { accepted_at: new Date() }
      });
    }
    // FLOW 2: Create new organization
    else if (orgName || companyName) {
      const organizationName = orgName || companyName;
      const baseSlug = generateSlug(organizationName);

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.qUAD_organizations.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create new organization
      const organization = await prisma.qUAD_organizations.create({
        data: {
          name: organizationName,
          slug,
          admin_email: email,
        },
      });
      targetOrgId = organization.id;
      userRole = 'OWNER';
      isNewOrg = true;
    }
    // FLOW 3: Legacy - join existing company by ID
    else if (companyId) {
      targetOrgId = companyId;
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
      companyId: targetOrgId,
      email,
      password,
      fullName,
      role: userRole === 'OWNER' ? 'QUAD_ADMIN' : userRole,
    });

    // Add to org_members table (new multi-org tracking)
    await prisma.qUAD_org_members.create({
      data: {
        org_id: targetOrgId,
        user_id: user.id,
        role: userRole,
        is_primary: true, // This is their primary/home org
      }
    });

    // Generate JWT token
    const token = generateToken(user);

    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    await createSession(user.id, token, ipAddress, userAgent);

    // Get organization details
    const organization = await prisma.qUAD_organizations.findUnique({
      where: { id: targetOrgId },
      select: { id: true, name: true, slug: true }
    });

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
