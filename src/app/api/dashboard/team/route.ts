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
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: {
        org_id: payload.companyId,
        is_deleted: false
      },
      select: { id: true }
    });
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    // Build ticket where clause
    const ticketWhere: Record<string, unknown> = {
      domain_id: { in: domainIds },
      assigned_to: { not: null }
    };
    if (cycleId) {
      ticketWhere.cycle_id = cycleId;
    }

    // Get all tickets with assignments
    const tickets = await prisma.qUAD_tickets.findMany({
      where: ticketWhere,
      select: {
        id: true,
        assigned_to: true,
        status: true,
        story_points: true
      }
    });

    // Get organization members
    const members = await prisma.qUAD_org_members.findMany({
      where: { org_id: payload.companyId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true
          }
        }
      }
    });

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
    const unassignedTickets = await prisma.qUAD_tickets.count({
      where: {
        domain_id: { in: domainIds },
        assigned_to: null,
        status: { not: 'done' }
      }
    });

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
