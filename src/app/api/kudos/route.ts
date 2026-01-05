/**
 * GET /api/kudos - Get kudos for current user or team
 * POST /api/kudos - Give kudos to a team member
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Kudos {
  id: string;
  from_user_id: string;
  to_user_id: string;
  org_id: string;
  kudos_type: string;
  message: string | null;
  ticket_id: string | null;
  domain_id: string | null;
  created_at: Date;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  org_id?: string;
}

interface KudosGroupByResult {
  to_user_id: string;
  _count: { id: number };
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function getKudosLeaderboard(orgId: string, startDate: Date): Promise<KudosGroupByResult[]> {
  console.log('[STUB] getKudosLeaderboard called:', { orgId, startDate });
  return [];
}

async function findUsersByIds(userIds: string[]): Promise<User[]> {
  console.log('[STUB] findUsersByIds called:', { userIds });
  return [];
}

async function findKudosByUser(
  userId: string,
  orgId: string,
  view: 'received' | 'given',
  limit: number
): Promise<Kudos[]> {
  console.log('[STUB] findKudosByUser called:', { userId, orgId, view, limit });
  return [];
}

async function countKudosReceived(userId: string, orgId: string): Promise<number> {
  console.log('[STUB] countKudosReceived called:', { userId, orgId });
  return 0;
}

async function countKudosGiven(userId: string, orgId: string): Promise<number> {
  console.log('[STUB] countKudosGiven called:', { userId, orgId });
  return 0;
}

async function findUserByIdAndOrg(userId: string, orgId: string): Promise<User | null> {
  console.log('[STUB] findUserByIdAndOrg called:', { userId, orgId });
  return null;
}

async function createKudos(data: Omit<Kudos, 'id' | 'created_at'>): Promise<Kudos> {
  console.log('[STUB] createKudos called:', data);
  return {
    id: 'stub-id',
    ...data,
    created_at: new Date()
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get kudos
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

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'received'; // received, given, leaderboard
    const limit = parseInt(searchParams.get('limit') || '20');

    if (view === 'leaderboard') {
      // Get kudos leaderboard
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const kudosCounts = await getKudosLeaderboard(payload.companyId, monthStart);

      const userIds = kudosCounts.map(k => k.to_user_id);
      const users = await findUsersByIds(userIds);

      const userMap = new Map(users.map(u => [u.id, u]));

      const leaderboard = kudosCounts.map((k, index) => ({
        rank: index + 1,
        user: userMap.get(k.to_user_id) || { full_name: 'Unknown', email: '' },
        kudos_count: k._count.id
      }));

      return NextResponse.json({
        period: `${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        leaderboard
      });
    }

    // Get kudos received or given
    const kudos = await findKudosByUser(
      payload.userId,
      payload.companyId,
      view as 'received' | 'given',
      limit
    );

    // Get user details
    const userIds = [...new Set([
      ...kudos.map(k => k.from_user_id),
      ...kudos.map(k => k.to_user_id)
    ])];

    const users = await findUsersByIds(userIds);

    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedKudos = kudos.map(k => ({
      ...k,
      from_user: userMap.get(k.from_user_id) || { full_name: 'Unknown', email: '' },
      to_user: userMap.get(k.to_user_id) || { full_name: 'Unknown', email: '' }
    }));

    // Get summary stats
    const totalReceived = await countKudosReceived(payload.userId, payload.companyId);
    const totalGiven = await countKudosGiven(payload.userId, payload.companyId);

    return NextResponse.json({
      view,
      kudos: enrichedKudos,
      stats: {
        total_received: totalReceived,
        total_given: totalGiven
      }
    });

  } catch (error) {
    console.error('Get kudos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Give kudos
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
    const { to_user_id, kudos_type, message, ticket_id, domain_id } = body;

    if (!to_user_id || !kudos_type) {
      return NextResponse.json(
        { error: 'to_user_id and kudos_type are required' },
        { status: 400 }
      );
    }

    // Prevent self-kudos
    if (to_user_id === payload.userId) {
      return NextResponse.json(
        { error: 'Cannot give kudos to yourself' },
        { status: 400 }
      );
    }

    // Validate kudos type
    const validTypes = ['appreciation', 'help', 'mentoring', 'teamwork', 'innovation'];
    if (!validTypes.includes(kudos_type)) {
      return NextResponse.json(
        { error: `Invalid kudos_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify recipient exists in org
    const recipient = await findUserByIdAndOrg(to_user_id, payload.companyId);

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const kudos = await createKudos({
      from_user_id: payload.userId,
      to_user_id,
      org_id: payload.companyId,
      kudos_type,
      message,
      ticket_id,
      domain_id
    });

    return NextResponse.json({
      message: 'Kudos sent successfully!',
      kudos
    }, { status: 201 });

  } catch (error) {
    console.error('Create kudos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
