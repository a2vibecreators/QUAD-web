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

import { prisma } from '@/lib/prisma';
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
 */
export async function getOrCreateBalance(orgId: string) {
  let balance = await prisma.qUAD_ai_credit_balances.findUnique({
    where: { org_id: orgId },
  });

  if (!balance) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(1);
    periodEnd.setHours(0, 0, 0, 0);

    // Get org name for platform pool tracking
    const org = await prisma.qUAD_organizations.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    const orgName = org?.name || 'Unknown Org';

    // Request free tier credits from platform pool
    const poolGrant = await grantFreeTierCredits(orgId, orgName);

    const grantAmount = poolGrant.granted ? poolGrant.amountCents : 0;

    balance = await prisma.qUAD_ai_credit_balances.create({
      data: {
        org_id: orgId,
        credits_purchased_cents: grantAmount,
        credits_remaining_cents: grantAmount,
        billing_period_start: now,
        billing_period_end: periodEnd,
        period_credits_limit: grantAmount,
        tier_name: 'free',
        tier_monthly_usd: 0,
      },
    });

    // Record the free tier credit grant
    if (grantAmount > 0) {
      await prisma.qUAD_ai_credit_transactions.create({
        data: {
          balance_id: balance.id,
          org_id: orgId,
          transaction_type: 'bonus',
          amount_cents: grantAmount,
          balance_after_cents: grantAmount,
          description: `Welcome bonus: $${(grantAmount / 100).toFixed(2)} free credits (funded by platform pool)`,
        },
      });
    }
  }

  return balance;
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

  // Deduct credits atomically
  const updatedBalance = await prisma.qUAD_ai_credit_balances.update({
    where: { id: balance.id },
    data: {
      credits_used_cents: { increment: costCents },
      credits_remaining_cents: { decrement: costCents },
      period_credits_used: { increment: costCents },
    },
  });

  // Record the transaction with ticket info for per-ticket tracking
  await prisma.qUAD_ai_credit_transactions.create({
    data: {
      balance_id: balance.id,
      org_id: orgId,
      transaction_type: 'usage',
      amount_cents: -costCents, // Negative for deductions
      balance_after_cents: updatedBalance.credits_remaining_cents,

      // Link to AI request
      conversation_id: context.conversationId,
      message_id: context.messageId,
      ticket_id: context.ticketId,
      ticket_number: context.ticketNumber,

      // Token breakdown
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      total_tokens: usage.inputTokens + usage.outputTokens,

      // Provider info
      provider: usage.provider,
      model_id: usage.modelId,

      // Human-readable description
      description: context.ticketNumber
        ? `Ticket ${context.ticketNumber}: ${usage.inputTokens + usage.outputTokens} tokens`
        : `AI request: ${usage.inputTokens + usage.outputTokens} tokens`,

      user_id: userId,
    },
  });

  // Record consumption to platform pool (for reconciliation with Claude billing)
  // This tracks total AI costs across all users
  await recordConsumption(orgId, costCents);

  // If this is a free tier org, also track free tier usage
  if (balance.tier_name === 'free') {
    await recordFreeTierUsage(orgId, costCents);
  }

  // Check if we need to send alerts
  const creditPercent = (updatedBalance.credits_remaining_cents / balance.period_credits_limit) * 100;

  if (creditPercent <= 50 && !balance.alert_threshold_50) {
    await prisma.qUAD_ai_credit_balances.update({
      where: { id: balance.id },
      data: { alert_threshold_50: true },
    });
    // TODO: Send notification to org admins
    console.log(`[Credits] Org ${orgId} at 50% credits - alert would be sent`);
  }

  if (creditPercent <= 20 && !balance.alert_threshold_80) {
    await prisma.qUAD_ai_credit_balances.update({
      where: { id: balance.id },
      data: { alert_threshold_80: true },
    });
    console.log(`[Credits] Org ${orgId} at 80% usage - alert would be sent`);
  }

  if (creditPercent <= 5 && !balance.alert_threshold_95) {
    await prisma.qUAD_ai_credit_balances.update({
      where: { id: balance.id },
      data: { alert_threshold_95: true },
    });
    console.log(`[Credits] Org ${orgId} at 95% usage - CRITICAL alert would be sent`);
  }

  return {
    success: true,
    costCents,
    remainingCents: updatedBalance.credits_remaining_cents,
  };
}

/**
 * Get per-ticket cost breakdown for an org
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
  const { limit = 50, since } = options;

  const transactions = await prisma.qUAD_ai_credit_transactions.groupBy({
    by: ['ticket_id', 'ticket_number'],
    where: {
      org_id: orgId,
      transaction_type: 'usage',
      ticket_id: { not: null },
      created_at: since ? { gte: since } : undefined,
    },
    _sum: {
      amount_cents: true,
      total_tokens: true,
    },
    _count: {
      id: true,
    },
    _max: {
      created_at: true,
    },
    orderBy: {
      _sum: {
        amount_cents: 'asc', // Most expensive first (amount is negative)
      },
    },
    take: limit,
  });

  return transactions.map((t) => ({
    ticketId: t.ticket_id!,
    ticketNumber: t.ticket_number,
    totalCents: Math.abs(t._sum.amount_cents || 0),
    totalTokens: t._sum.total_tokens || 0,
    requestCount: t._count.id,
    lastUsed: t._max.created_at!,
  }));
}

/**
 * Process credit expiry at end of billing period
 * Called by a scheduled job (cron)
 *
 * Key behavior:
 * - Unused credits EXPIRE at billing period end
 * - We don't roll over credits (they're use-it-or-lose-it)
 * - But credits are SHARED across all users in the org during the period
 */
export async function processExpiringCredits(): Promise<{
  processed: number;
  totalExpired: number;
}> {
  const now = new Date();

  // Find all balances where billing period has ended
  const expiredBalances = await prisma.qUAD_ai_credit_balances.findMany({
    where: {
      billing_period_end: { lte: now },
      credits_remaining_cents: { gt: 0 },
      is_byok: false, // BYOK users don't have credits to expire
    },
  });

  let totalExpired = 0;

  for (const balance of expiredBalances) {
    const expiringCents = balance.credits_remaining_cents;

    // Record expiry transaction
    await prisma.qUAD_ai_credit_transactions.create({
      data: {
        balance_id: balance.id,
        org_id: balance.org_id,
        transaction_type: 'expiry',
        amount_cents: -expiringCents,
        balance_after_cents: 0,
        expired_from_period: balance.billing_period_end,
        description: `Credits expired: $${(expiringCents / 100).toFixed(2)} unused from ${balance.billing_period_start.toISOString().split('T')[0]} to ${balance.billing_period_end.toISOString().split('T')[0]}`,
      },
    });

    // Start new billing period
    const newPeriodStart = new Date(now);
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    newPeriodEnd.setDate(1);
    newPeriodEnd.setHours(0, 0, 0, 0);

    await prisma.qUAD_ai_credit_balances.update({
      where: { id: balance.id },
      data: {
        credits_expired_cents: { increment: expiringCents },
        credits_remaining_cents: 0,
        billing_period_start: newPeriodStart,
        billing_period_end: newPeriodEnd,
        period_credits_used: 0,
        // Reset alert flags for new period
        alert_threshold_50: false,
        alert_threshold_80: false,
        alert_threshold_95: false,
      },
    });

    totalExpired += expiringCents;
  }

  console.log(`[Credits] Processed ${expiredBalances.length} orgs, expired ${totalExpired} cents`);

  return {
    processed: expiredBalances.length,
    totalExpired,
  };
}
