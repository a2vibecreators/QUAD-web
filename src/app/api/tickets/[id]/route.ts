/**
 * GET /api/tickets/[id] - Get single ticket with full details
 * PUT /api/tickets/[id] - Update ticket
 * DELETE /api/tickets/[id] - Delete ticket
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Domain {
  id: string;
  name: string;
  ticket_prefix: string | null;
  org_id: string;
}

interface Cycle {
  id: string;
  name: string;
  cycle_number: number;
  status: string;
}

interface ParentTicket {
  id: string;
  ticket_number: string;
  title: string;
}

interface Subtask {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  assigned_to: string | null;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  created_at: Date;
}

interface TimeLog {
  id: string;
  ticket_id: string;
  user_id: string;
  hours: number;
  description: string | null;
  logged_date: Date;
}

interface PullRequest {
  id: string;
  pr_number: number;
  title: string;
  state: string;
  pr_url: string;
}

interface Ticket {
  id: string;
  domain_id: string;
  cycle_id: string | null;
  parent_ticket_id: string | null;
  ticket_number: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  ticket_type: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  reporter_id: string;
  story_points: number | null;
  due_date: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  branch_name: string | null;
  ai_implementation_plan: string | null;
  ai_suggested_files: string[] | null;
  created_at: Date;
  domain: Domain;
  cycle?: Cycle | null;
  parent_ticket?: ParentTicket | null;
  subtasks: Subtask[];
  comments: Comment[];
  time_logs: TimeLog[];
  pull_request?: PullRequest | null;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function stubFindTicketById(ticketId: string): Promise<Ticket | null> {
  console.log('[STUB] prisma.qUAD_tickets.findUnique called with id:', ticketId);
  return null;
}

async function stubFindTicketWithDomainById(ticketId: string): Promise<{ id: string; status: string; started_at: Date | null; reporter_id: string; domain: { org_id: string }; subtasks: { id: string }[] } | null> {
  console.log('[STUB] prisma.qUAD_tickets.findUnique (with domain) called with id:', ticketId);
  return null;
}

async function stubUpdateTicket(ticketId: string, data: Record<string, unknown>): Promise<Ticket> {
  console.log('[STUB] prisma.qUAD_tickets.update called with id:', ticketId, 'data:', JSON.stringify(data));
  return {
    id: ticketId,
    domain_id: 'stub-domain-id',
    cycle_id: null,
    parent_ticket_id: null,
    ticket_number: 'STUB-1',
    title: 'Stub Ticket',
    description: null,
    acceptance_criteria: null,
    ticket_type: 'task',
    status: 'backlog',
    priority: 'medium',
    assigned_to: null,
    reporter_id: 'stub-user-id',
    story_points: null,
    due_date: null,
    started_at: null,
    completed_at: null,
    branch_name: null,
    ai_implementation_plan: null,
    ai_suggested_files: null,
    created_at: new Date(),
    domain: { id: 'stub-domain-id', name: 'Stub Domain', ticket_prefix: null, org_id: 'stub-org-id' },
    subtasks: [],
    comments: [],
    time_logs: [],
  };
}

async function stubDeleteTicket(ticketId: string): Promise<void> {
  console.log('[STUB] prisma.qUAD_tickets.delete called with id:', ticketId);
}

// GET: Get single ticket with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const ticket = await stubFindTicketById(id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (ticket.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Calculate total logged hours
    const totalLoggedHours = ticket.time_logs.reduce(
      (sum, log) => sum + Number(log.hours),
      0
    );

    // Subtask completion
    const subtasksDone = ticket.subtasks.filter(s => s.status === 'done').length;
    const subtasksTotal = ticket.subtasks.length;

    return NextResponse.json({
      ...ticket,
      metrics: {
        total_logged_hours: totalLoggedHours,
        subtasks_completed: subtasksDone,
        subtasks_total: subtasksTotal,
        subtasks_percentage: subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch existing ticket
    const existing = await stubFindTicketWithDomainById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      acceptance_criteria,
      status,
      priority,
      assigned_to,
      cycle_id,
      sprint_id, // Backwards compatibility
      story_points,
      due_date,
      ai_implementation_plan,
      ai_suggested_files,
      branch_name
    } = body;

    const effectiveCycleId = cycle_id !== undefined ? cycle_id : sprint_id; // Support both

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (acceptance_criteria !== undefined) updateData.acceptance_criteria = acceptance_criteria;
    if (priority !== undefined) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (effectiveCycleId !== undefined) updateData.cycle_id = effectiveCycleId;
    if (story_points !== undefined) updateData.story_points = story_points;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (ai_implementation_plan !== undefined) updateData.ai_implementation_plan = ai_implementation_plan;
    if (ai_suggested_files !== undefined) updateData.ai_suggested_files = ai_suggested_files;
    if (branch_name !== undefined) updateData.branch_name = branch_name;

    // Handle status transitions with timestamps
    if (status !== undefined && status !== existing.status) {
      updateData.status = status;

      // Track started_at when moving to in_progress
      if (status === 'in_progress' && !existing.started_at) {
        updateData.started_at = new Date();
      }

      // Track completed_at when moving to done
      if (status === 'done') {
        updateData.completed_at = new Date();
      }

      // Clear completed_at if moving back from done
      if (existing.status === 'done' && status !== 'done') {
        updateData.completed_at = null;
      }
    }

    const ticket = await stubUpdateTicket(id, updateData);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch existing ticket
    const existing = await stubFindTicketWithDomainById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only allow delete if reporter or admin
    if (existing.reporter_id !== payload.userId && !['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Warn if ticket has subtasks
    if (existing.subtasks.length > 0) {
      // Subtasks will be deleted due to cascade
    }

    await stubDeleteTicket(id);

    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
