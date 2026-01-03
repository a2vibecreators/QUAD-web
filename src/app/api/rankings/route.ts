/**
 * GET /api/rankings - Get current period rankings
 * POST /api/rankings/calculate - Trigger ranking calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    const rankings = await prisma.qUAD_user_rankings.findMany({
      where: {
        org_id: payload.companyId,
        period_start: periodStart,
        period_end: periodEnd
      },
      orderBy: { rank_in_org: 'asc' }
    });

    // Get user details for rankings
    const userIds = rankings.map(r => r.user_id);
    const users = await prisma.qUAD_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true, email: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get ranking config
    const config = await prisma.qUAD_ranking_configs.findUnique({
      where: { org_id: payload.companyId }
    });

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
    let config = await prisma.qUAD_ranking_configs.findUnique({
      where: { org_id: payload.companyId }
    });

    if (!config) {
      // Create default config
      config = await prisma.qUAD_ranking_configs.create({
        data: {
          org_id: payload.companyId,
          weight_delivery: 35,
          weight_quality: 25,
          weight_collaboration: 20,
          weight_learning: 15,
          weight_ai_adoption: 5
        }
      });
    }

    // Get current period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all users in org
    const users = await prisma.qUAD_users.findMany({
      where: { org_id: payload.companyId }
    });

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
      const tickets = await prisma.qUAD_tickets.findMany({
        where: {
          assigned_to: user.id,
          updated_at: { gte: periodStart, lte: periodEnd }
        }
      });

      const completedTickets = tickets.filter(t => t.status === 'done');
      const completionRate = tickets.length > 0 ? (completedTickets.length / tickets.length) * 100 : 50;
      const storyPoints = completedTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const onTimeRate = 70; // Placeholder - would need due_date tracking

      const deliveryScore = Math.min(100, (completionRate * 0.4) + (Math.min(storyPoints, 50) * 0.3 * 2) + (onTimeRate * 0.3));

      // Calculate quality score (placeholder - would need bug tracking)
      const qualityScore = 75;

      // Calculate collaboration score
      const kudosReceived = await prisma.qUAD_kudos.count({
        where: {
          to_user_id: user.id,
          created_at: { gte: periodStart, lte: periodEnd }
        }
      });
      const collaborationScore = Math.min(100, 50 + (kudosReceived * 10));

      // Calculate learning score
      const skills = await prisma.qUAD_user_skills.count({
        where: {
          user_id: user.id,
          updated_at: { gte: periodStart, lte: periodEnd }
        }
      });
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
      await prisma.qUAD_user_rankings.upsert({
        where: {
          user_id_period_start_period_end: {
            user_id: r.userId,
            period_start: periodStart,
            period_end: periodEnd
          }
        },
        update: {
          delivery_score: r.deliveryScore,
          quality_score: r.qualityScore,
          collaboration_score: r.collaborationScore,
          learning_score: r.learningScore,
          ai_adoption_score: r.aiScore,
          final_score: r.finalScore,
          tier: getTier(r.finalScore),
          rank_in_org: i + 1
        },
        create: {
          user_id: r.userId,
          org_id: payload.companyId,
          period_start: periodStart,
          period_end: periodEnd,
          delivery_score: r.deliveryScore,
          quality_score: r.qualityScore,
          collaboration_score: r.collaborationScore,
          learning_score: r.learningScore,
          ai_adoption_score: r.aiScore,
          final_score: r.finalScore,
          tier: getTier(r.finalScore),
          rank_in_org: i + 1
        }
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
