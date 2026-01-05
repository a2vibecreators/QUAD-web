/**
 * POST /api/organizations/[id]/invite - Invite user to organization
 * GET /api/organizations/[id]/invite - List pending invitations
 *
 * Only OWNER and ADMIN can invite users
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface OrgMember {
  org_id: string;
  user_id: string;
  role: string;
}

interface User {
  id: string;
  email: string;
}

interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  invited_by: string;
  invite_token: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
  organization?: {
    name: string;
    slug: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

// Generate secure invite token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// Stub Functions
// ============================================================================

async function findOrgMember(orgId: string, userId: string): Promise<OrgMember | null> {
  console.log('[STUB] findOrgMember called with:', orgId, userId);
  // TODO: Implement via Java backend GET /org-members?org_id={orgId}&user_id={userId}
  return null;
}

async function findUserByEmail(email: string): Promise<User | null> {
  console.log('[STUB] findUserByEmail called with:', email);
  // TODO: Implement via Java backend GET /users?email={email}
  return null;
}

async function findOrgMemberByOrgAndUser(orgId: string, userId: string): Promise<OrgMember | null> {
  console.log('[STUB] findOrgMemberByOrgAndUser called with:', orgId, userId);
  // TODO: Implement via Java backend GET /org-members?org_id={orgId}&user_id={userId}
  return null;
}

async function findPendingInvitation(orgId: string, email: string): Promise<OrgInvitation | null> {
  console.log('[STUB] findPendingInvitation called with:', orgId, email);
  // TODO: Implement via Java backend GET /org-invitations?org_id={orgId}&email={email}&status=pending
  return null;
}

async function createInvitation(data: {
  org_id: string;
  email: string;
  role: string;
  invited_by: string;
  invite_token: string;
  expires_at: Date;
}): Promise<OrgInvitation> {
  console.log('[STUB] createInvitation called with:', JSON.stringify(data));
  // TODO: Implement via Java backend POST /org-invitations
  return {
    id: 'stub-invitation-id',
    org_id: data.org_id,
    email: data.email,
    role: data.role,
    invited_by: data.invited_by,
    invite_token: data.invite_token,
    expires_at: data.expires_at,
    accepted_at: null,
    created_at: new Date(),
    organization: {
      name: 'Stub Organization',
      slug: 'stub-org',
    },
  };
}

async function findPendingInvitations(orgId: string): Promise<OrgInvitation[]> {
  console.log('[STUB] findPendingInvitations called with:', orgId);
  // TODO: Implement via Java backend GET /org-invitations?org_id={orgId}&status=pending
  return [];
}

// ============================================================================
// Route Handlers
// ============================================================================

// POST: Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is OWNER or ADMIN of this org
    const membership = await findOrgMember(orgId, payload.userId);

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can invite users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'DEVELOPER'];
    const inviteRole = role || 'DEVELOPER';
    if (!validRoles.includes(inviteRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, MANAGER, or DEVELOPER' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      const existingMembership = await findOrgMemberByOrgAndUser(orgId, existingUser.id);

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvite = await findPendingInvitation(orgId, email.toLowerCase());

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 409 }
      );
    }

    // Create invitation (expires in 7 days)
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await createInvitation({
      org_id: orgId,
      email: email.toLowerCase(),
      role: inviteRole,
      invited_by: payload.userId,
      invite_token: inviteToken,
      expires_at: expiresAt
    });

    // TODO: Send email with invitation link
    // For now, return the invite link that would be emailed
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dev.quadframe.work'}/invite/${inviteToken}`;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        organization: invitation.organization
      },
      invite_link: inviteLink
    }, { status: 201 });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: List pending invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is member of this org
    const membership = await findOrgMember(orgId, payload.userId);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const invitations = await findPendingInvitations(orgId);

    return NextResponse.json({
      invitations,
      total: invitations.length
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
