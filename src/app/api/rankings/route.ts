/**
 * GET /api/rankings - Get current period rankings
 * POST /api/rankings/calculate - Trigger ranking calculation
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface UserRanking {
  id: string;
  user_id: string;
  org_id: string;
  period_start: Date;
  period_end: Date;
  delivery_score: number;
  quality_score: number;
  collaboration_score: number;
  learning_score: number;
  ai_adoption_score: number;
  final_score: number;
  tier: string;
  rank_in_org: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  org_id?: string;
}

interface RankingConfig {
  id: string;
  org_id: string;
  weight_delivery: number;
  weight_quality: number;
  weight_collaboration: number;
  weight_learning: number;
  weight_ai_adoption: number;
  delivery_factors?: Record<string, number>;
  quality_factors?: Record<string, number>;
  collaboration_factors?: Record<string, number>;
  learning_factors?: Record<string, number>;
  ai_factors?: Record<string, number>;
  calculation_period?: string;
  show_rankings_to_team?: boolean;
  anonymize_rankings?: boolean;
  created_at?: Date;
  updated_at?: Date;
  updated_by?: string | null;
}

interface Ticket {
  id: string;
  status: string;
  story_points: number | null;
  assigned_to: string | null;
  updated_at: Date;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findUserRankings(orgId: string, periodStart: Date, periodEnd: Date): Promise<UserRanking[]> {
  console.log('[STUB] findUserRankings called:', { orgId, periodStart, periodEnd });
  return [];
}

async function findUsersByIds(userIds: string[]): Promise<User[]> {
  console.log('[STUB] findUsersByIds called:', { userIds });
  return [];
}

async function findRankingConfig(orgId: string): Promise<RankingConfig | null> {
  console.log('[STUB] findRankingConfig called:', { orgId });
  return null;
}

async function createRankingConfig(data: Partial<RankingConfig>): Promise<RankingConfig> {
  console.log('[STUB] createRankingConfig called:', data);
  return {
    id: 'stub-id',
    org_id: data.org_id || '',
    weight_delivery: data.weight_delivery || 35,
    weight_quality: data.weight_quality || 25,
    weight_collaboration: data.weight_collaboration || 20,
    weight_learning: data.weight_learning || 15,
    weight_ai_adoption: data.weight_ai_adoption || 5
  };
}

async function findUsersByOrgId(orgId: string): Promise<User[]> {
  console.log('[STUB] findUsersByOrgId called:', { orgId });
  return [];
}

async function findTicketsByAssignee(userId: string, startDate: Date, endDate: Date): Promise<Ticket[]> {
  console.log('[STUB] findTicketsByAssignee called:', { userId, startDate, endDate });
  return [];
}

async function countKudosReceived(userId: string, startDate: Date, endDate: Date): Promise<number> {
  console.log('[STUB] countKudosReceived called:', { userId, startDate, endDate });
  return 0;
}

async function countUserSkillsUpdated(userId: string, startDate: Date, endDate: Date): Promise<number> {
  console.log('[STUB] countUserSkillsUpdated called:', { userId, startDate, endDate });
  return 0;
}

async function upsertUserRanking(
  userId: string,
  orgId: string,
  periodStart: Date,
  periodEnd: Date,
  data: Partial<UserRanking>
): Promise<UserRanking> {
  console.log('[STUB] upsertUserRanking called:', { userId, orgId, periodStart, periodEnd, data });
  return {
    id: 'stub-id',
    user_id: userId,
    org_id: orgId,
    period_start: periodStart,
    period_end: periodEnd,
    delivery_score: data.delivery_score || 0,
    quality_score: data.quality_score || 0,
    collaboration_score: data.collaboration_score || 0,
    learning_score: data.learning_score || 0,
    ai_adoption_score: data.ai_adoption_score || 0,
    final_score: data.final_score || 0,
    tier: data.tier || 'C',
    rank_in_org: data.rank_in_org || 0
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get rankings for current period
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    // Determine period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === 'current') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'previous') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      // Custom period format: YYYY-MM
      const [year, month] = period.split('-').map(Number);
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0);
    }

    // Get rankings for the period
    const rankings = await findUserRankings(payload.companyId, periodStart, periodEnd);

    // Get user details for rankings
    const userIds = rankings.map(r => r.user_id);
    const users = await findUsersByIds(userIds);

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get ranking config
    const config = await findRankingConfig(payload.companyId);

    const enrichedRankings = rankings.map(r => ({
      ...r,
      user: userMap.get(r.user_id) || { full_name: 'Unknown', email: '' }
    }));

    return NextResponse.json({
      period: {
        start: periodStart,
        end: periodEnd,
        label: `${periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      },
      config: config || {
        weight_delivery: 35,
        weight_quality: 25,
        weight_collaboration: 20,
        weight_learning: 15,
        weight_ai_adoption: 5
      },
      rankings: enrichedRankings,
      total_users: rankings.length
    });

  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Calculate rankings for current period
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get ranking config or use defaults
    let config = await findRankingConfig(payload.companyId);

    if (!config) {
      // Create default config
      config = await createRankingConfig({
        org_id: payload.companyId,
        weight_delivery: 35,
        weight_quality: 25,
        weight_collaboration: 20,
        weight_learning: 15,
        weight_ai_adoption: 5
      });
    }

    // Get current period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all users in org
    const users = await findUsersByOrgId(payload.companyId);

    // Calculate rankings for each user
    const rankings: Array<{
      userId: string;
      deliveryScore: number;
      qualityScore: number;
      collaborationScore: number;
      learningScore: number;
      aiScore: number;
      finalScore: number;
    }> = [];

    for (const user of users) {
      // Calculate delivery score
      const tickets = await findTicketsByAssignee(user.id, periodStart, periodEnd);

      const completedTickets = tickets.filter(t => t.status === 'done');
      const completionRate = tickets.length > 0 ? (completedTickets.length / tickets.length) * 100 : 50;
      const storyPoints = completedTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const onTimeRate = 70; // Placeholder - would need due_date tracking

      const deliveryScore = Math.min(100, (completionRate * 0.4) + (Math.min(storyPoints, 50) * 0.3 * 2) + (onTimeRate * 0.3));

      // Calculate quality score (placeholder - would need bug tracking)
      const qualityScore = 75;

      // Calculate collaboration score
      const kudosReceived = await countKudosReceived(user.id, periodStart, periodEnd);
      const collaborationScore = Math.min(100, 50 + (kudosReceived * 10));

      // Calculate learning score
      const skills = await countUserSkillsUpdated(user.id, periodStart, periodEnd);
      const learningScore = Math.min(100, 50 + (skills * 15));

      // Calculate AI adoption score (placeholder)
      const aiScore = 60;

      // Calculate final weighted score
      const finalScore =
        (deliveryScore * config.weight_delivery / 100) +
        (qualityScore * config.weight_quality / 100) +
        (collaborationScore * config.weight_collaboration / 100) +
        (learningScore * config.weight_learning / 100) +
        (aiScore * config.weight_ai_adoption / 100);

      rankings.push({
        userId: user.id,
        deliveryScore,
        qualityScore,
        collaborationScore,
        learningScore,
        aiScore,
        finalScore
      });
    }

    // Sort by final score and assign ranks
    rankings.sort((a, b) => b.finalScore - a.finalScore);

    // Determine tier based on score
    const getTier = (score: number): string => {
      if (score >= 95) return 'S';
      if (score >= 90) return 'A+';
      if (score >= 85) return 'A';
      if (score >= 80) return 'B+';
      if (score >= 75) return 'B';
      if (score >= 70) return 'C+';
      if (score >= 65) return 'C';
      if (score >= 50) return 'D';
      return 'F';
    };

    // Upsert rankings
    for (let i = 0; i < rankings.length; i++) {
      const r = rankings[i];
      await upsertUserRanking(r.userId, payload.companyId, periodStart, periodEnd, {
        delivery_score: r.deliveryScore,
        quality_score: r.qualityScore,
        collaboration_score: r.collaborationScore,
        learning_score: r.learningScore,
        ai_adoption_score: r.aiScore,
        final_score: r.finalScore,
        tier: getTier(r.finalScore),
        rank_in_org: i + 1
      });
    }

    return NextResponse.json({
      message: 'Rankings calculated successfully',
      period: { start: periodStart, end: periodEnd },
      users_ranked: rankings.length
    });

  } catch (error) {
    console.error('Calculate rankings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
