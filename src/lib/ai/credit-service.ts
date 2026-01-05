/**
 * AI Credit Service
 *
 * Handles credit tracking and deduction for AI usage.
 *
 * Key features:
 * - Credits are POOLED per org (not per user)
 * - Any user in the org can use the org's credits
 * - Per-ticket cost tracking for transparency
 * - Real-time balance updates
 * - Credit expiry at billing period end
 */

// NOTE: Prisma removed - using stubs until Java backend ready
import { TOKEN_PRICING } from '@/lib/ai/providers';
import { recordConsumption, recordFreeTierUsage, grantFreeTierCredits } from '@/lib/ai/platform-pool';

// Free tier: $5.00 = 500 cents
const FREE_TIER_CREDITS_CENTS = 500;

// Convert tokens to cents based on model pricing
export function tokensToCents(
  inputTokens: number,
  outputTokens: number,
  modelId: string = 'claude-3-5-haiku-20241022'
): number {
  const pricing = TOKEN_PRICING[modelId as keyof typeof TOKEN_PRICING] ||
    TOKEN_PRICING['claude-3-5-haiku-20241022'];

  // Pricing is per million tokens, convert to cents
  const inputCostUsd = (inputTokens * pricing.input) / 1_000_000;
  const outputCostUsd = (outputTokens * pricing.output) / 1_000_000;
  const totalCents = Math.ceil((inputCostUsd + outputCostUsd) * 100);

  return totalCents;
}

/**
 * Get or create credit balance for an org
 * New orgs get FREE_TIER_CREDITS_CENTS ($5.00) to start - funded by platform pool
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getOrCreateBalance(orgId: string) {
  // TODO: Call Java backend to get or create balance
  console.log(`[CreditService] getOrCreateBalance for org: ${orgId}`);

  // Return mock balance until backend ready
  return {
    id: 'mock-balance-id',
    org_id: orgId,
    credits_purchased_cents: FREE_TIER_CREDITS_CENTS,
    credits_remaining_cents: FREE_TIER_CREDITS_CENTS,
    credits_used_cents: 0,
    credits_expired_cents: 0,
    billing_period_start: new Date(),
    billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    period_credits_limit: FREE_TIER_CREDITS_CENTS,
    period_credits_used: 0,
    tier_name: 'free',
    tier_monthly_usd: 0,
    is_byok: false,
    alert_threshold_50: false,
    alert_threshold_80: false,
    alert_threshold_95: false,
  };
}

/**
 * Check if org has sufficient credits for an AI request
 */
export async function hasCredits(orgId: string): Promise<{
  hasCredits: boolean;
  remainingCents: number;
  isByok: boolean;
}> {
  const balance = await getOrCreateBalance(orgId);

  // BYOK users always have "credits" - they use their own key
  if (balance.is_byok) {
    return { hasCredits: true, remainingCents: -1, isByok: true };
  }

  return {
    hasCredits: balance.credits_remaining_cents > 0,
    remainingCents: balance.credits_remaining_cents,
    isByok: false,
  };
}

/**
 * Deduct credits after an AI request
 *
 * This is called AFTER the AI request completes, with actual token usage.
 * Credits are deducted from the ORG pool (shared by all users).
 *
 * @param orgId - Organization ID
 * @param userId - User who made the request (for audit trail)
 * @param usage - Token usage details
 * @param context - Ticket/conversation context for per-ticket tracking
 */
export async function deductCredits(
  orgId: string,
  userId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    modelId: string;
    provider: string;
  },
  context: {
    conversationId?: string;
    messageId?: string;
    ticketId?: string;
    ticketNumber?: string;
  }
): Promise<{
  success: boolean;
  costCents: number;
  remainingCents: number;
  error?: string;
}> {
  const balance = await getOrCreateBalance(orgId);

  // BYOK users don't deduct credits
  if (balance.is_byok) {
    return {
      success: true,
      costCents: 0,
      remainingCents: -1, // -1 indicates BYOK (unlimited)
    };
  }

  // Calculate cost in cents
  const costCents = tokensToCents(
    usage.inputTokens,
    usage.outputTokens,
    usage.modelId
  );

  // Check if sufficient credits
  if (balance.credits_remaining_cents < costCents) {
    return {
      success: false,
      costCents,
      remainingCents: balance.credits_remaining_cents,
      error: `Insufficient credits. Need ${costCents} cents, have ${balance.credits_remaining_cents} cents.`,
    };
  }

  // TODO: Call Java backend to deduct credits and record transaction
  console.log(`[CreditService] deductCredits for org: ${orgId}, cost: ${costCents} cents`);

  // Record consumption to platform pool (for reconciliation with Claude billing)
  await recordConsumption(orgId, costCents);

  // If this is a free tier org, also track free tier usage
  if (balance.tier_name === 'free') {
    await recordFreeTierUsage(orgId, costCents);
  }

  return {
    success: true,
    costCents,
    remainingCents: balance.credits_remaining_cents - costCents,
  };
}

/**
 * Get per-ticket cost breakdown for an org
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function getTicketCosts(
  orgId: string,
  options: {
    limit?: number;
    since?: Date;
  } = {}
): Promise<{
  ticketId: string;
  ticketNumber: string | null;
  totalCents: number;
  totalTokens: number;
  requestCount: number;
  lastUsed: Date;
}[]> {
  // TODO: Call Java backend to get ticket costs
  console.log(`[CreditService] getTicketCosts for org: ${orgId}`);
  return []; // Return empty until backend ready
}

/**
 * Process credit expiry at end of billing period
 * Called by a scheduled job (cron)
 *
 * Key behavior:
 * - Unused credits EXPIRE at billing period end
 * - We don't roll over credits (they're use-it-or-lose-it)
 * - But credits are SHARED across all users in the org during the period
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function processExpiringCredits(): Promise<{
  processed: number;
  totalExpired: number;
}> {
  // TODO: Call Java backend to process expiring credits
  console.log(`[CreditService] processExpiringCredits called`);
  return {
    processed: 0,
    totalExpired: 0,
  };
}
