/**
 * GET /api/tickets/[id]/comments - List comments for a ticket
 * POST /api/tickets/[id]/comments - Add a comment to a ticket
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  created_at: Date;
  user?: User;
}

interface TicketWithDomain {
  id: string;
  domain: {
    org_id: string;
  };
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function stubFindTicketById(ticketId: string): Promise<TicketWithDomain | null> {
  console.log('[STUB] prisma.qUAD_tickets.findUnique called with id:', ticketId);
  return null;
}

async function stubFindCommentsByTicketId(ticketId: string): Promise<Comment[]> {
  console.log('[STUB] prisma.qUAD_ticket_comments.findMany called with ticket_id:', ticketId);
  return [];
}

async function stubFindUsersByIds(userIds: string[]): Promise<User[]> {
  console.log('[STUB] prisma.qUAD_users.findMany called with ids:', userIds);
  return [];
}

async function stubCreateComment(data: { ticket_id: string; user_id: string; content: string; is_ai: boolean }): Promise<Comment> {
  console.log('[STUB] prisma.qUAD_ticket_comments.create called with data:', JSON.stringify(data));
  return {
    id: 'stub-comment-id',
    ticket_id: data.ticket_id,
    user_id: data.user_id,
    content: data.content,
    is_ai: data.is_ai,
    created_at: new Date(),
  };
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log('[STUB] prisma.qUAD_users.findUnique called with id:', userId);
  return null;
}

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
    const ticket = await stubFindTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const comments = await stubFindCommentsByTicketId(ticketId);

    // Fetch user details for each comment
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const users = await stubFindUsersByIds(userIds);
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
    const ticket = await stubFindTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.domain.org_id !== payload.orgId) {
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

    const comment = await stubCreateComment({
      ticket_id: ticketId,
      user_id: payload.userId,
      content: content.trim(),
      is_ai: is_ai || false
    });

    // Get user details
    const user = await stubFindUserById(payload.userId);

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
