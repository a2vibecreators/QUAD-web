/**
 * GET /api/gamification - Get gamification metrics and rankings
 *
 * Tracks per developer:
 * - Tickets completed (by complexity)
 * - Time accuracy (estimated vs actual)
 * - Bug fix rate
 * - Sprint velocity contribution
 *
 * Phase 1 Gamification Features:
 * - Individual metrics
 * - Team leaderboard
 * - Weekly email summaries
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// Complexity points multiplier
const COMPLEXITY_POINTS: Record<number, number> = {
  1: 1,   // Simple
  2: 2,   // Moderate
  3: 4,   // Complex
  4: 8,   // Very Complex
  5: 16   // Extremely Complex
};

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Domain {
  id: string;
  org_id: string;
}

interface TimeLog {
  id: string;
  hours: number | string;
}

interface Ticket {
  id: string;
  domain_id: string;
  status: string;
  completed_at: Date | null;
  assigned_to: string | null;
  story_points: number | null;
  ticket_type: string;
  due_date: Date | null;
  ai_estimate_hours: number | string | null;
  time_logs: TimeLog[];
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface UserStats {
  tickets_completed: number;
  story_points: number;
  complexity_points: number;
  total_hours: number;
  estimated_hours: number;
  bug_fixes: number;
  features: number;
  on_time_deliveries: number;
  late_deliveries: number;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findDomainsByOrgId(orgId: string): Promise<Domain[]> {
  console.log('[STUB] findDomainsByOrgId called:', { orgId });
  return [];
}

async function findCompletedTickets(
  domainIds: string[],
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<Ticket[]> {
  console.log('[STUB] findCompletedTickets called:', { domainIds, startDate, endDate, userId });
  return [];
}

async function findUsersByIds(userIds: string[]): Promise<User[]> {
  console.log('[STUB] findUsersByIds called:', { userIds });
  return [];
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get gamification metrics
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
    const period = searchParams.get('period') || 'week'; // week, month, quarter, all
    const userId = searchParams.get('user_id'); // Specific user or all

    // Calculate date range
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate = new Date('2020-01-01'); // All time
    }

    // Get organization domains
    const orgDomains = await findDomainsByOrgId(payload.orgId);
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    // Get completed tickets in period
    const completedTickets = await findCompletedTickets(
      domainIds,
      startDate,
      endDate,
      userId || undefined
    );

    // Get all users who completed tickets
    const userStats: Record<string, UserStats> = {};

    completedTickets.forEach(ticket => {
      if (!ticket.assigned_to) return;

      if (!userStats[ticket.assigned_to]) {
        userStats[ticket.assigned_to] = {
          tickets_completed: 0,
          story_points: 0,
          complexity_points: 0,
          total_hours: 0,
          estimated_hours: 0,
          bug_fixes: 0,
          features: 0,
          on_time_deliveries: 0,
          late_deliveries: 0
        };
      }

      const stats = userStats[ticket.assigned_to];
      stats.tickets_completed++;
      stats.story_points += ticket.story_points || 0;

      // Calculate complexity points
      // Use story_points as proxy for complexity (1-5 scale)
      const complexityLevel = Math.min(5, Math.max(1, Math.ceil((ticket.story_points || 1) / 2)));
      stats.complexity_points += COMPLEXITY_POINTS[complexityLevel] || 1;

      // Time tracking
      const ticketHours = ticket.time_logs.reduce((sum, log) => sum + Number(log.hours), 0);
      stats.total_hours += ticketHours;
      stats.estimated_hours += Number(ticket.ai_estimate_hours || 0);

      // Type tracking
      if (ticket.ticket_type === 'bug') {
        stats.bug_fixes++;
      } else {
        stats.features++;
      }

      // On-time delivery
      if (ticket.due_date && ticket.completed_at) {
        if (ticket.completed_at <= ticket.due_date) {
          stats.on_time_deliveries++;
        } else {
          stats.late_deliveries++;
        }
      }
    });

    // Fetch user details
    const userIds = Object.keys(userStats);
    const users = await findUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    // Build leaderboard
    const leaderboard = Object.entries(userStats)
      .map(([id, stats]) => {
        const user = userMap.get(id);
        const timeAccuracy = stats.estimated_hours > 0
          ? Math.round((1 - Math.abs(stats.total_hours - stats.estimated_hours) / stats.estimated_hours) * 100)
          : 100;

        // Calculate overall score
        const score =
          stats.complexity_points * 10 +
          stats.story_points * 5 +
          stats.on_time_deliveries * 3 +
          Math.max(0, timeAccuracy);

        return {
          user_id: id,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || 'Unknown',
          ...stats,
          time_accuracy_percent: Math.max(0, timeAccuracy),
          on_time_percent: stats.tickets_completed > 0
            ? Math.round((stats.on_time_deliveries / stats.tickets_completed) * 100)
            : 100,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    // Get current user's stats
    const myStats = leaderboard.find(l => l.user_id === payload.userId) || null;

    // Team totals
    const teamTotals = {
      tickets_completed: leaderboard.reduce((sum, l) => sum + l.tickets_completed, 0),
      story_points: leaderboard.reduce((sum, l) => sum + l.story_points, 0),
      complexity_points: leaderboard.reduce((sum, l) => sum + l.complexity_points, 0),
      total_hours: leaderboard.reduce((sum, l) => sum + l.total_hours, 0),
      bug_fixes: leaderboard.reduce((sum, l) => sum + l.bug_fixes, 0),
      features: leaderboard.reduce((sum, l) => sum + l.features, 0)
    };

    return NextResponse.json({
      period,
      start_date: startDate,
      end_date: endDate,
      leaderboard,
      my_stats: myStats,
      team_totals: teamTotals,
      complexity_legend: {
        1: 'Simple (1 pt)',
        2: 'Moderate (2 pts)',
        3: 'Complex (4 pts)',
        4: 'Very Complex (8 pts)',
        5: 'Extremely Complex (16 pts)'
      }
    });
  } catch (error) {
    console.error('Get gamification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
