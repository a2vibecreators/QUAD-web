/**
 * Platform Credit Pool Service
 *
 * Manages the platform-wide credit economy:
 * - Paying users' unused credits become "breakage"
 * - Breakage funds the free tier for new users
 * - Tracks pool health and runway
 *
 * Business Model:
 * 1. Users pay $10/month for credits
 * 2. Average usage is ~60% (they use $6 worth)
 * 3. Unused 40% ($4) becomes breakage
 * 4. Breakage funds free tier for new users
 * 5. Self-sustaining growth model
 */

import { prisma } from '@/lib/prisma';

// Free tier credit grant (500 cents = $5)
const FREE_TIER_GRANT_CENTS = 500;

/**
 * Get or create the platform pool singleton
 */
export async function getOrCreatePlatformPool() {
  let pool = await prisma.qUAD_platform_credit_pool.findUnique({
    where: { id: 'platform_pool' },
  });

  if (!pool) {
    pool = await prisma.qUAD_platform_credit_pool.create({
      data: {
        id: 'platform_pool',
        month_start: new Date(),
      },
    });
  }

  return pool;
}

/**
 * Record a purchase - user bought credits
 * This increases the pool's available funds
 */
export async function recordPurchase(
  orgId: string,
  orgName: string,
  amountCents: number
): Promise<void> {
  const pool = await getOrCreatePlatformPool();

  // Update pool totals
  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      total_purchased_cents: { increment: amountCents },
      pool_balance_cents: { increment: amountCents },
      month_purchased_cents: { increment: amountCents },
      paying_orgs_count: { increment: 1 },
    },
  });

  // Record transaction
  await prisma.qUAD_platform_pool_transactions.create({
    data: {
      transaction_type: 'purchase',
      org_id: orgId,
      org_name: orgName,
      amount_cents: amountCents,
      pool_balance_after: pool.pool_balance_cents + amountCents,
      description: `${orgName} purchased $${(amountCents / 100).toFixed(2)} credits`,
    },
  });

  // Recalculate runway
  await recalculateRunway();
}

/**
 * Record consumption - actual AI API cost incurred
 * This decreases the pool (we paid the AI provider)
 */
export async function recordConsumption(
  orgId: string,
  amountCents: number,
  usageTransactionId?: string
): Promise<void> {
  const pool = await getOrCreatePlatformPool();

  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      total_consumed_cents: { increment: amountCents },
      pool_balance_cents: { decrement: amountCents },
      month_consumed_cents: { increment: amountCents },
    },
  });

  await prisma.qUAD_platform_pool_transactions.create({
    data: {
      transaction_type: 'consumption',
      org_id: orgId,
      amount_cents: -amountCents,
      pool_balance_after: pool.pool_balance_cents - amountCents,
      usage_transaction_id: usageTransactionId,
      description: `AI API cost: $${(amountCents / 100).toFixed(4)}`,
    },
  });
}

/**
 * Record expiry - credits expired unused (breakage = profit)
 * This doesn't change pool balance (already in pool), just tracks it
 */
export async function recordExpiry(
  orgId: string,
  orgName: string,
  amountCents: number
): Promise<void> {
  const pool = await getOrCreatePlatformPool();

  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      total_expired_cents: { increment: amountCents },
      month_expired_cents: { increment: amountCents },
    },
  });

  await prisma.qUAD_platform_pool_transactions.create({
    data: {
      transaction_type: 'expiry',
      org_id: orgId,
      org_name: orgName,
      amount_cents: amountCents, // Positive = stays in pool
      pool_balance_after: pool.pool_balance_cents, // No change
      description: `${orgName} credits expired: $${(amountCents / 100).toFixed(2)} (retained as breakage)`,
    },
  });

  // Update breakage rate
  await updateBreakageRate();
}

/**
 * Grant free tier credits to a new org
 * This comes from the pool (funded by breakage)
 */
export async function grantFreeTierCredits(
  orgId: string,
  orgName: string
): Promise<{ granted: boolean; amountCents: number; reason?: string }> {
  const pool = await getOrCreatePlatformPool();

  // Check if pool has enough for free tier grant
  if (pool.pool_balance_cents < FREE_TIER_GRANT_CENTS) {
    console.warn('[Platform Pool] Insufficient funds for free tier grant');
    return {
      granted: false,
      amountCents: 0,
      reason: 'Platform pool has insufficient funds. Please try again later.',
    };
  }

  // Deduct from pool
  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      free_tier_allocated_cents: { increment: FREE_TIER_GRANT_CENTS },
      pool_balance_cents: { decrement: FREE_TIER_GRANT_CENTS },
      month_free_allocated: { increment: FREE_TIER_GRANT_CENTS },
      free_orgs_count: { increment: 1 },
    },
  });

  await prisma.qUAD_platform_pool_transactions.create({
    data: {
      transaction_type: 'free_grant',
      org_id: orgId,
      org_name: orgName,
      amount_cents: -FREE_TIER_GRANT_CENTS, // Negative = leaves pool
      pool_balance_after: pool.pool_balance_cents - FREE_TIER_GRANT_CENTS,
      description: `Free tier grant to ${orgName}: $${(FREE_TIER_GRANT_CENTS / 100).toFixed(2)}`,
    },
  });

  // Recalculate runway
  await recalculateRunway();

  return {
    granted: true,
    amountCents: FREE_TIER_GRANT_CENTS,
  };
}

/**
 * Record free tier usage (consumption from free user)
 */
export async function recordFreeTierUsage(
  orgId: string,
  amountCents: number
): Promise<void> {
  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      free_tier_consumed_cents: { increment: amountCents },
    },
  });
}

/**
 * Update the historical breakage rate
 */
async function updateBreakageRate(): Promise<void> {
  const pool = await getOrCreatePlatformPool();

  if (pool.total_purchased_cents > 0) {
    const breakageRate = (pool.total_expired_cents / pool.total_purchased_cents) * 100;
    await prisma.qUAD_platform_credit_pool.update({
      where: { id: 'platform_pool' },
      data: {
        breakage_rate_percent: breakageRate,
      },
    });
  }
}

/**
 * Recalculate how many days we can fund free tier
 */
async function recalculateRunway(): Promise<void> {
  const pool = await getOrCreatePlatformPool();

  // Average daily free tier cost
  const daysSinceMonthStart = Math.max(
    1,
    Math.ceil((Date.now() - pool.month_start.getTime()) / (24 * 60 * 60 * 1000))
  );
  const avgDailyFreeTierCost = pool.month_free_allocated / daysSinceMonthStart;

  // Calculate runway
  const runwayDays = avgDailyFreeTierCost > 0
    ? Math.floor(pool.pool_balance_cents / avgDailyFreeTierCost)
    : 999; // Effectively unlimited if no free tier grants yet

  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      runway_days: runwayDays,
      pool_low_alert_sent: runwayDays < 30 ? pool.pool_low_alert_sent : false,
    },
  });

  // Alert if runway is low
  if (runwayDays < 30 && !pool.pool_low_alert_sent) {
    console.warn(`[Platform Pool] LOW RUNWAY ALERT: Only ${runwayDays} days of free tier funding remaining`);
    await prisma.qUAD_platform_credit_pool.update({
      where: { id: 'platform_pool' },
      data: { pool_low_alert_sent: true },
    });
    // TODO: Send email alert to admins
  }
}

/**
 * Get pool health summary for admin dashboard
 */
export async function getPoolHealth(): Promise<{
  balance: { cents: number; usd: string };
  runway: { days: number; status: 'healthy' | 'warning' | 'critical' };
  breakage: { rate: number; totalCents: number };
  freeTier: { allocatedCents: number; consumedCents: number; utilizationRate: number };
  orgCounts: { paying: number; free: number; byok: number };
  monthlyMetrics: {
    purchased: number;
    consumed: number;
    expired: number;
    freeAllocated: number;
    netChange: number;
  };
}> {
  const pool = await getOrCreatePlatformPool();

  const runwayStatus = pool.runway_days < 14 ? 'critical'
    : pool.runway_days < 30 ? 'warning'
    : 'healthy';

  const freeTierUtilization = pool.free_tier_allocated_cents > 0
    ? (pool.free_tier_consumed_cents / pool.free_tier_allocated_cents) * 100
    : 0;

  return {
    balance: {
      cents: pool.pool_balance_cents,
      usd: (pool.pool_balance_cents / 100).toFixed(2),
    },
    runway: {
      days: pool.runway_days,
      status: runwayStatus,
    },
    breakage: {
      rate: pool.breakage_rate_percent,
      totalCents: pool.total_expired_cents,
    },
    freeTier: {
      allocatedCents: pool.free_tier_allocated_cents,
      consumedCents: pool.free_tier_consumed_cents,
      utilizationRate: Math.round(freeTierUtilization),
    },
    orgCounts: {
      paying: pool.paying_orgs_count,
      free: pool.free_orgs_count,
      byok: pool.byok_orgs_count,
    },
    monthlyMetrics: {
      purchased: pool.month_purchased_cents,
      consumed: pool.month_consumed_cents,
      expired: pool.month_expired_cents,
      freeAllocated: pool.month_free_allocated,
      netChange: pool.month_purchased_cents - pool.month_consumed_cents - pool.month_free_allocated,
    },
  };
}

/**
 * Reset monthly metrics (called by cron at start of each month)
 */
export async function resetMonthlyMetrics(): Promise<void> {
  await prisma.qUAD_platform_credit_pool.update({
    where: { id: 'platform_pool' },
    data: {
      month_start: new Date(),
      month_purchased_cents: 0,
      month_consumed_cents: 0,
      month_expired_cents: 0,
      month_free_allocated: 0,
    },
  });
}
