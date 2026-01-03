/**
 * GET /api/dashboard/velocity - Get velocity metrics across cycles
 *
 * Returns historical velocity data for trend analysis:
 * - Velocity per cycle (story points completed)
 * - Average velocity
 * - Velocity trend (improving/declining)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface CycleVelocity {
  cycle_id: string;
  cycle_name: string;
  cycle_number: number;
  domain_name: string;
  start_date: Date;
  end_date: Date;
  committed_points: number;
  completed_points: number;
  completion_rate: number;
  ticket_count: number;
  completed_tickets: number;
}

// GET: Velocity metrics
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get all domains in organization
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: {
        org_id: payload.companyId,
        is_deleted: false
      },
      select: { id: true }
    });
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    // Fetch completed cycles with tickets
    const cycles = await prisma.qUAD_cycles.findMany({
      where: {
        domain_id: { in: domainIds },
        status: { in: ['completed', 'closed'] }
      },
      include: {
        domain: { select: { name: true } },
        tickets: {
          select: {
            id: true,
            story_points: true,
            status: true
          }
        }
      },
      orderBy: { end_date: 'desc' },
      take: limit
    });

    // Calculate velocity for each cycle
    const velocityData: CycleVelocity[] = cycles.map(c => {
      const committedPoints = c.tickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedPoints = c.tickets
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedTickets = c.tickets.filter(t => t.status === 'done').length;

      return {
        cycle_id: c.id,
        cycle_name: c.name,
        cycle_number: c.cycle_number,
        domain_name: c.domain.name,
        start_date: c.start_date,
        end_date: c.end_date,
        committed_points: committedPoints,
        completed_points: completedPoints,
        completion_rate: committedPoints > 0 ? Math.round((completedPoints / committedPoints) * 100) : 0,
        ticket_count: c.tickets.length,
        completed_tickets: completedTickets
      };
    });

    // Calculate statistics
    const completedVelocities = velocityData.map(v => v.completed_points);
    const avgVelocity = completedVelocities.length > 0
      ? Math.round(completedVelocities.reduce((a, b) => a + b, 0) / completedVelocities.length)
      : 0;

    // Trend analysis (compare recent 3 cycles to previous 3)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (completedVelocities.length >= 6) {
      const recent = completedVelocities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const previous = completedVelocities.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
      if (recent > previous * 1.1) trend = 'improving';
      else if (recent < previous * 0.9) trend = 'declining';
    }

    // Best and worst cycles
    const bestCycle = velocityData.length > 0
      ? velocityData.reduce((best, c) => c.completed_points > best.completed_points ? c : best)
      : null;
    const worstCycle = velocityData.length > 0
      ? velocityData.reduce((worst, c) => c.completed_points < worst.completed_points ? c : worst)
      : null;

    // Commitment accuracy (how close to estimates)
    const avgCompletionRate = velocityData.length > 0
      ? Math.round(velocityData.reduce((sum, v) => sum + v.completion_rate, 0) / velocityData.length)
      : 0;

    // Chart data for velocity over time
    const chartData = velocityData.reverse().map(v => ({
      label: `Cycle ${v.cycle_number}`,
      committed: v.committed_points,
      completed: v.completed_points
    }));

    return NextResponse.json({
      summary: {
        average_velocity: avgVelocity,
        trend,
        average_completion_rate: avgCompletionRate,
        total_cycles_analyzed: velocityData.length,
        best_cycle: bestCycle ? {
          name: bestCycle.cycle_name,
          points: bestCycle.completed_points
        } : null,
        worst_cycle: worstCycle ? {
          name: worstCycle.cycle_name,
          points: worstCycle.completed_points
        } : null
      },
      chart: {
        title: 'Velocity Trend',
        type: 'bar',
        data: chartData
      },
      cycles: velocityData.reverse(), // Most recent first
      recommendations: generateRecommendations(velocityData, avgVelocity, avgCompletionRate)
    });

  } catch (error) {
    console.error('Velocity report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  velocityData: CycleVelocity[],
  avgVelocity: number,
  avgCompletionRate: number
): string[] {
  const recommendations: string[] = [];

  if (velocityData.length < 3) {
    recommendations.push('Complete more cycles to get accurate velocity predictions');
  }

  if (avgCompletionRate < 80) {
    recommendations.push('Consider reducing cycle commitments - completion rate is below 80%');
  }

  if (avgCompletionRate > 95) {
    recommendations.push('Team is consistently exceeding commitments - consider increasing velocity');
  }

  // Check for high variance
  if (velocityData.length >= 3) {
    const points = velocityData.map(v => v.completed_points);
    const variance = calculateVariance(points);
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = avgVelocity > 0 ? (stdDev / avgVelocity) * 100 : 0;

    if (coeffOfVariation > 30) {
      recommendations.push('High velocity variance detected - work on improving estimation consistency');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Velocity is stable and predictable - good job!');
  }

  return recommendations;
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
}
