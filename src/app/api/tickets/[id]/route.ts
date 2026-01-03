/**
 * GET /api/tickets/[id] - Get single ticket with full details
 * PUT /api/tickets/[id] - Update ticket
 * DELETE /api/tickets/[id] - Delete ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    const ticket = await prisma.qUAD_tickets.findUnique({
      where: { id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            ticket_prefix: true,
            org_id: true
          }
        },
        cycle: {
          select: { id: true, name: true, cycle_number: true, status: true }
        },
        parent_ticket: {
          select: {
            id: true,
            ticket_number: true,
            title: true
          }
        },
        subtasks: {
          select: {
            id: true,
            ticket_number: true,
            title: true,
            status: true,
            assigned_to: true
          }
        },
        comments: {
          orderBy: { created_at: 'desc' }
        },
        time_logs: {
          orderBy: { logged_date: 'desc' }
        },
        pull_request: {
          select: {
            id: true,
            pr_number: true,
            title: true,
            state: true,
            pr_url: true
          }
        }
      }
    });

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
    const existing = await prisma.qUAD_tickets.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } }
      }
    });

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

    const ticket = await prisma.qUAD_tickets.update({
      where: { id },
      data: updateData,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        cycle: {
          select: { id: true, name: true }
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

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
    const existing = await prisma.qUAD_tickets.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } },
        subtasks: { select: { id: true } }
      }
    });

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

    await prisma.qUAD_tickets.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
