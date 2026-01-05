/**
 * GET /api/dashboard/cycles/[id]/burndown - Get burndown chart data for a cycle
 *
 * Returns daily progress data for burndown chart visualization:
 * - Ideal line (linear from total to 0)
 * - Actual remaining work per day
 * - Story points or ticket count
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number | null;
  completed: number;
}

interface Ticket {
  id: string;
  story_points: number | null;
  status: string;
  completed_at: Date | null;
  created_at: Date;
}

interface Cycle {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  domain: {
    org_id: string;
    name: string;
  };
  tickets: Ticket[];
}

// Stub functions for database operations
async function stubFindCycleById(cycleId: string): Promise<Cycle | null> {
  console.log(`[STUB] findCycleById called with cycleId: ${cycleId}`);
  return null;
}

// GET: Burndown data for a cycle
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'points'; // 'points' or 'count'

    // Fetch cycle with tickets
    const cycle = await stubFindCycleById(id);

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    if (cycle.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Calculate burndown data
    const startDate = new Date(cycle.start_date);
    const endDate = new Date(cycle.end_date);
    const today = new Date();

    // Total work
    const totalWork = metric === 'points'
      ? cycle.tickets.reduce((sum, t) => sum + (t.story_points || 0), 0)
      : cycle.tickets.length;

    // Calculate number of days in cycle
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const idealDailyBurn = totalWork / daysDiff;

    // Build burndown data
    const burndownData: BurndownPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayIndex = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Ideal remaining work (linear)
      const idealRemaining = Math.max(0, totalWork - (idealDailyBurn * dayIndex));

      // Actual remaining work (only if date is in the past or today)
      let actualRemaining: number | null = null;
      let completedToDate = 0;

      if (currentDate <= today) {
        // Count completed work up to this date
        const completedTickets = cycle.tickets.filter(t => {
          if (t.status !== 'done' || !t.completed_at) return false;
          const completedDate = new Date(t.completed_at);
          return completedDate <= currentDate;
        });

        completedToDate = metric === 'points'
          ? completedTickets.reduce((sum, t) => sum + (t.story_points || 0), 0)
          : completedTickets.length;

        actualRemaining = totalWork - completedToDate;
      }

      burndownData.push({
        date: dateStr,
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: actualRemaining !== null ? Math.round(actualRemaining * 10) / 10 : null,
        completed: completedToDate
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Summary stats
    const completedWork = metric === 'points'
      ? cycle.tickets.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.story_points || 0), 0)
      : cycle.tickets.filter(t => t.status === 'done').length;

    const remainingWork = totalWork - completedWork;
    const percentComplete = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

    // Calculate velocity (completed per day)
    const daysElapsed = Math.max(1, Math.ceil((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const velocity = Math.round((completedWork / daysElapsed) * 10) / 10;

    // Projected completion
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const projectedCompletion = velocity > 0 ? Math.round(completedWork + (velocity * daysRemaining)) : completedWork;
    const willComplete = projectedCompletion >= totalWork;

    return NextResponse.json({
      cycle: {
        id: cycle.id,
        name: cycle.name,
        domain: cycle.domain.name,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status
      },
      metric,
      summary: {
        total_work: totalWork,
        completed_work: completedWork,
        remaining_work: remainingWork,
        percent_complete: percentComplete,
        velocity_per_day: velocity,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        projected_completion: projectedCompletion,
        on_track: willComplete
      },
      burndown: burndownData
    });

  } catch (error) {
    console.error('Burndown chart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
