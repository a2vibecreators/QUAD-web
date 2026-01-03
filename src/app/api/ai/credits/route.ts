/**
 * AI Credit Balance API
 *
 * GET /api/ai/credits - Get org's credit balance
 * POST /api/ai/credits - Initialize credits for new org (free tier)
 *
 * Shows:
 * - Total credits purchased/used/remaining
 * - Credits used this billing period
 * - Per-ticket cost breakdown
 * - Billing period info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { TOKEN_PRICING } from '@/lib/ai/providers';

// Free tier: $5.00 = 500 cents
const FREE_TIER_CREDITS_CENTS = 500;

// Haiku pricing for cost calculation
const HAIKU_PRICING = TOKEN_PRICING['claude-3-5-haiku-20241022'];

/**
 * GET /api/ai/credits
 * Returns credit balance and usage breakdown for the org
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const includeTickets = searchParams.get('includeTickets') !== 'false';
    const period = searchParams.get('period') || 'current'; // current, month, all

    // Get or create credit balance
    let balance = await prisma.qUAD_ai_credit_balances.findUnique({
      where: { org_id: orgId },
    });

    // If no balance exists, create one with free tier credits
    if (!balance) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(1); // First of next month
      periodEnd.setHours(0, 0, 0, 0);

      balance = await prisma.qUAD_ai_credit_balances.create({
        data: {
          org_id: orgId,
          credits_purchased_cents: FREE_TIER_CREDITS_CENTS,
          credits_remaining_cents: FREE_TIER_CREDITS_CENTS,
          billing_period_start: now,
          billing_period_end: periodEnd,
          period_credits_limit: FREE_TIER_CREDITS_CENTS,
          tier_name: 'free',
          tier_monthly_usd: 0,
        },
      });

      // Record the free tier credit grant
      await prisma.qUAD_ai_credit_transactions.create({
        data: {
          balance_id: balance.id,
          org_id: orgId,
          transaction_type: 'bonus',
          amount_cents: FREE_TIER_CREDITS_CENTS,
          balance_after_cents: FREE_TIER_CREDITS_CENTS,
          description: 'Welcome bonus: $5.00 free credits',
        },
      });
    }

    // Get recent transactions
    const transactions = await prisma.qUAD_ai_credit_transactions.findMany({
      where: {
        org_id: orgId,
        transaction_type: 'usage',
        created_at: period === 'current'
          ? { gte: balance.billing_period_start }
          : period === 'month'
          ? { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          : undefined,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    // Calculate per-ticket costs
    const ticketCosts: Record<string, {
      ticketId: string;
      ticketNumber: string | null;
      totalCents: number;
      totalTokens: number;
      requestCount: number;
      lastUsed: Date;
    }> = {};

    for (const tx of transactions) {
      if (tx.ticket_id) {
        if (!ticketCosts[tx.ticket_id]) {
          ticketCosts[tx.ticket_id] = {
            ticketId: tx.ticket_id,
            ticketNumber: tx.ticket_number,
            totalCents: 0,
            totalTokens: 0,
            requestCount: 0,
            lastUsed: tx.created_at,
          };
        }
        ticketCosts[tx.ticket_id].totalCents += Math.abs(tx.amount_cents);
        ticketCosts[tx.ticket_id].totalTokens += tx.total_tokens || 0;
        ticketCosts[tx.ticket_id].requestCount++;
        if (tx.created_at > ticketCosts[tx.ticket_id].lastUsed) {
          ticketCosts[tx.ticket_id].lastUsed = tx.created_at;
        }
      }
    }

    // Sort tickets by cost (highest first)
    const ticketBreakdown = Object.values(ticketCosts)
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 20) // Top 20 tickets
      .map(t => ({
        ...t,
        totalUsd: (t.totalCents / 100).toFixed(4),
      }));

    // Calculate usage by day for chart
    const dailyUsage: Record<string, number> = {};
    for (const tx of transactions) {
      const day = tx.created_at.toISOString().split('T')[0];
      dailyUsage[day] = (dailyUsage[day] || 0) + Math.abs(tx.amount_cents);
    }

    // Days remaining in billing period
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((balance.billing_period_end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    // Calculate burn rate
    const daysSinceStart = Math.max(
      1,
      Math.ceil((now.getTime() - balance.billing_period_start.getTime()) / (24 * 60 * 60 * 1000))
    );
    const burnRateCentsPerDay = balance.period_credits_used / daysSinceStart;
    const projectedOverage = burnRateCentsPerDay * daysRemaining > balance.credits_remaining_cents;

    return NextResponse.json({
      success: true,
      data: {
        // Credit summary
        balance: {
          totalPurchasedCents: balance.credits_purchased_cents,
          totalUsedCents: balance.credits_used_cents,
          totalExpiredCents: balance.credits_expired_cents,
          remainingCents: balance.credits_remaining_cents,
          // USD equivalents
          totalPurchasedUsd: (balance.credits_purchased_cents / 100).toFixed(2),
          totalUsedUsd: (balance.credits_used_cents / 100).toFixed(2),
          remainingUsd: (balance.credits_remaining_cents / 100).toFixed(2),
        },

        // Current billing period
        billingPeriod: {
          start: balance.billing_period_start.toISOString(),
          end: balance.billing_period_end.toISOString(),
          daysRemaining,
          creditsLimitCents: balance.period_credits_limit,
          creditsUsedCents: balance.period_credits_used,
          creditsUsedPercent: balance.period_credits_limit > 0
            ? Math.round((balance.period_credits_used / balance.period_credits_limit) * 100)
            : 0,
        },

        // Projections
        projections: {
          burnRateCentsPerDay: Math.round(burnRateCentsPerDay),
          burnRateUsdPerDay: (burnRateCentsPerDay / 100).toFixed(4),
          projectedOverage,
          projectedEndBalanceCents: Math.round(
            balance.credits_remaining_cents - (burnRateCentsPerDay * daysRemaining)
          ),
        },

        // Tier info
        tier: {
          name: balance.tier_name,
          monthlyUsd: balance.tier_monthly_usd?.toString() || '0',
          isByok: balance.is_byok,
          byokProvider: balance.byok_provider,
        },

        // Per-ticket breakdown (if requested)
        ticketBreakdown: includeTickets ? ticketBreakdown : undefined,

        // Daily usage for chart
        dailyUsage: Object.entries(dailyUsage)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, cents]) => ({
            date,
            cents,
            usd: (cents / 100).toFixed(4),
          })),

        // Recent transactions
        recentTransactions: transactions.slice(0, 10).map(tx => ({
          id: tx.id,
          type: tx.transaction_type,
          amountCents: tx.amount_cents,
          amountUsd: (Math.abs(tx.amount_cents) / 100).toFixed(4),
          ticketNumber: tx.ticket_number,
          description: tx.description,
          tokens: tx.total_tokens,
          createdAt: tx.created_at.toISOString(),
        })),

        // Alerts
        alerts: {
          lowCredits: balance.credits_remaining_cents < balance.period_credits_limit * 0.2,
          nearLimit: balance.period_credits_used > balance.period_credits_limit * 0.8,
          projectedOverage,
          expiringIn: daysRemaining <= 7 ? daysRemaining : null,
        },
      },
    });
  } catch (error) {
    console.error('[Credits] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

/**
 * POST /api/ai/credits
 * Initialize credits for a new org, or add credits (purchase)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.companyId;
    const body = await request.json();
    const { action, amountCents, paymentId, tier } = body;

    let balance = await prisma.qUAD_ai_credit_balances.findUnique({
      where: { org_id: orgId },
    });

    const now = new Date();

    switch (action) {
      case 'purchase': {
        if (!amountCents || amountCents <= 0) {
          return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if (!balance) {
          // Create balance first
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(1);
          periodEnd.setHours(0, 0, 0, 0);

          balance = await prisma.qUAD_ai_credit_balances.create({
            data: {
              org_id: orgId,
              billing_period_start: now,
              billing_period_end: periodEnd,
              tier_name: tier || 'starter',
            },
          });
        }

        // Add credits
        const updatedBalance = await prisma.qUAD_ai_credit_balances.update({
          where: { id: balance.id },
          data: {
            credits_purchased_cents: { increment: amountCents },
            credits_remaining_cents: { increment: amountCents },
            period_credits_limit: { increment: amountCents },
            tier_name: tier || balance.tier_name,
            tier_monthly_usd: tier === 'starter' ? 10 : tier === 'pro' ? 25 : tier === 'enterprise' ? 50 : balance.tier_monthly_usd,
          },
        });

        // Record transaction
        await prisma.qUAD_ai_credit_transactions.create({
          data: {
            balance_id: balance.id,
            org_id: orgId,
            transaction_type: 'purchase',
            amount_cents: amountCents,
            balance_after_cents: updatedBalance.credits_remaining_cents,
            payment_id: paymentId,
            user_id: session.user.id,
            description: `Purchased $${(amountCents / 100).toFixed(2)} credits`,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            creditsAdded: amountCents,
            newBalance: updatedBalance.credits_remaining_cents,
          },
        });
      }

      case 'enable_byok': {
        const { provider, apiKey } = body;
        if (!provider || !apiKey) {
          return NextResponse.json({ error: 'Provider and API key required' }, { status: 400 });
        }

        // Update to BYOK mode
        await prisma.qUAD_ai_credit_balances.update({
          where: { id: balance?.id },
          data: {
            is_byok: true,
            byok_provider: provider,
            period_credits_limit: 0, // Unlimited when BYOK
          },
        });

        // Store API key in BYOK config (encrypted storage would be in QUAD_ai_provider_config)
        // This is just setting the flag - actual key storage is separate

        return NextResponse.json({
          success: true,
          message: 'BYOK enabled - you will use your own API key',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Credits] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
