/**
 * GET /api/cycles - List Cycles for a Domain
 * POST /api/cycles - Create a new Cycle
 *
 * QUAD Terminology: Cycles (formerly Sprints) are time-boxed work periods
 * Database table: QUAD_cycles
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface Domain {
  id: string;
  name: string;
  ticket_prefix: string;
  org_id: string;
}

interface Milestone {
  id: string;
  title: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  story_points: number | null;
  assigned_to: string | null;
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
  domain?: Partial<Domain>;
  milestone?: Partial<Milestone> | null;
  tickets: Ticket[];
  _count?: { tickets: number };
}

// Stub functions for database operations
async function findManyDomains(where: Record<string, unknown>): Promise<{ id: string }[]> {
  console.log('[STUB] findManyDomains called with:', where);
  return [];
}

async function findManyCycles(where: Record<string, unknown>, include?: Record<string, unknown>, orderBy?: unknown[]): Promise<Cycle[]> {
  console.log('[STUB] findManyCycles called with:', { where, include, orderBy });
  return [];
}

async function findUniqueDomain(id: string): Promise<Domain | null> {
  console.log('[STUB] findUniqueDomain called with id:', id);
  return null;
}

async function findUniqueMilestone(id: string): Promise<{ id: string; domain_id: string } | null> {
  console.log('[STUB] findUniqueMilestone called with id:', id);
  return null;
}

async function findFirstCycle(where: Record<string, unknown>, orderBy?: Record<string, unknown>): Promise<{ cycle_number: number } | null> {
  console.log('[STUB] findFirstCycle called with:', { where, orderBy });
  return null;
}

async function createCycle(data: Record<string, unknown>, include?: Record<string, unknown>): Promise<Cycle> {
  console.log('[STUB] createCycle called with:', { data, include });
  return {
    id: 'stub-cycle-id',
    domain_id: data.domain_id as string,
    milestone_id: data.milestone_id as string | null,
    cycle_number: data.cycle_number as number,
    name: data.name as string,
    goal: data.goal as string | null,
    start_date: data.start_date as Date,
    end_date: data.end_date as Date,
    status: data.status as string,
    capacity: data.capacity as number | null,
    tickets: []
  };
}

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
    const orgDomains = await findManyDomains({ org_id: payload.companyId });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (milestoneId) where.milestone_id = milestoneId;
    if (status) where.status = status;
    if (active === 'true') where.status = 'active';

    const cycles = await findManyCycles(
      where,
      {
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
      [
        { status: 'asc' }, // active first
        { cycle_number: 'desc' }
      ]
    );

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
    const domain = await findUniqueDomain(domain_id);

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // If milestone_id provided, verify it exists
    if (milestone_id) {
      const milestone = await findUniqueMilestone(milestone_id);
      if (!milestone || milestone.domain_id !== domain_id) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }
    }

    // Get next Cycle number for this Domain
    const lastCycle = await findFirstCycle(
      { domain_id },
      { cycle_number: 'desc' }
    );
    const cycleNumber = (lastCycle?.cycle_number || 0) + 1;

    // Create Cycle
    const cycle = await createCycle(
      {
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
      {
        domain: {
          select: { id: true, name: true }
        },
        milestone: {
          select: { id: true, title: true }
        }
      }
    );

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('Create cycle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
