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
import { prisma } from '@/lib/prisma';
import { getPoolHealth } from '@/lib/ai/platform-pool';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (has ADMIN or OWNER role in any org)
    const userMemberships = await prisma.qUAD_org_members.findMany({
      where: {
        user_id: session.user.id,
        is_active: true,
      },
    });

    const isAdmin = userMemberships.some(
      (m) => m.role === 'ADMIN' || m.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get pool health
    const health = await getPoolHealth();

    // Get recent transactions
    const recentTransactions = await prisma.qUAD_platform_pool_transactions.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Get per-org usage breakdown
    const orgUsage = await prisma.qUAD_ai_credit_transactions.groupBy({
      by: ['org_id'],
      where: {
        transaction_type: 'usage',
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _sum: {
        amount_cents: true,
        total_tokens: true,
      },
      _count: {
        id: true,
      },
    });

    // Get org names
    const orgIds = orgUsage.map((o) => o.org_id);
    const orgs = await prisma.qUAD_organizations.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));

    // Get org tiers
    const orgBalances = await prisma.qUAD_ai_credit_balances.findMany({
      where: { org_id: { in: orgIds } },
      select: { org_id: true, tier_name: true, is_byok: true },
    });
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
    const userUsage = await prisma.qUAD_ai_credit_transactions.groupBy({
      by: ['user_id'],
      where: {
        transaction_type: 'usage',
        user_id: { not: null },
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        amount_cents: true,
        total_tokens: true,
      },
      _count: {
        id: true,
      },
    });

    // Get user names
    const userIds = userUsage.map((u) => u.user_id).filter(Boolean) as string[];
    const users = await prisma.qUAD_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true, email: true },
    });
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
