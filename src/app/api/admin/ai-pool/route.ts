/**
 * GET /api/admin/ai-pool
 *
 * Admin endpoint for monitoring the platform credit pool.
 * Shows platform-wide credit economy health.
 *
 * Access: Admin users only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { getPoolHealth } from '@/lib/ai/platform-pool';

// Types
interface OrgMembership {
  user_id: string;
  role: string;
  is_active: boolean;
}

interface PoolTransaction {
  id: string;
  transaction_type: string;
  org_name: string | null;
  amount_cents: number;
  pool_balance_after: number;
  description: string | null;
  created_at: Date;
}

interface OrgUsageGroup {
  org_id: string;
  _sum: { amount_cents: number | null; total_tokens: number | null };
  _count: { id: number };
}

interface UserUsageGroup {
  user_id: string | null;
  _sum: { amount_cents: number | null; total_tokens: number | null };
  _count: { id: number };
}

interface Organization {
  id: string;
  name: string;
}

interface CreditBalance {
  org_id: string;
  tier_name: string;
  is_byok: boolean;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserMemberships(userId: string): Promise<OrgMembership[]> {
  console.log(`[AdminAIPool] getUserMemberships for user: ${userId}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getRecentPoolTransactions(limit: number): Promise<PoolTransaction[]> {
  console.log(`[AdminAIPool] getRecentPoolTransactions limit: ${limit}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrgCreditUsageGrouped(since: Date): Promise<OrgUsageGroup[]> {
  console.log(`[AdminAIPool] getOrgCreditUsageGrouped since: ${since.toISOString()}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrganizationsByIds(orgIds: string[]): Promise<Organization[]> {
  console.log(`[AdminAIPool] getOrganizationsByIds: ${orgIds.length} orgs`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getCreditBalancesByOrgIds(orgIds: string[]): Promise<CreditBalance[]> {
  console.log(`[AdminAIPool] getCreditBalancesByOrgIds: ${orgIds.length} orgs`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserCreditUsageGrouped(since: Date): Promise<UserUsageGroup[]> {
  console.log(`[AdminAIPool] getUserCreditUsageGrouped since: ${since.toISOString()}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getUsersByIds(userIds: string[]): Promise<User[]> {
  console.log(`[AdminAIPool] getUsersByIds: ${userIds.length} users`);
  return []; // Return empty until backend ready
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has ADMIN or OWNER role in any org)
    const userMemberships = await getUserMemberships(session.user.id);

    const isAdmin = userMemberships.some(
      (m) => m.role === 'ADMIN' || m.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get pool health
    const health = await getPoolHealth();

    // Get recent transactions
    const recentTransactions = await getRecentPoolTransactions(50);

    // Get per-org usage breakdown (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orgUsage = await getOrgCreditUsageGrouped(thirtyDaysAgo);

    // Get org names
    const orgIds = orgUsage.map((o) => o.org_id);
    const orgs = await getOrganizationsByIds(orgIds);
    const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));

    // Get org tiers
    const orgBalances = await getCreditBalancesByOrgIds(orgIds);
    const orgTierMap = new Map(orgBalances.map((b) => [b.org_id, { tier: b.tier_name, isByok: b.is_byok }]));

    const orgBreakdown = orgUsage
      .map((o) => ({
        orgId: o.org_id,
        orgName: orgNameMap.get(o.org_id) || 'Unknown',
        tier: orgTierMap.get(o.org_id)?.tier || 'unknown',
        isByok: orgTierMap.get(o.org_id)?.isByok || false,
        totalCostCents: Math.abs(o._sum.amount_cents || 0),
        totalCostUsd: (Math.abs(o._sum.amount_cents || 0) / 100).toFixed(2),
        totalTokens: o._sum.total_tokens || 0,
        requestCount: o._count.id,
      }))
      .sort((a, b) => b.totalCostCents - a.totalCostCents);

    // Get per-user usage breakdown
    const userUsage = await getUserCreditUsageGrouped(thirtyDaysAgo);

    // Get user names
    const userIds = userUsage.map((u) => u.user_id).filter(Boolean) as string[];
    const users = await getUsersByIds(userIds);
    const userNameMap = new Map(users.map((u) => [u.id, { name: u.full_name, email: u.email }]));

    const userBreakdown = userUsage
      .filter((u) => u.user_id)
      .map((u) => ({
        userId: u.user_id,
        userName: userNameMap.get(u.user_id!)?.name || 'Unknown',
        userEmail: userNameMap.get(u.user_id!)?.email || 'Unknown',
        totalCostCents: Math.abs(u._sum.amount_cents || 0),
        totalCostUsd: (Math.abs(u._sum.amount_cents || 0) / 100).toFixed(2),
        totalTokens: u._sum.total_tokens || 0,
        requestCount: u._count.id,
      }))
      .sort((a, b) => b.totalCostCents - a.totalCostCents)
      .slice(0, 20); // Top 20 users

    return NextResponse.json({
      success: true,
      data: {
        health,

        // Reconciliation data (match with Claude billing)
        reconciliation: {
          totalConsumedCents: health.monthlyMetrics.consumed,
          totalConsumedUsd: (health.monthlyMetrics.consumed / 100).toFixed(2),
          totalRequests: orgUsage.reduce((sum, o) => sum + o._count.id, 0),
          totalTokens: orgUsage.reduce((sum, o) => sum + (o._sum.total_tokens || 0), 0),
        },

        // Per-org breakdown
        orgBreakdown: orgBreakdown.slice(0, 20),

        // Per-user breakdown
        userBreakdown,

        // Recent pool transactions
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          type: tx.transaction_type,
          orgName: tx.org_name,
          amountCents: tx.amount_cents,
          amountUsd: (Math.abs(tx.amount_cents) / 100).toFixed(4),
          poolBalanceAfter: tx.pool_balance_after,
          description: tx.description,
          createdAt: tx.created_at.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[Admin AI Pool] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data' }, { status: 500 });
  }
}
