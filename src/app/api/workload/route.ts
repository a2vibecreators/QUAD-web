/**
 * GET /api/workload - Get workload metrics
 * POST /api/workload - Create workload metric entry
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface User {
  id: string;
  email: string;
  full_name: string | null;
  org_id: string;
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface WorkloadMetric {
  id: string;
  user_id: string;
  domain_id: string | null;
  period_start: Date;
  period_end: Date;
  period_type: string;
  assignments: number;
  completes: number;
  output_score: number | null;
  hours_worked: number;
  target_hours: number;
  days_worked: number;
  target_days: number;
  root_cause: string | null;
  root_cause_notes: string | null;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  domain?: {
    id: string;
    name: string;
  } | null;
}

interface WorkloadMetricCreateInput {
  user_id: string;
  domain_id?: string | null;
  period_start: Date;
  period_end: Date;
  period_type: string;
  assignments: number;
  completes: number;
  output_score?: number | null;
  hours_worked: number;
  target_hours: number;
  days_worked: number;
  target_days: number;
  root_cause?: string | null;
  root_cause_notes?: string | null;
}

// ============================================================================
// Stub Functions
// ============================================================================

async function findUserById(userId: string): Promise<User | null> {
  console.log('[STUB] findUserById called with:', userId);
  // TODO: Implement via Java backend GET /users/{id}
  return null;
}

async function findUsersByOrgId(orgId: string): Promise<{ id: string }[]> {
  console.log('[STUB] findUsersByOrgId called with:', orgId);
  // TODO: Implement via Java backend GET /users?org_id={orgId}
  return [];
}

async function findDomainById(domainId: string): Promise<Domain | null> {
  console.log('[STUB] findDomainById called with:', domainId);
  // TODO: Implement via Java backend GET /domains/{id}
  return null;
}

async function findWorkloadMetrics(where: Record<string, unknown>): Promise<WorkloadMetric[]> {
  console.log('[STUB] findWorkloadMetrics called with:', JSON.stringify(where));
  // TODO: Implement via Java backend GET /workload-metrics
  return [];
}

async function findFirstWorkloadMetric(where: Record<string, unknown>): Promise<WorkloadMetric | null> {
  console.log('[STUB] findFirstWorkloadMetric called with:', JSON.stringify(where));
  // TODO: Implement via Java backend GET /workload-metrics
  return null;
}

async function updateWorkloadMetric(id: string, data: Partial<WorkloadMetricCreateInput>): Promise<WorkloadMetric> {
  console.log('[STUB] updateWorkloadMetric called with:', id, JSON.stringify(data));
  // TODO: Implement via Java backend PUT /workload-metrics/{id}
  return {
    id,
    user_id: data.user_id || '',
    domain_id: data.domain_id || null,
    period_start: data.period_start || new Date(),
    period_end: data.period_end || new Date(),
    period_type: data.period_type || 'week',
    assignments: data.assignments || 0,
    completes: data.completes || 0,
    output_score: data.output_score || null,
    hours_worked: data.hours_worked || 0,
    target_hours: data.target_hours || 16,
    days_worked: data.days_worked || 0,
    target_days: data.target_days || 4,
    root_cause: data.root_cause || null,
    root_cause_notes: data.root_cause_notes || null,
  };
}

async function createWorkloadMetric(data: WorkloadMetricCreateInput): Promise<WorkloadMetric> {
  console.log('[STUB] createWorkloadMetric called with:', JSON.stringify(data));
  // TODO: Implement via Java backend POST /workload-metrics
  return {
    id: 'stub-metric-id',
    user_id: data.user_id,
    domain_id: data.domain_id || null,
    period_start: data.period_start,
    period_end: data.period_end,
    period_type: data.period_type,
    assignments: data.assignments,
    completes: data.completes,
    output_score: data.output_score || null,
    hours_worked: data.hours_worked,
    target_hours: data.target_hours,
    days_worked: data.days_worked,
    target_days: data.target_days,
    root_cause: data.root_cause || null,
    root_cause_notes: data.root_cause_notes || null,
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

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
      const user = await findUserById(userId);
      if (!user || user.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      where.user_id = userId;
    } else {
      // Get all users in organization
      const orgUsers = await findUsersByOrgId(payload.companyId);
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

    const metrics = await findWorkloadMetrics(where);

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
    const user = await findUserById(user_id);

    if (!user || user.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If domain_id provided, verify it
    if (domain_id) {
      const domain = await findDomainById(domain_id);
      if (!domain || domain.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
      }
    }

    // Check for existing entry (upsert)
    const existing = await findFirstWorkloadMetric({
      user_id,
      domain_id: domain_id || null,
      period_start: new Date(period_start),
      period_end: new Date(period_end)
    });

    let metric;
    if (existing) {
      // Update existing
      metric = await updateWorkloadMetric(existing.id, {
        assignments: assignments ?? existing.assignments,
        completes: completes ?? existing.completes,
        output_score: output_score !== undefined ? output_score : existing.output_score,
        hours_worked: hours_worked !== undefined ? hours_worked : existing.hours_worked,
        target_hours: target_hours !== undefined ? target_hours : existing.target_hours,
        days_worked: days_worked !== undefined ? days_worked : existing.days_worked,
        target_days: target_days !== undefined ? target_days : existing.target_days,
        root_cause: root_cause !== undefined ? root_cause : existing.root_cause,
        root_cause_notes: root_cause_notes !== undefined ? root_cause_notes : existing.root_cause_notes
      });
    } else {
      // Create new
      metric = await createWorkloadMetric({
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
