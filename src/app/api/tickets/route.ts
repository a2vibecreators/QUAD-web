/**
 * GET /api/tickets - List tickets with filtering
 * POST /api/tickets - Create a new ticket (with intelligent assignment)
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';
import { assignTicket, recordAssignment, type AssignmentResult } from '@/lib/services/assignment-service';

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
}

interface Subtask {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
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
  created_at: Date;
  domain?: Pick<Domain, 'id' | 'name' | 'ticket_prefix'>;
  cycle?: Pick<Cycle, 'id' | 'name' | 'cycle_number'> | null;
  subtasks?: Subtask[];
  _count?: {
    comments: number;
    time_logs: number;
    subtasks: number;
  };
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function stubFindDomainsByOrgId(orgId: string): Promise<{ id: string }[]> {
  console.log('[STUB] prisma.qUAD_domains.findMany called with org_id:', orgId);
  return [];
}

async function stubFindTickets(where: Record<string, unknown>): Promise<Ticket[]> {
  console.log('[STUB] prisma.qUAD_tickets.findMany called with where:', JSON.stringify(where));
  return [];
}

async function stubFindDomainById(domainId: string): Promise<Domain | null> {
  console.log('[STUB] prisma.qUAD_domains.findUnique called with id:', domainId);
  return null;
}

async function stubFindLastTicketByDomainId(domainId: string): Promise<{ ticket_number: string } | null> {
  console.log('[STUB] prisma.qUAD_tickets.findFirst called for last ticket in domain:', domainId);
  return null;
}

async function stubFindCycleById(cycleId: string): Promise<{ id: string; domain_id: string } | null> {
  console.log('[STUB] prisma.qUAD_cycles.findUnique called with id:', cycleId);
  return null;
}

async function stubFindTicketById(ticketId: string): Promise<{ id: string; domain_id: string } | null> {
  console.log('[STUB] prisma.qUAD_tickets.findUnique called with id:', ticketId);
  return null;
}

async function stubCreateTicket(data: Record<string, unknown>): Promise<Ticket> {
  console.log('[STUB] prisma.qUAD_tickets.create called with data:', JSON.stringify(data));
  return {
    id: 'stub-ticket-id',
    domain_id: data.domain_id as string,
    cycle_id: (data.cycle_id as string) || null,
    parent_ticket_id: (data.parent_ticket_id as string) || null,
    ticket_number: data.ticket_number as string,
    title: data.title as string,
    description: (data.description as string) || null,
    acceptance_criteria: (data.acceptance_criteria as string) || null,
    ticket_type: data.ticket_type as string,
    status: data.status as string,
    priority: data.priority as string,
    assigned_to: (data.assigned_to as string) || null,
    reporter_id: data.reporter_id as string,
    story_points: (data.story_points as number) || null,
    due_date: (data.due_date as Date) || null,
    created_at: new Date(),
    domain: { id: data.domain_id as string, name: 'Stub Domain', ticket_prefix: null },
    cycle: null,
  };
}

async function stubUpdateTicket(ticketId: string, data: Record<string, unknown>): Promise<void> {
  console.log('[STUB] prisma.qUAD_tickets.update called with id:', ticketId, 'data:', JSON.stringify(data));
}

// GET: List tickets with filtering and board view
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
    const domainId = searchParams.get('domain_id');
    const cycleId = searchParams.get('sprint_id') || searchParams.get('cycle_id'); // Support both for backwards compatibility
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const ticketType = searchParams.get('ticket_type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const view = searchParams.get('view'); // 'board' or 'list'
    const myTickets = searchParams.get('my_tickets'); // Only user's tickets

    // Get organization domains
    const orgDomains = await stubFindDomainsByOrgId(payload.companyId);
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (cycleId) where.cycle_id = cycleId;
    if (status) where.status = status;
    if (assignedTo) where.assigned_to = assignedTo;
    if (ticketType) where.ticket_type = ticketType;
    if (priority) where.priority = priority;
    if (myTickets === 'true') where.assigned_to = payload.userId;

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticket_number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tickets = await stubFindTickets(where);

    // If board view, group by status
    if (view === 'board') {
      const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'blocked'];
      const board: Record<string, typeof tickets> = {};

      statuses.forEach(s => {
        board[s] = tickets.filter(t => t.status === s);
      });

      return NextResponse.json({
        board,
        total: tickets.length
      });
    }

    return NextResponse.json({
      tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new ticket
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

    const body = await request.json();
    const {
      domain_id,
      cycle_id,
      sprint_id, // Backwards compatibility
      parent_ticket_id,
      title,
      description,
      acceptance_criteria,
      ticket_type,
      priority,
      assigned_to,
      story_points,
      due_date
    } = body;

    const effectiveCycleId = cycle_id || sprint_id; // Support both for backwards compatibility

    // Validation
    if (!domain_id || !title) {
      return NextResponse.json(
        { error: 'domain_id and title are required' },
        { status: 400 }
      );
    }

    // Verify domain exists and belongs to user's company
    const domain = await stubFindDomainById(domain_id);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Generate ticket number
    const ticketPrefix = domain.ticket_prefix || 'TICKET';
    const lastTicket = await stubFindLastTicketByDomainId(domain_id);

    let ticketNum = 1;
    if (lastTicket?.ticket_number) {
      const match = lastTicket.ticket_number.match(/-(\d+)$/);
      if (match) {
        ticketNum = parseInt(match[1]) + 1;
      }
    }
    const ticketNumber = `${ticketPrefix}-${ticketNum}`;

    // If cycle_id provided, verify it exists
    if (effectiveCycleId) {
      const cycle = await stubFindCycleById(effectiveCycleId);
      if (!cycle || cycle.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
      }
    }

    // If parent_ticket_id provided, verify it exists and set type to subtask
    let finalTicketType = ticket_type || 'task';
    if (parent_ticket_id) {
      const parentTicket = await stubFindTicketById(parent_ticket_id);
      if (!parentTicket || parentTicket.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 });
      }
      finalTicketType = 'subtask';
    }

    // Create ticket first (without assignment if auto-assign needed)
    const ticket = await stubCreateTicket({
      domain_id,
      cycle_id: effectiveCycleId,
      parent_ticket_id,
      ticket_number: ticketNumber,
      title,
      description,
      acceptance_criteria,
      ticket_type: finalTicketType,
      status: 'backlog',
      priority: priority || 'medium',
      assigned_to: assigned_to || null, // Will be updated if auto-assigned
      reporter_id: payload.userId,
      story_points,
      due_date: due_date ? new Date(due_date) : null
    });

    // Intelligent assignment if not manually assigned
    let assignmentResult: AssignmentResult | null = null;
    if (!assigned_to) {
      try {
        assignmentResult = await assignTicket(ticket.id, domain_id, payload.companyId);

        // Type guard: Only proceed if assignmentResult is not null
        if (assignmentResult) {
          // Update ticket with assigned user
          await stubUpdateTicket(ticket.id, { assigned_to: assignmentResult.assigned_to });

          // Record assignment for audit and learning
          await recordAssignment(ticket.id, assignmentResult);

          // Merge assignment info into response
          (ticket as unknown as Record<string, unknown>).assigned_to = assignmentResult.assigned_to;
          (ticket as unknown as Record<string, unknown>).assignment_info = {
            type: assignmentResult.assignment_type,
            score: assignmentResult.score,
            reason: assignmentResult.reason,
            assigned_name: assignmentResult.assigned_name
          };
        }
      } catch (assignError) {
        // Assignment failed (e.g., no developers) - ticket still created unassigned
        console.warn('Auto-assignment failed:', assignError);
        (ticket as unknown as Record<string, unknown>).assignment_info = {
          type: 'unassigned',
          reason: 'No developers available for auto-assignment'
        };
      }
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
