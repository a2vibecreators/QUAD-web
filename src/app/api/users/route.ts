/**
 * GET /api/users - List users in organization
 * POST /api/users - Create a new user (admin only)
 *
 * MIGRATED: Now uses Java backend API via java-backend.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserByEmail, createUser } from '@/lib/java-backend';
import { verifyToken, hashPassword } from '@/lib/auth';

// GET: List users in organization
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

    // Get users from Java backend filtered by org
    const users = await getUsers(payload.orgId);

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
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    } catch {
      // User not found - OK to create
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user via Java backend
    const user = await createUser({
      orgId: payload.orgId,
      email,
      passwordHash: password_hash,
      fullName: full_name,
      role: role || 'DEVELOPER',
      isActive: true
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
