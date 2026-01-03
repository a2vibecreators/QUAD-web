/**
 * GET /api/workload - Get workload metrics
 * POST /api/workload - Create workload metric entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get workload metrics
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
    const userId = searchParams.get('user_id');
    const domainId = searchParams.get('domain_id');
    const periodType = searchParams.get('period_type') || 'week';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build where clause
    const where: Record<string, unknown> = {};

    // If user_id specified, filter by user (must be in same company)
    if (userId) {
      const user = await prisma.qUAD_users.findUnique({
        where: { id: userId }
      });
      if (!user || user.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      where.user_id = userId;
    } else {
      // Get all users in organization
      const orgUsers = await prisma.qUAD_users.findMany({
        where: { org_id: payload.companyId },
        select: { id: true }
      });
      where.user_id = { in: orgUsers.map(u => u.id) };
    }

    if (domainId) where.domain_id = domainId;
    if (periodType) where.period_type = periodType;

    if (startDate) {
      where.period_start = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.period_end = { lte: new Date(endDate) };
    }

    const metrics = await prisma.qUAD_workload_metrics.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        },
        domain: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { period_start: 'desc' },
        { user_id: 'asc' }
      ]
    });

    // Calculate summary stats
    const summary = {
      total_entries: metrics.length,
      avg_output_score: metrics.length > 0
        ? metrics.reduce((acc, m) => acc + (Number(m.output_score) || 0), 0) / metrics.length
        : 0,
      avg_hours_worked: metrics.length > 0
        ? metrics.reduce((acc, m) => acc + (Number(m.hours_worked) || 0), 0) / metrics.length
        : 0,
      total_assignments: metrics.reduce((acc, m) => acc + m.assignments, 0),
      total_completes: metrics.reduce((acc, m) => acc + m.completes, 0),
      root_cause_breakdown: {} as Record<string, number>
    };

    // Root cause breakdown
    metrics.forEach(m => {
      if (m.root_cause) {
        summary.root_cause_breakdown[m.root_cause] =
          (summary.root_cause_breakdown[m.root_cause] || 0) + 1;
      }
    });

    return NextResponse.json({
      metrics,
      summary
    });
  } catch (error) {
    console.error('Get workload metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create workload metric entry
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
      user_id,
      domain_id,
      period_start,
      period_end,
      period_type,
      assignments,
      completes,
      output_score,
      hours_worked,
      target_hours,
      days_worked,
      target_days,
      root_cause,
      root_cause_notes
    } = body;

    // Validation
    if (!user_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'user_id, period_start, and period_end are required' },
        { status: 400 }
      );
    }

    // Verify user exists and is in same company
    const user = await prisma.qUAD_users.findUnique({
      where: { id: user_id }
    });

    if (!user || user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If domain_id provided, verify it
    if (domain_id) {
      const domain = await prisma.qUAD_domains.findUnique({
        where: { id: domain_id }
      });
      if (!domain || domain.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
      }
    }

    // Check for existing entry (upsert)
    const existing = await prisma.qUAD_workload_metrics.findFirst({
      where: {
        user_id,
        domain_id: domain_id || null,
        period_start: new Date(period_start),
        period_end: new Date(period_end)
      }
    });

    let metric;
    if (existing) {
      // Update existing
      metric = await prisma.qUAD_workload_metrics.update({
        where: { id: existing.id },
        data: {
          assignments: assignments ?? existing.assignments,
          completes: completes ?? existing.completes,
          output_score: output_score !== undefined ? output_score : existing.output_score,
          hours_worked: hours_worked !== undefined ? hours_worked : existing.hours_worked,
          target_hours: target_hours !== undefined ? target_hours : existing.target_hours,
          days_worked: days_worked !== undefined ? days_worked : existing.days_worked,
          target_days: target_days !== undefined ? target_days : existing.target_days,
          root_cause: root_cause !== undefined ? root_cause : existing.root_cause,
          root_cause_notes: root_cause_notes !== undefined ? root_cause_notes : existing.root_cause_notes
        },
        include: {
          user: { select: { id: true, email: true, full_name: true } },
          domain: { select: { id: true, name: true } }
        }
      });
    } else {
      // Create new
      metric = await prisma.qUAD_workload_metrics.create({
        data: {
          user_id,
          domain_id,
          period_start: new Date(period_start),
          period_end: new Date(period_end),
          period_type: period_type || 'week',
          assignments: assignments || 0,
          completes: completes || 0,
          output_score,
          hours_worked: hours_worked || 0,
          target_hours: target_hours || 16,
          days_worked: days_worked || 0,
          target_days: target_days || 4,
          root_cause,
          root_cause_notes
        },
        include: {
          user: { select: { id: true, email: true, full_name: true } },
          domain: { select: { id: true, name: true } }
        }
      });
    }

    return NextResponse.json(metric, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Create workload metric error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
