/**
 * GET /api/users/[id] - Get user by ID
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken, hashPassword } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// Type Definitions
// ============================================================================

interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  adoption_matrix: unknown | null;
  domain_members?: DomainMember[];
  workload_metrics?: WorkloadMetric[];
  _count?: {
    flows_assigned: number;
    flows_created: number;
    work_sessions: number;
  };
}

interface DomainMember {
  domain: {
    id: string;
    name: string;
    domain_type: string;
  };
}

interface WorkloadMetric {
  period_start: Date;
}

interface UserUpdateData {
  full_name?: string;
  password_hash?: string;
  role?: string;
  is_active?: boolean;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findUserById(id: string): Promise<User | null> {
  console.log('[STUB] findUserById called with id:', id);
  // TODO: Call Java backend GET /users/{id}
  return null;
}

async function findUserByIdSimple(id: string): Promise<{ id: string; org_id: string } | null> {
  console.log('[STUB] findUserByIdSimple called with id:', id);
  // TODO: Call Java backend GET /users/{id}
  return null;
}

async function updateUser(id: string, data: UserUpdateData): Promise<User | null> {
  console.log('[STUB] updateUser called with id:', id, 'data:', data);
  // TODO: Call Java backend PUT /users/{id}
  return null;
}

async function deleteUser(id: string): Promise<void> {
  console.log('[STUB] deleteUser called with id:', id);
  // TODO: Call Java backend DELETE /users/{id}
}

// ============================================================================
// Route Handlers
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get user by ID
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

    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Users can only view users from their own organization
    if (user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update user
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

    // Users can only update themselves, admins can update anyone in company
    const isOwnProfile = payload.userId === id;
    const isAdmin = payload.role === 'ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user exists and is in same company
    const existing = await findUserByIdSimple(id);

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, password, role, is_active } = body;

    // Build update data
    const updateData: UserUpdateData = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (password) updateData.password_hash = await hashPassword(password);

    // Only admins can change role and active status
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    const user = await updateUser(id, updateData);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user
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

    // Only admins can delete users
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user exists and is in same company
    const existing = await findUserByIdSimple(id);

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent deleting yourself
    if (id === payload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await deleteUser(id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
