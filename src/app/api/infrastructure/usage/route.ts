import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface InfraConfig {
  sandbox_strategy: string;
  sandbox_pool_size: number;
  sandbox_dedicated_timeout_hours: number;
  cloud_provider: string;
}

interface SandboxCount {
  mode: string;
  status: string;
  count: number;
}

interface IdleCandidate {
  id: string;
  mode: string;
  status: string;
  idle_hours: number;
  cloud_instance_id: string | null;
  assigned_user_email: string | null;
}

interface ResourceMetrics {
  avg_cpu: number;
  max_cpu: number;
  avg_memory: number;
  max_memory: number;
  total_api_calls: number;
  total_cost: number;
}

interface TerminationCandidate {
  sandbox_id: string;
  termination_reason: string;
}

interface User {
  id: string;
  company_id: string | null;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function getUserCompanyId(userId: string): Promise<string | null> {
  console.log(`[InfraUsage] getUserCompanyId stub called: ${userId}`);
  return 'mock-company-id';
}

async function getInfraConfig(orgId: string): Promise<InfraConfig> {
  console.log(`[InfraUsage] getInfraConfig stub called: ${orgId}`);
  return {
    sandbox_strategy: 'shared',
    sandbox_pool_size: 2,
    sandbox_dedicated_timeout_hours: 24,
    cloud_provider: 'gcp',
  };
}

async function getSandboxCounts(orgId: string): Promise<SandboxCount[]> {
  console.log(`[InfraUsage] getSandboxCounts stub called: ${orgId}`);
  return [];
}

async function getIdleCandidates(orgId: string): Promise<IdleCandidate[]> {
  console.log(`[InfraUsage] getIdleCandidates stub called: ${orgId}`);
  return [];
}

async function getResourceMetrics(orgId: string): Promise<ResourceMetrics | null> {
  console.log(`[InfraUsage] getResourceMetrics stub called: ${orgId}`);
  return null;
}

async function getUserById(userId: string): Promise<User | null> {
  console.log(`[InfraUsage] getUserById stub called: ${userId}`);
  return { id: userId, company_id: 'mock-company-id' };
}

async function getSandboxesToTerminate(orgId: string): Promise<TerminationCandidate[]> {
  console.log(`[InfraUsage] getSandboxesToTerminate stub called: ${orgId}`);
  return [];
}

async function markSandboxesForTermination(
  sandboxIds: string[],
  orgId: string,
  terminatedBy: string
): Promise<void> {
  console.log(`[InfraUsage] markSandboxesForTermination stub called:`, { sandboxIds, orgId, terminatedBy });
}

// ============================================================================
// API Routes
// ============================================================================

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
    let orgId = await getUserCompanyId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Allow override via query param
    orgId = searchParams.get('org_id') || orgId;

    // Get infrastructure config
    const infraConfig = await getInfraConfig(orgId);

    // Get sandbox counts by mode and status
    const sandboxCounts = await getSandboxCounts(orgId);

    // Get idle sandboxes eligible for termination
    const idleCandidates = await getIdleCandidates(orgId);

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
    let resourceMetrics: ResourceMetrics | null = null;
    if (includeMetrics) {
      resourceMetrics = await getResourceMetrics(orgId);
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
    const user = await getUserById(session.user.id);

    if (!user?.company_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    let terminatedIds: string[] = [];

    if (auto) {
      // Auto-select sandboxes to terminate using the stub function
      const candidates = await getSandboxesToTerminate(user.company_id);
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
    await markSandboxesForTermination(terminatedIds, user.company_id, session.user.id);

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
