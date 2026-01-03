/**
 * POST /api/organizations/[id]/invite - Invite user to organization
 * GET /api/organizations/[id]/invite - List pending invitations
 *
 * Only OWNER and ADMIN can invite users
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

// Generate secure invite token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

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
    const membership = await prisma.qUAD_org_members.findUnique({
      where: {
        org_id_user_id: {
          org_id: orgId,
          user_id: payload.userId
        }
      }
    });

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
    const existingUser = await prisma.qUAD_users.findUnique({
      where: { email }
    });

    if (existingUser) {
      const existingMembership = await prisma.qUAD_org_members.findUnique({
        where: {
          org_id_user_id: {
            org_id: orgId,
            user_id: existingUser.id
          }
        }
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.qUAD_org_invitations.findFirst({
      where: {
        org_id: orgId,
        email: email.toLowerCase(),
        accepted_at: null,
        expires_at: { gt: new Date() }
      }
    });

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

    const invitation = await prisma.qUAD_org_invitations.create({
      data: {
        org_id: orgId,
        email: email.toLowerCase(),
        role: inviteRole,
        invited_by: payload.userId,
        invite_token: inviteToken,
        expires_at: expiresAt
      },
      include: {
        organization: {
          select: { name: true, slug: true }
        }
      }
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
    const membership = await prisma.qUAD_org_members.findUnique({
      where: {
        org_id_user_id: {
          org_id: orgId,
          user_id: payload.userId
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const invitations = await prisma.qUAD_org_invitations.findMany({
      where: {
        org_id: orgId,
        accepted_at: null,
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

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
