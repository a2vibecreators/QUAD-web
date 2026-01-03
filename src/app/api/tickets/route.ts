/**
 * GET /api/tickets - List tickets with filtering
 * POST /api/tickets - Create a new ticket (with intelligent assignment)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { assignTicket, recordAssignment } from '@/lib/services/assignment-service';

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
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
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

    const tickets = await prisma.qUAD_tickets.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true, ticket_prefix: true }
        },
        cycle: {
          select: { id: true, name: true, cycle_number: true }
        },
        subtasks: {
          select: {
            id: true,
            ticket_number: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            comments: true,
            time_logs: true,
            subtasks: true
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { created_at: 'desc' }
      ],
      take: 200 // Limit for performance
    });

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
    const domain = await prisma.qUAD_domains.findUnique({
      where: { id: domain_id }
    });

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Generate ticket number
    const ticketPrefix = domain.ticket_prefix || 'TICKET';
    const lastTicket = await prisma.qUAD_tickets.findFirst({
      where: { domain_id },
      orderBy: { created_at: 'desc' }
    });

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
      const cycle = await prisma.qUAD_cycles.findUnique({
        where: { id: effectiveCycleId }
      });
      if (!cycle || cycle.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
      }
    }

    // If parent_ticket_id provided, verify it exists and set type to subtask
    let finalTicketType = ticket_type || 'task';
    if (parent_ticket_id) {
      const parentTicket = await prisma.qUAD_tickets.findUnique({
        where: { id: parent_ticket_id }
      });
      if (!parentTicket || parentTicket.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 });
      }
      finalTicketType = 'subtask';
    }

    // Create ticket first (without assignment if auto-assign needed)
    const ticket = await prisma.qUAD_tickets.create({
      data: {
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
      },
      include: {
        domain: {
          select: { id: true, name: true }
        },
        cycle: {
          select: { id: true, name: true }
        }
      }
    });

    // Intelligent assignment if not manually assigned
    let assignmentResult = null;
    if (!assigned_to) {
      try {
        assignmentResult = await assignTicket(ticket.id, domain_id, payload.companyId);

        // Update ticket with assigned user
        await prisma.qUAD_tickets.update({
          where: { id: ticket.id },
          data: { assigned_to: assignmentResult.assigned_to }
        });

        // Record assignment for audit and learning
        await recordAssignment(ticket.id, assignmentResult);

        // Merge assignment info into response
        (ticket as Record<string, unknown>).assigned_to = assignmentResult.assigned_to;
        (ticket as Record<string, unknown>).assignment_info = {
          type: assignmentResult.assignment_type,
          score: assignmentResult.score,
          reason: assignmentResult.reason,
          assigned_name: assignmentResult.assigned_name
        };
      } catch (assignError) {
        // Assignment failed (e.g., no developers) - ticket still created unassigned
        console.warn('Auto-assignment failed:', assignError);
        (ticket as Record<string, unknown>).assignment_info = {
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
