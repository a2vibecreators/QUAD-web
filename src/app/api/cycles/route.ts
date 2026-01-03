/**
 * GET /api/cycles - List Cycles for a Domain
 * POST /api/cycles - Create a new Cycle
 *
 * QUAD Terminology: Cycles (formerly Sprints) are time-boxed work periods
 * Database table: QUAD_cycles
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: List Cycles with filtering
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
    const milestoneId = searchParams.get('milestone_id');
    const status = searchParams.get('status');
    const active = searchParams.get('active'); // Get current active Cycle

    // Get organization Domains
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (milestoneId) where.milestone_id = milestoneId;
    if (status) where.status = status;
    if (active === 'true') where.status = 'active';

    const cycles = await prisma.qUAD_cycles.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true, ticket_prefix: true }
        },
        milestone: {
          select: { id: true, title: true }
        },
        tickets: {
          select: {
            id: true,
            ticket_number: true,
            title: true,
            status: true,
            story_points: true,
            assigned_to: true
          }
        },
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: [
        { status: 'asc' }, // active first
        { cycle_number: 'desc' }
      ]
    });

    // Calculate Cycle metrics
    const cyclesWithMetrics = cycles.map(cycle => {
      const totalPoints = cycle.tickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedPoints = cycle.tickets
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.story_points || 0), 0);

      const flowsByStatus = {
        backlog: cycle.tickets.filter(t => t.status === 'backlog').length,
        todo: cycle.tickets.filter(t => t.status === 'todo').length,
        in_progress: cycle.tickets.filter(t => t.status === 'in_progress').length,
        in_review: cycle.tickets.filter(t => t.status === 'in_review').length,
        testing: cycle.tickets.filter(t => t.status === 'testing').length,
        done: cycle.tickets.filter(t => t.status === 'done').length,
        blocked: cycle.tickets.filter(t => t.status === 'blocked').length
      };

      return {
        ...cycle,
        // cycle_number for API response
        cycle_number: cycle.cycle_number,
        metrics: {
          total_flows: cycle.tickets.length,
          total_points: totalPoints,
          completed_points: completedPoints,
          completion_percentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
          flows_by_status: flowsByStatus
        }
      };
    });

    // Get active Cycle
    const activeCycle = cyclesWithMetrics.find(c => c.status === 'active');

    return NextResponse.json({
      cycles: cyclesWithMetrics,
      active_cycle: activeCycle || null,
      total: cycles.length
    });
  } catch (error) {
    console.error('Get cycles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new Cycle
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
      milestone_id,
      name,
      goal,
      start_date,
      end_date,
      capacity
    } = body;

    // Validation
    if (!domain_id || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'domain_id, name, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    // Verify Domain exists and belongs to user's company
    const domain = await prisma.qUAD_domains.findUnique({
      where: { id: domain_id }
    });

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // If milestone_id provided, verify it exists
    if (milestone_id) {
      const milestone = await prisma.qUAD_milestones.findUnique({
        where: { id: milestone_id }
      });
      if (!milestone || milestone.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }
    }

    // Get next Cycle number for this Domain
    const lastCycle = await prisma.qUAD_cycles.findFirst({
      where: { domain_id },
      orderBy: { cycle_number: 'desc' }
    });
    const cycleNumber = (lastCycle?.cycle_number || 0) + 1;

    // Create Cycle
    const cycle = await prisma.qUAD_cycles.create({
      data: {
        domain_id,
        milestone_id,
        cycle_number: cycleNumber,
        name: name || `Cycle ${cycleNumber}`,
        goal,
        start_date: startDate,
        end_date: endDate,
        status: 'planned',
        capacity
      },
      include: {
        domain: {
          select: { id: true, name: true }
        },
        milestone: {
          select: { id: true, title: true }
        }
      }
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('Create cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
