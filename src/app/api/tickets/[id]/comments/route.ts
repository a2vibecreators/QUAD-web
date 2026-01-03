/**
 * GET /api/tickets/[id]/comments - List comments for a ticket
 * POST /api/tickets/[id]/comments - Add a comment to a ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: List comments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

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

    // Verify ticket exists and belongs to user's organization
    const ticket = await prisma.qUAD_tickets.findUnique({
      where: { id: ticketId },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const comments = await prisma.qUAD_ticket_comments.findMany({
      where: { ticket_id: ticketId },
      orderBy: { created_at: 'asc' }
    });

    // Fetch user details for each comment
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const users = await prisma.qUAD_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, full_name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const commentsWithUsers = comments.map(comment => ({
      ...comment,
      user: userMap.get(comment.user_id) || { email: 'Unknown', full_name: 'Unknown User' }
    }));

    return NextResponse.json({
      comments: commentsWithUsers,
      total: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

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

    // Verify ticket exists and belongs to user's organization
    const ticket = await prisma.qUAD_tickets.findUnique({
      where: { id: ticketId },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, is_ai } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.qUAD_ticket_comments.create({
      data: {
        ticket_id: ticketId,
        user_id: payload.userId,
        content: content.trim(),
        is_ai: is_ai || false
      }
    });

    // Get user details
    const user = await prisma.qUAD_users.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, full_name: true }
    });

    return NextResponse.json({
      ...comment,
      user
    }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
