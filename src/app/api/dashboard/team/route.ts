/**
 * GET /api/dashboard/team - Get team workload distribution
 *
 * Returns workload metrics per team member:
 * - Tickets assigned
 * - Story points assigned
 * - Completion rate
 * - Current workload status
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface Domain {
  id: string;
}

interface Ticket {
  id: string;
  assigned_to: string | null;
  status: string;
  story_points: number | null;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface OrgMember {
  user_id: string;
  user: User;
}

interface TeamMemberWorkload {
  user_id: string;
  name: string | null;
  email: string;
  role: string;
  tickets_assigned: number;
  tickets_completed: number;
  points_assigned: number;
  points_completed: number;
  completion_rate: number;
  workload_status: 'light' | 'normal' | 'heavy' | 'overloaded';
  in_progress_tickets: number;
}

// Stub functions for database operations
async function stubFindDomains(orgId: string): Promise<Domain[]> {
  console.log(`[STUB] findDomains called with orgId: ${orgId}`);
  return [];
}

async function stubFindTickets(domainIds: string[], cycleId: string | null): Promise<Ticket[]> {
  console.log(`[STUB] findTickets called with domainIds: ${domainIds}, cycleId: ${cycleId}`);
  return [];
}

async function stubFindOrgMembers(orgId: string): Promise<OrgMember[]> {
  console.log(`[STUB] findOrgMembers called with orgId: ${orgId}`);
  return [];
}

async function stubCountUnassignedTickets(domainIds: string[]): Promise<number> {
  console.log(`[STUB] countUnassignedTickets called with domainIds: ${domainIds}`);
  return 0;
}

// GET: Team workload
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
    const cycleId = searchParams.get('cycle_id'); // Optional: filter by active cycle

    // Get all domains in organization
    const orgDomains = await stubFindDomains(payload.companyId);
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    // Get all tickets with assignments
    const tickets = await stubFindTickets(domainIds, cycleId);

    // Get organization members
    const members = await stubFindOrgMembers(payload.companyId);

    // Calculate workload per member
    const workloadData: TeamMemberWorkload[] = members.map(m => {
      const userTickets = tickets.filter(t => t.assigned_to === m.user_id);
      const completedTickets = userTickets.filter(t => t.status === 'done');
      const inProgressTickets = userTickets.filter(t =>
        ['in_progress', 'in_review', 'testing'].includes(t.status)
      );

      const pointsAssigned = userTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const pointsCompleted = completedTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);

      // Determine workload status based on in-progress tickets and points
      let workloadStatus: 'light' | 'normal' | 'heavy' | 'overloaded' = 'normal';
      const activePoints = userTickets
        .filter(t => !['done', 'blocked'].includes(t.status))
        .reduce((sum, t) => sum + (t.story_points || 0), 0);

      if (activePoints === 0) workloadStatus = 'light';
      else if (activePoints <= 8) workloadStatus = 'normal';
      else if (activePoints <= 13) workloadStatus = 'heavy';
      else workloadStatus = 'overloaded';

      return {
        user_id: m.user_id,
        name: m.user.full_name,
        email: m.user.email,
        role: m.user.role,
        tickets_assigned: userTickets.length,
        tickets_completed: completedTickets.length,
        points_assigned: pointsAssigned,
        points_completed: pointsCompleted,
        completion_rate: pointsAssigned > 0 ? Math.round((pointsCompleted / pointsAssigned) * 100) : 0,
        workload_status: workloadStatus,
        in_progress_tickets: inProgressTickets.length
      };
    });

    // Sort by workload (overloaded first)
    const workloadOrder = { overloaded: 0, heavy: 1, normal: 2, light: 3 };
    workloadData.sort((a, b) => workloadOrder[a.workload_status] - workloadOrder[b.workload_status]);

    // Summary statistics
    const totalAssigned = workloadData.reduce((sum, w) => sum + w.tickets_assigned, 0);
    const totalCompleted = workloadData.reduce((sum, w) => sum + w.tickets_completed, 0);
    const unassignedTickets = await stubCountUnassignedTickets(domainIds);

    // Workload distribution for pie chart
    const workloadDistribution = [
      { label: 'Light', value: workloadData.filter(w => w.workload_status === 'light').length, color: '#22C55E' },
      { label: 'Normal', value: workloadData.filter(w => w.workload_status === 'normal').length, color: '#3B82F6' },
      { label: 'Heavy', value: workloadData.filter(w => w.workload_status === 'heavy').length, color: '#F59E0B' },
      { label: 'Overloaded', value: workloadData.filter(w => w.workload_status === 'overloaded').length, color: '#EF4444' }
    ].filter(d => d.value > 0);

    // Points distribution bar chart
    const pointsDistribution = workloadData
      .filter(w => w.points_assigned > 0)
      .map(w => ({
        label: w.name || w.email.split('@')[0],
        assigned: w.points_assigned,
        completed: w.points_completed
      }));

    return NextResponse.json({
      summary: {
        total_members: workloadData.length,
        total_tickets_assigned: totalAssigned,
        total_tickets_completed: totalCompleted,
        unassigned_tickets: unassignedTickets,
        overloaded_members: workloadData.filter(w => w.workload_status === 'overloaded').length,
        light_members: workloadData.filter(w => w.workload_status === 'light').length
      },
      charts: {
        workload_distribution: {
          title: 'Workload Distribution',
          type: 'pie',
          data: workloadDistribution
        },
        points_by_member: {
          title: 'Points by Team Member',
          type: 'bar',
          data: pointsDistribution
        }
      },
      members: workloadData,
      alerts: generateAlerts(workloadData, unassignedTickets)
    });

  } catch (error) {
    console.error('Team workload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAlerts(workload: TeamMemberWorkload[], unassigned: number): string[] {
  const alerts: string[] = [];

  const overloaded = workload.filter(w => w.workload_status === 'overloaded');
  if (overloaded.length > 0) {
    alerts.push(`${overloaded.length} team member(s) are overloaded and may need help`);
  }

  const lightMembers = workload.filter(w => w.workload_status === 'light');
  if (lightMembers.length > 0 && overloaded.length > 0) {
    alerts.push(`Consider redistributing work from overloaded to light-workload members`);
  }

  if (unassigned > 5) {
    alerts.push(`${unassigned} tickets are unassigned in the backlog`);
  }

  return alerts;
}
