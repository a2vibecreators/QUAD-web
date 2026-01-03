import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * GET /api/infrastructure/usage
 *
 * Returns infrastructure usage summary including:
 * - Sandbox counts by mode and status
 * - Idle sandbox candidates for scale-down
 * - Resource utilization metrics
 * - Scaling recommendations
 *
 * Query params:
 *   - org_id: Filter by organization (optional, defaults to user's org)
 *   - include_metrics: Include detailed resource metrics (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeMetrics = searchParams.get('include_metrics') === 'true';

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { company_id: true },
    });

    if (!user?.company_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = searchParams.get('org_id') || user.company_id;

    // Get infrastructure config
    const config = await prisma.$queryRaw<any[]>`
      SELECT
        sandbox_strategy,
        sandbox_pool_size,
        sandbox_dedicated_timeout_hours,
        cloud_provider,
        monthly_budget_usd
      FROM QUAD_infrastructure_config
      WHERE org_id = ${orgId}::uuid
    `;

    const infraConfig = config[0] || {
      sandbox_strategy: 'shared',
      sandbox_pool_size: 2,
      sandbox_dedicated_timeout_hours: 24,
      cloud_provider: 'gcp',
    };

    // Get sandbox counts by mode and status
    const sandboxCounts = await prisma.$queryRaw<any[]>`
      SELECT
        mode,
        status,
        COUNT(*)::integer as count
      FROM QUAD_sandbox_instances
      WHERE org_id = ${orgId}::uuid
      GROUP BY mode, status
      ORDER BY mode, status
    `;

    // Get idle sandboxes eligible for termination
    const idleCandidates = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        mode,
        status,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - idle_since)) / 3600 as idle_hours,
        cloud_instance_id,
        assigned_user_email
      FROM QUAD_sandbox_instances
      WHERE org_id = ${orgId}::uuid
        AND status = 'idle'
        AND idle_since IS NOT NULL
      ORDER BY idle_since ASC
      LIMIT 10
    `;

    // Calculate summary
    const summary = {
      pr_sandbox: { running: 0, idle: 0, total: 0 },
      shared: { running: 0, idle: 0, total: 0 },
      devbox: { running: 0, idle: 0, total: 0 },
    };

    for (const row of sandboxCounts) {
      const mode = row.mode as keyof typeof summary;
      if (summary[mode]) {
        if (row.status === 'running') summary[mode].running = row.count;
        if (row.status === 'idle') summary[mode].idle = row.count;
        if (['running', 'idle'].includes(row.status)) {
          summary[mode].total += row.count;
        }
      }
    }

    // Calculate scaling recommendations
    const minPool = infraConfig.sandbox_pool_size || 0;
    const currentSharedTotal = summary.shared.total;
    const canScaleDown = summary.shared.idle > 0 && currentSharedTotal > minPool;
    const scaleDownCount = canScaleDown ? Math.min(summary.shared.idle, currentSharedTotal - minPool) : 0;

    // Get recent resource metrics if requested
    let resourceMetrics = null;
    if (includeMetrics) {
      const metrics = await prisma.$queryRaw<any[]>`
        SELECT
          AVG(cpu_percent)::decimal(5,2) as avg_cpu,
          MAX(cpu_percent)::decimal(5,2) as max_cpu,
          AVG(memory_percent)::decimal(5,2) as avg_memory,
          MAX(memory_percent)::decimal(5,2) as max_memory,
          SUM(api_calls)::integer as total_api_calls,
          SUM(period_cost_usd)::decimal(10,4) as total_cost
        FROM QUAD_sandbox_usage
        WHERE org_id = ${orgId}::uuid
          AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      `;
      resourceMetrics = metrics[0];
    }

    const response = {
      timestamp: new Date().toISOString(),
      org_id: orgId,
      config: {
        strategy: infraConfig.sandbox_strategy,
        min_pool_size: minPool,
        idle_timeout_hours: infraConfig.sandbox_dedicated_timeout_hours,
        cloud_provider: infraConfig.cloud_provider,
      },
      sandboxes: {
        by_mode: summary,
        total_running: summary.pr_sandbox.running + summary.shared.running + summary.devbox.running,
        total_idle: summary.pr_sandbox.idle + summary.shared.idle + summary.devbox.idle,
        total_active: summary.pr_sandbox.total + summary.shared.total + summary.devbox.total,
      },
      scaling: {
        min_pool: minPool,
        current_pool: currentSharedTotal,
        can_scale_down: canScaleDown,
        scale_down_count: scaleDownCount,
        idle_candidates: idleCandidates.map((s) => ({
          id: s.id,
          mode: s.mode,
          idle_hours: parseFloat(s.idle_hours?.toFixed(2) || '0'),
          instance_id: s.cloud_instance_id,
          user: s.assigned_user_email,
        })),
        recommendation: canScaleDown
          ? `Can terminate ${scaleDownCount} idle sandbox(es) to reach min pool of ${minPool}`
          : currentSharedTotal < minPool
            ? `Need to provision ${minPool - currentSharedTotal} more sandbox(es)`
            : 'Pool is at optimal size',
      },
      resources: resourceMetrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/infrastructure/usage/scale-down
 *
 * Trigger scale-down of idle sandboxes
 *
 * Body:
 *   - sandbox_ids: string[] - Specific sandboxes to terminate
 *   - auto: boolean - Auto-select based on recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sandbox_ids, auto } = body;

    // Get user's org
    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { company_id: true },
    });

    if (!user?.company_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    let terminatedIds: string[] = [];

    if (auto) {
      // Auto-select sandboxes to terminate using the database function
      const candidates = await prisma.$queryRaw<any[]>`
        SELECT sandbox_id, termination_reason
        FROM get_sandboxes_to_terminate(${user.company_id}::uuid)
        LIMIT 10
      `;

      terminatedIds = candidates.map((c) => c.sandbox_id);
    } else if (sandbox_ids && Array.isArray(sandbox_ids)) {
      terminatedIds = sandbox_ids;
    }

    if (terminatedIds.length === 0) {
      return NextResponse.json({
        message: 'No sandboxes to terminate',
        terminated: [],
      });
    }

    // Mark sandboxes as terminating
    await prisma.$executeRaw`
      UPDATE QUAD_sandbox_instances
      SET status = 'terminating',
          terminated_at = CURRENT_TIMESTAMP,
          terminated_by = ${session.user.id}::uuid,
          termination_reason = 'scale_down'
      WHERE id = ANY(${terminatedIds}::uuid[])
        AND org_id = ${user.company_id}::uuid
        AND status IN ('running', 'idle')
    `;

    // TODO: Trigger actual cloud resource termination via queue/job

    return NextResponse.json({
      message: `Initiated termination of ${terminatedIds.length} sandbox(es)`,
      terminated: terminatedIds,
    });
  } catch (error) {
    console.error('Scale-down error:', error);
    return NextResponse.json(
      { error: 'Failed to scale down', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
