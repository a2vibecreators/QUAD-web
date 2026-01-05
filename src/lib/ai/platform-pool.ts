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

// NOTE: Prisma removed - using stubs until Java backend ready

// Free tier credit grant (500 cents = $5)
const FREE_TIER_GRANT_CENTS = 500;

/**
 * Get or create the platform pool singleton
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getOrCreatePlatformPool() {
  // TODO: Call Java backend to get or create platform pool
  console.log(`[PlatformPool] getOrCreatePlatformPool called`);

  // Return mock pool until backend ready
  return {
    id: 'platform_pool',
    pool_balance_cents: 100000, // $1000 mock balance
    total_purchased_cents: 100000,
    total_consumed_cents: 0,
    total_expired_cents: 0,
    free_tier_allocated_cents: 0,
    free_tier_consumed_cents: 0,
    breakage_rate_percent: 0,
    runway_days: 999,
    paying_orgs_count: 0,
    free_orgs_count: 0,
    byok_orgs_count: 0,
    month_start: new Date(),
    month_purchased_cents: 0,
    month_consumed_cents: 0,
    month_expired_cents: 0,
    month_free_allocated: 0,
    pool_low_alert_sent: false,
  };
}

/**
 * Record a purchase - user bought credits
 * This increases the pool's available funds
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordPurchase(
  orgId: string,
  orgName: string,
  amountCents: number
): Promise<void> {
  // TODO: Call Java backend to record purchase
  console.log(`[PlatformPool] recordPurchase for org: ${orgId}, amount: ${amountCents} cents`);
}

/**
 * Record consumption - actual AI API cost incurred
 * This decreases the pool (we paid the AI provider)
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordConsumption(
  orgId: string,
  amountCents: number,
  usageTransactionId?: string
): Promise<void> {
  // TODO: Call Java backend to record consumption
  console.log(`[PlatformPool] recordConsumption for org: ${orgId}, amount: ${amountCents} cents`);
}

/**
 * Record expiry - credits expired unused (breakage = profit)
 * This doesn't change pool balance (already in pool), just tracks it
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordExpiry(
  orgId: string,
  orgName: string,
  amountCents: number
): Promise<void> {
  // TODO: Call Java backend to record expiry
  console.log(`[PlatformPool] recordExpiry for org: ${orgId}, amount: ${amountCents} cents`);
}

/**
 * Grant free tier credits to a new org
 * This comes from the pool (funded by breakage)
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function grantFreeTierCredits(
  orgId: string,
  orgName: string
): Promise<{ granted: boolean; amountCents: number; reason?: string }> {
  // TODO: Call Java backend to grant free tier credits
  console.log(`[PlatformPool] grantFreeTierCredits for org: ${orgId}, name: ${orgName}`);

  return {
    granted: true,
    amountCents: FREE_TIER_GRANT_CENTS,
  };
}

/**
 * Record free tier usage (consumption from free user)
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordFreeTierUsage(
  orgId: string,
  amountCents: number
): Promise<void> {
  // TODO: Call Java backend to record free tier usage
  console.log(`[PlatformPool] recordFreeTierUsage for org: ${orgId}, amount: ${amountCents} cents`);
}

/**
 * Update the historical breakage rate
 * TODO: Implement via Java backend when endpoints are ready
 */
async function updateBreakageRate(): Promise<void> {
  // TODO: Call Java backend to update breakage rate
  console.log(`[PlatformPool] updateBreakageRate called`);
}

/**
 * Recalculate how many days we can fund free tier
 * TODO: Implement via Java backend when endpoints are ready
 */
async function recalculateRunway(): Promise<void> {
  // TODO: Call Java backend to recalculate runway
  console.log(`[PlatformPool] recalculateRunway called`);
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
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function resetMonthlyMetrics(): Promise<void> {
  // TODO: Call Java backend to reset monthly metrics
  console.log(`[PlatformPool] resetMonthlyMetrics called`);
}
