/**
 * GET /api/kudos - Get kudos for current user or team
 * POST /api/kudos - Give kudos to a team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

      const kudosCounts = await prisma.qUAD_kudos.groupBy({
        by: ['to_user_id'],
        where: {
          org_id: payload.companyId,
          created_at: { gte: monthStart }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      const userIds = kudosCounts.map(k => k.to_user_id);
      const users = await prisma.qUAD_users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, full_name: true, email: true }
      });

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
    const whereClause = view === 'received'
      ? { to_user_id: payload.userId, org_id: payload.companyId }
      : { from_user_id: payload.userId, org_id: payload.companyId };

    const kudos = await prisma.qUAD_kudos.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limit
    });

    // Get user details
    const userIds = [...new Set([
      ...kudos.map(k => k.from_user_id),
      ...kudos.map(k => k.to_user_id)
    ])];

    const users = await prisma.qUAD_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true, email: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedKudos = kudos.map(k => ({
      ...k,
      from_user: userMap.get(k.from_user_id) || { full_name: 'Unknown', email: '' },
      to_user: userMap.get(k.to_user_id) || { full_name: 'Unknown', email: '' }
    }));

    // Get summary stats
    const totalReceived = await prisma.qUAD_kudos.count({
      where: { to_user_id: payload.userId, org_id: payload.companyId }
    });

    const totalGiven = await prisma.qUAD_kudos.count({
      where: { from_user_id: payload.userId, org_id: payload.companyId }
    });

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
    const recipient = await prisma.qUAD_users.findFirst({
      where: { id: to_user_id, org_id: payload.companyId }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const kudos = await prisma.qUAD_kudos.create({
      data: {
        from_user_id: payload.userId,
        to_user_id,
        org_id: payload.companyId,
        kudos_type,
        message,
        ticket_id,
        domain_id
      }
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
