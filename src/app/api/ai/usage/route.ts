/**
 * GET /api/ai/usage
 *
 * Token usage analytics endpoint.
 * Tracks AI usage by:
 * - Ticket complexity (story points)
 * - Time period (daily, weekly, monthly)
 * - Cost estimation
 *
 * Query params:
 *   period: day | week | month | all (default: week)
 *   groupBy: ticket | user | domain (default: ticket)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { TOKEN_PRICING } from '@/lib/ai/providers';
import { getOrCreateBalance } from '@/lib/ai/credit-service';

// Conversation with messages
interface AIConversation {
  id: string;
  org_id: string;
  scope_type: string;
  scope_id: string | null;
  total_tokens_used: number;
  created_at: Date;
  messages: {
    tokens_used: number;
    role: string;
    provider: string | null;
    model_id: string | null;
    latency_ms: number | null;
    created_at: Date;
  }[];
}

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  story_points: number | null;
}

// TODO: Implement via Java backend when endpoints are ready
async function getConversations(orgId: string, startDate: Date): Promise<AIConversation[]> {
  console.log(`[AIUsage] getConversations for org: ${orgId}, since: ${startDate.toISOString()}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getTicketsByIds(ticketIds: string[]): Promise<Ticket[]> {
  console.log(`[AIUsage] getTicketsByIds: ${ticketIds.length} tickets`);
  return []; // Return empty until backend ready
}

// Haiku pricing (current default)
const HAIKU_PRICING = TOKEN_PRICING['claude-3-5-haiku-20241022'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get all AI conversations for this org
    const conversations = await getConversations(orgId, startDate);

    // Aggregate stats
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalMessages = 0;
    let totalConversations = conversations.length;
    let totalLatencyMs = 0;
    let latencyCount = 0;

    const ticketUsage: Record<string, {
      ticketId: string;
      conversations: number;
      messages: number;
      tokens: number;
      cost: number;
    }> = {};

    for (const conv of conversations) {
      for (const msg of conv.messages) {
        totalMessages++;
        totalTokens += msg.tokens_used;

        if (msg.role === 'user') {
          totalInputTokens += msg.tokens_used;
        } else if (msg.role === 'assistant') {
          totalOutputTokens += msg.tokens_used;
          if (msg.latency_ms) {
            totalLatencyMs += msg.latency_ms;
            latencyCount++;
          }
        }
      }

      // Track by ticket if scoped to ticket
      if (conv.scope_type === 'ticket' && conv.scope_id) {
        if (!ticketUsage[conv.scope_id]) {
          ticketUsage[conv.scope_id] = {
            ticketId: conv.scope_id,
            conversations: 0,
            messages: 0,
            tokens: 0,
            cost: 0,
          };
        }
        ticketUsage[conv.scope_id].conversations++;
        ticketUsage[conv.scope_id].messages += conv.messages.length;
        ticketUsage[conv.scope_id].tokens += conv.total_tokens_used;
      }
    }

    // Calculate cost (Haiku pricing)
    const inputCost = (totalInputTokens * HAIKU_PRICING.input) / 1_000_000;
    const outputCost = (totalOutputTokens * HAIKU_PRICING.output) / 1_000_000;
    const totalCost = inputCost + outputCost;

    // Get ticket complexity correlation (if tickets have story_points)
    const ticketIds = Object.keys(ticketUsage);
    const tickets = ticketIds.length > 0
      ? await getTicketsByIds(ticketIds)
      : [];

    // Build complexity vs tokens analysis
    const complexityAnalysis: {
      storyPoints: number | null;
      ticketCount: number;
      avgTokens: number;
      avgCost: number;
      avgMessages: number;
    }[] = [];

    const byComplexity: Record<string, { tokens: number; count: number; messages: number }> = {};

    for (const ticket of tickets) {
      const usage = ticketUsage[ticket.id];
      if (usage) {
        const key = ticket.story_points?.toString() || 'unestimated';
        if (!byComplexity[key]) {
          byComplexity[key] = { tokens: 0, count: 0, messages: 0 };
        }
        byComplexity[key].tokens += usage.tokens;
        byComplexity[key].count++;
        byComplexity[key].messages += usage.messages;
      }
    }

    for (const [sp, data] of Object.entries(byComplexity)) {
      const avgTokens = data.tokens / data.count;
      complexityAnalysis.push({
        storyPoints: sp === 'unestimated' ? null : parseInt(sp),
        ticketCount: data.count,
        avgTokens: Math.round(avgTokens),
        avgCost: (avgTokens * (HAIKU_PRICING.input + HAIKU_PRICING.output) / 2) / 1_000_000,
        avgMessages: Math.round(data.messages / data.count),
      });
    }

    // Sort by story points
    complexityAnalysis.sort((a, b) => (a.storyPoints || 0) - (b.storyPoints || 0));

    // Get credit balance for the org
    const creditBalance = await getOrCreateBalance(orgId);
    const daysRemaining = Math.max(
      0,
      Math.ceil((creditBalance.billing_period_end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        // Credit balance (org-wide, shared by all users)
        credits: {
          remainingCents: creditBalance.credits_remaining_cents,
          remainingUsd: (creditBalance.credits_remaining_cents / 100).toFixed(2),
          usedCents: creditBalance.credits_used_cents,
          usedUsd: (creditBalance.credits_used_cents / 100).toFixed(2),
          periodUsedCents: creditBalance.period_credits_used,
          periodLimitCents: creditBalance.period_credits_limit,
          periodUsedPercent: creditBalance.period_credits_limit > 0
            ? Math.round((creditBalance.period_credits_used / creditBalance.period_credits_limit) * 100)
            : 0,
          billingPeriodEnd: creditBalance.billing_period_end.toISOString(),
          daysRemaining,
          tier: creditBalance.tier_name,
          isByok: creditBalance.is_byok,
        },
        summary: {
          totalConversations,
          totalMessages,
          totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          avgLatencyMs: latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : 0,
        },
        cost: {
          inputCost: inputCost.toFixed(6),
          outputCost: outputCost.toFixed(6),
          totalCost: totalCost.toFixed(6),
          currency: 'USD',
          model: 'claude-3-5-haiku-20241022',
        },
        complexityAnalysis,
        tokenEstimates: {
          description: 'Estimated tokens by complexity based on your actual usage',
          estimates: complexityAnalysis.length > 0 ? complexityAnalysis : [
            { storyPoints: 1, avgTokens: 2000, note: 'No data yet - estimate based on typical usage' },
            { storyPoints: 3, avgTokens: 6000, note: 'No data yet - estimate based on typical usage' },
            { storyPoints: 5, avgTokens: 12000, note: 'No data yet - estimate based on typical usage' },
            { storyPoints: 8, avgTokens: 25000, note: 'No data yet - estimate based on typical usage' },
          ],
        },
        codebaseIndexing: {
          description: 'One-time index generation, then reused for all queries',
          withoutIndex: '50,000+ tokens per request',
          withIndex: '500-2,000 tokens per request',
          savings: '95%+ reduction',
          indexCost: 'Free (generated locally, stored in DB)',
        },
      },
    });

  } catch (error) {
    console.error('[AI Usage] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
