/**
 * GET /api/cycles/[id] - Get single Cycle with Flows
 * PUT /api/cycles/[id] - Update Cycle
 * DELETE /api/cycles/[id] - Delete Cycle
 *
 * QUAD Terminology: Cycles (formerly Sprints), Flows (formerly Tickets)
 * Database table: quad_cycles
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface Comment {
  id: string;
  content: string;
  created_at: Date;
}

interface TimeLog {
  hours: number;
  logged_date: Date;
}

interface Subtask {
  id: string;
  title: string;
  status: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  story_points: number | null;
  assigned_to: string | null;
  priority: string;
  comments?: Comment[];
  time_logs?: TimeLog[];
  subtasks?: Subtask[];
}

interface Domain {
  id: string;
  name: string;
  ticket_prefix: string;
  org_id: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
}

interface Cycle {
  id: string;
  domain_id: string;
  milestone_id: string | null;
  cycle_number: number;
  name: string;
  goal: string | null;
  start_date: Date;
  end_date: Date;
  status: string;
  capacity: number | null;
  velocity?: number | null;
  domain: Domain;
  milestone?: Milestone | null;
  tickets: Ticket[];
  _count?: { tickets: number };
}

// Stub functions for database operations
async function findUniqueCycle(id: string, include?: Record<string, unknown>): Promise<Cycle | null> {
  console.log('[STUB] findUniqueCycle called with:', { id, include });
  return null;
}

async function updateCycle(id: string, data: Record<string, unknown>, include?: Record<string, unknown>): Promise<Cycle> {
  console.log('[STUB] updateCycle called with:', { id, data, include });
  return {
    id,
    domain_id: 'stub-domain-id',
    milestone_id: null,
    cycle_number: 1,
    name: 'Stub Cycle',
    goal: null,
    start_date: new Date(),
    end_date: new Date(),
    status: 'planned',
    capacity: null,
    domain: { id: 'stub-domain-id', name: 'Stub Domain', ticket_prefix: 'STB', org_id: 'stub-org-id' },
    tickets: []
  };
}

async function updateManyTickets(where: Record<string, unknown>, data: Record<string, unknown>): Promise<{ count: number }> {
  console.log('[STUB] updateManyTickets called with:', { where, data });
  return { count: 0 };
}

async function deleteCycle(id: string): Promise<void> {
  console.log('[STUB] deleteCycle called with id:', id);
}

// GET: Get single Cycle with full details
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

    const cycle = await findUniqueCycle(id, {
      domain: {
        select: {
          id: true,
          name: true,
          ticket_prefix: true,
          org_id: true
        }
      },
      milestone: {
        select: { id: true, title: true, status: true }
      },
      tickets: {
        include: {
          comments: {
            take: 3,
            orderBy: { created_at: 'desc' }
          },
          time_logs: {
            select: {
              hours: true,
              logged_date: true
            }
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'asc' }
        ]
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (cycle.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Calculate burndown data
    const totalPoints = cycle.tickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = cycle.tickets
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    // Group Flows by status for board view
    const flowsByStatus = {
      backlog: cycle.tickets.filter(t => t.status === 'backlog'),
      todo: cycle.tickets.filter(t => t.status === 'todo'),
      in_progress: cycle.tickets.filter(t => t.status === 'in_progress'),
      in_review: cycle.tickets.filter(t => t.status === 'in_review'),
      testing: cycle.tickets.filter(t => t.status === 'testing'),
      done: cycle.tickets.filter(t => t.status === 'done'),
      blocked: cycle.tickets.filter(t => t.status === 'blocked')
    };

    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(cycle.end_date);
    const startDate = new Date(cycle.start_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = totalDays - daysRemaining;

    return NextResponse.json({
      ...cycle,
      cycle_number: cycle.cycle_number,
      metrics: {
        total_flows: cycle.tickets.length,
        total_points: totalPoints,
        completed_points: completedPoints,
        completion_percentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
        days_total: totalDays,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining
      },
      flows_by_status: flowsByStatus
    });
  } catch (error) {
    console.error('Get cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update Cycle
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

    // Fetch existing Cycle
    const existing = await findUniqueCycle(id, {
      domain: { select: { org_id: true } },
      tickets: { select: { id: true, status: true, story_points: true } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      goal,
      start_date,
      end_date,
      status,
      capacity
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (goal !== undefined) updateData.goal = goal;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (capacity !== undefined) updateData.capacity = capacity;

    // Handle status transitions
    if (status !== undefined && status !== existing.status) {
      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        planned: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };

      if (!validTransitions[existing.status]?.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${existing.status} to ${status}` },
          { status: 400 }
        );
      }

      updateData.status = status;

      // If completing Cycle, calculate velocity
      if (status === 'completed') {
        const velocity = existing.tickets
          .filter(t => t.status === 'done')
          .reduce((sum, t) => sum + (t.story_points || 0), 0);
        updateData.velocity = velocity;
      }
    }

    const cycle = await updateCycle(id, updateData, {
      domain: {
        select: { id: true, name: true }
      },
      milestone: {
        select: { id: true, title: true }
      },
      _count: {
        select: { tickets: true }
      }
    });

    return NextResponse.json({
      ...cycle,
      cycle_number: cycle.cycle_number
    });
  } catch (error) {
    console.error('Update cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete Cycle (only if no Flows or all Flows unassigned)
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

    // Only admins and managers can delete Cycles
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch existing Cycle
    const existing = await findUniqueCycle(id, {
      domain: { select: { org_id: true } },
      tickets: { select: { id: true } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Cannot delete active Cycle
    if (existing.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active Cycle. Complete or cancel it first.' },
        { status: 400 }
      );
    }

    // If Cycle has Flows, move them back to backlog (unassign from Cycle)
    if (existing.tickets.length > 0) {
      await updateManyTickets(
        { cycle_id: id },
        { cycle_id: null }
      );
    }

    await deleteCycle(id);

    return NextResponse.json({ message: 'Cycle deleted' });
  } catch (error) {
    console.error('Delete cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
