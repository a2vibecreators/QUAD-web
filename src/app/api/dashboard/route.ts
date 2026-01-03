/**
 * GET /api/dashboard - Get dashboard metrics for the organization
 *
 * Returns aggregated data for:
 * - Tickets by status (pie chart)
 * - Tickets by priority (pie chart)
 * - Tickets by type (pie chart)
 * - Requirements status (pie chart)
 * - Active cycle progress
 * - Recent activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Dashboard metrics
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
    const domainId = searchParams.get('domain_id'); // Optional: filter by domain

    // Get all domains in organization
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: {
        org_id: payload.companyId,
        is_deleted: false
      },
      select: { id: true, name: true }
    });
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    // 1. Tickets by Status (for pie chart)
    const ticketsByStatus = await prisma.qUAD_tickets.groupBy({
      by: ['status'],
      where: { domain_id: { in: domainIds } },
      _count: { id: true }
    });

    const statusData = ticketsByStatus.map(t => ({
      label: t.status,
      value: t._count.id,
      color: getStatusColor(t.status)
    }));

    // 2. Tickets by Priority (for pie chart)
    const ticketsByPriority = await prisma.qUAD_tickets.groupBy({
      by: ['priority'],
      where: { domain_id: { in: domainIds } },
      _count: { id: true }
    });

    const priorityData = ticketsByPriority.map(t => ({
      label: t.priority,
      value: t._count.id,
      color: getPriorityColor(t.priority)
    }));

    // 3. Tickets by Type (for pie chart)
    const ticketsByType = await prisma.qUAD_tickets.groupBy({
      by: ['ticket_type'],
      where: { domain_id: { in: domainIds } },
      _count: { id: true }
    });

    const typeData = ticketsByType.map(t => ({
      label: t.ticket_type,
      value: t._count.id,
      color: getTypeColor(t.ticket_type)
    }));

    // 4. Requirements by Status (for pie chart)
    const requirementsByStatus = await prisma.qUAD_requirements.groupBy({
      by: ['status'],
      where: { domain_id: { in: domainIds } },
      _count: { id: true }
    });

    const requirementsData = requirementsByStatus.map(r => ({
      label: r.status,
      value: r._count.id,
      color: getRequirementStatusColor(r.status)
    }));

    // 5. Active Cycles with Progress
    const activeCycles = await prisma.qUAD_cycles.findMany({
      where: {
        domain_id: { in: domainIds },
        status: { in: ['active', 'in_progress'] }
      },
      include: {
        domain: { select: { name: true } },
        tickets: {
          select: {
            id: true,
            status: true,
            story_points: true
          }
        }
      },
      orderBy: { start_date: 'desc' },
      take: 5
    });

    const cyclesProgress = activeCycles.map(c => {
      const totalTickets = c.tickets.length;
      const completedTickets = c.tickets.filter(t => t.status === 'done').length;
      const totalPoints = c.tickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedPoints = c.tickets.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.story_points || 0), 0);

      return {
        id: c.id,
        name: c.name,
        domain: c.domain.name,
        cycle_number: c.cycle_number,
        start_date: c.start_date,
        end_date: c.end_date,
        total_tickets: totalTickets,
        completed_tickets: completedTickets,
        completion_percentage: totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0,
        total_points: totalPoints,
        completed_points: completedPoints,
        velocity: completedPoints // Current cycle velocity
      };
    });

    // 6. AI Operations Summary
    const aiOperations = await prisma.qUAD_ai_operations.groupBy({
      by: ['status'],
      where: { domain_id: { in: domainIds } },
      _count: { id: true }
    });

    const aiOperationsData = aiOperations.map(a => ({
      status: a.status,
      count: a._count.id
    }));

    // 7. Database Operations Summary (if any)
    const dbOperations = await prisma.qUAD_database_operations.findMany({
      where: { domain_id: { in: domainIds } },
      select: {
        id: true,
        operation_type: true,
        status: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // 8. Summary Counts
    const totalTickets = await prisma.qUAD_tickets.count({
      where: { domain_id: { in: domainIds } }
    });

    const openTickets = await prisma.qUAD_tickets.count({
      where: {
        domain_id: { in: domainIds },
        status: { notIn: ['done', 'blocked'] }
      }
    });

    const totalRequirements = await prisma.qUAD_requirements.count({
      where: { domain_id: { in: domainIds } }
    });

    const pendingApprovals = await prisma.qUAD_approvals.count({
      where: {
        domain_id: { in: domainIds },
        status: 'pending'
      }
    });

    // 9. Recent Activity (last 10 items)
    const recentTickets = await prisma.qUAD_tickets.findMany({
      where: { domain_id: { in: domainIds } },
      select: {
        id: true,
        ticket_number: true,
        title: true,
        status: true,
        updated_at: true,
        domain: { select: { name: true } }
      },
      orderBy: { updated_at: 'desc' },
      take: 10
    });

    const recentActivity = recentTickets.map(t => ({
      type: 'ticket',
      id: t.id,
      reference: t.ticket_number,
      title: t.title,
      status: t.status,
      domain: t.domain.name,
      timestamp: t.updated_at
    }));

    return NextResponse.json({
      summary: {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        total_requirements: totalRequirements,
        pending_approvals: pendingApprovals,
        active_domains: orgDomains.length
      },
      charts: {
        tickets_by_status: {
          title: 'Tickets by Status',
          type: 'pie',
          data: statusData
        },
        tickets_by_priority: {
          title: 'Tickets by Priority',
          type: 'pie',
          data: priorityData
        },
        tickets_by_type: {
          title: 'Tickets by Type',
          type: 'pie',
          data: typeData
        },
        requirements_by_status: {
          title: 'Requirements by Status',
          type: 'pie',
          data: requirementsData
        }
      },
      cycles: cyclesProgress,
      ai_operations: aiOperationsData,
      database_operations: dbOperations,
      recent_activity: recentActivity,
      domains: orgDomains
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Color helper functions for charts
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    backlog: '#9CA3AF',    // Gray
    todo: '#3B82F6',       // Blue
    in_progress: '#F59E0B', // Amber
    in_review: '#8B5CF6',  // Purple
    testing: '#06B6D4',    // Cyan
    done: '#10B981',       // Green
    blocked: '#EF4444'     // Red
  };
  return colors[status] || '#6B7280';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: '#DC2626', // Red
    high: '#F97316',     // Orange
    medium: '#EAB308',   // Yellow
    low: '#22C55E'       // Green
  };
  return colors[priority] || '#6B7280';
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    epic: '#8B5CF6',    // Purple
    story: '#3B82F6',   // Blue
    task: '#10B981',    // Green
    bug: '#EF4444',     // Red
    subtask: '#6B7280'  // Gray
  };
  return colors[type] || '#6B7280';
}

function getRequirementStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: '#9CA3AF',      // Gray
    processing: '#F59E0B', // Amber
    approved: '#10B981',   // Green
    archived: '#6B7280'    // Dark Gray
  };
  return colors[status] || '#6B7280';
}
