/**
 * GET /api/tickets/[id]/time-logs - List time logs for a ticket
 * POST /api/tickets/[id]/time-logs - Log time on a ticket
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

interface TimeLog {
  id: string;
  ticket_id: string;
  user_id: string;
  hours: number;
  description: string | null;
  logged_date: Date;
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

async function stubFindTimeLogsByTicketId(ticketId: string): Promise<TimeLog[]> {
  console.log('[STUB] prisma.qUAD_ticket_time_logs.findMany called with ticket_id:', ticketId);
  return [];
}

async function stubFindUsersByIds(userIds: string[]): Promise<User[]> {
  console.log('[STUB] prisma.qUAD_users.findMany called with ids:', userIds);
  return [];
}

async function stubCreateTimeLog(data: { ticket_id: string; user_id: string; hours: number; description: string | null; logged_date: Date }): Promise<TimeLog> {
  console.log('[STUB] prisma.qUAD_ticket_time_logs.create called with data:', JSON.stringify(data));
  return {
    id: 'stub-time-log-id',
    ticket_id: data.ticket_id,
    user_id: data.user_id,
    hours: data.hours,
    description: data.description,
    logged_date: data.logged_date,
  };
}

async function stubUpdateTicketActualHours(ticketId: string, totalHours: number): Promise<void> {
  console.log('[STUB] prisma.qUAD_tickets.update called with id:', ticketId, 'actual_hours:', totalHours);
}

async function stubFindUserById(userId: string): Promise<User | null> {
  console.log('[STUB] prisma.qUAD_users.findUnique called with id:', userId);
  return null;
}

// GET: List time logs for a ticket
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

    if (ticket.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const timeLogs = await stubFindTimeLogsByTicketId(ticketId);

    // Fetch user details for each log
    const userIds = [...new Set(timeLogs.map(t => t.user_id))];
    const users = await stubFindUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    const logsWithUsers = timeLogs.map(log => ({
      ...log,
      user: userMap.get(log.user_id) || { email: 'Unknown', full_name: 'Unknown User' }
    }));

    // Calculate totals
    const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0);
    const totalByUser: Record<string, number> = {};
    timeLogs.forEach(log => {
      totalByUser[log.user_id] = (totalByUser[log.user_id] || 0) + Number(log.hours);
    });

    return NextResponse.json({
      time_logs: logsWithUsers,
      total_hours: totalHours,
      total_by_user: Object.entries(totalByUser).map(([userId, hours]) => ({
        user_id: userId,
        user: userMap.get(userId),
        hours
      })),
      total: timeLogs.length
    });
  } catch (error) {
    console.error('Get time logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Log time on a ticket
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

    if (ticket.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const { hours, description, logged_date } = body;

    // Validation
    if (!hours || hours <= 0) {
      return NextResponse.json(
        { error: 'Hours must be greater than 0' },
        { status: 400 }
      );
    }

    if (hours > 24) {
      return NextResponse.json(
        { error: 'Cannot log more than 24 hours per entry' },
        { status: 400 }
      );
    }

    const timeLog = await stubCreateTimeLog({
      ticket_id: ticketId,
      user_id: payload.userId,
      hours,
      description,
      logged_date: logged_date ? new Date(logged_date) : new Date()
    });

    // Update ticket's actual_hours
    const allLogs = await stubFindTimeLogsByTicketId(ticketId);
    const totalHours = allLogs.reduce((sum, log) => sum + Number(log.hours), 0) + hours;

    await stubUpdateTicketActualHours(ticketId, totalHours);

    // Get user details
    const user = await stubFindUserById(payload.userId);

    return NextResponse.json({
      ...timeLog,
      user,
      ticket_total_hours: totalHours
    }, { status: 201 });
  } catch (error) {
    console.error('Log time error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
