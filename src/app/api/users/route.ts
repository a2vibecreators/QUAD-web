/**
 * GET /api/users - List users in company
 * POST /api/users - Create a new user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

// GET: List users in company
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
    const role = searchParams.get('role');
    const isActive = searchParams.get('is_active');

    // Build where clause
    const where: Record<string, unknown> = {
      org_id: payload.companyId
    };

    if (role) {
      where.role = role;
    }

    if (isActive !== null) {
      where.is_active = isActive === 'true';
    }

    const users = await prisma.qUAD_users.findMany({
      where,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        adoption_matrix: {
          select: {
            skill_level: true,
            trust_level: true
          }
        },
        _count: {
          select: {
            domain_members: true,
            flows_assigned: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new user (admin only)
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

    // Only admins and managers can create users
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user with email exists
    const existing = await prisma.qUAD_users.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await prisma.qUAD_users.create({
      data: {
        org_id: payload.companyId,
        email,
        password_hash,
        full_name,
        role: role || 'DEVELOPER'
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
