/**
 * GET /api/cycles/[id] - Get single Cycle with Flows
 * PUT /api/cycles/[id] - Update Cycle
 * DELETE /api/cycles/[id] - Delete Cycle
 *
 * QUAD Terminology: Cycles (formerly Sprints), Flows (formerly Tickets)
 * Database table: quad_cycles
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    const cycle = await prisma.qUAD_cycles.findUnique({
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
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Verify belongs to user's organization
    if (cycle.domain.org_id !== payload.companyId) {
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
    const existing = await prisma.qUAD_cycles.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } },
        tickets: { select: { id: true, status: true, story_points: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
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

    const cycle = await prisma.qUAD_cycles.update({
      where: { id },
      data: updateData,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        milestone: {
          select: { id: true, title: true }
        },
        _count: {
          select: { tickets: true }
        }
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
    const existing = await prisma.qUAD_cycles.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } },
        tickets: { select: { id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
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
      await prisma.qUAD_tickets.updateMany({
        where: { cycle_id: id },
        data: { cycle_id: null }
      });
    }

    await prisma.qUAD_cycles.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cycle deleted' });
  } catch (error) {
    console.error('Delete cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
