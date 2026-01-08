/**
 * GET /api/rankings/config - Get ranking configuration
 * PUT /api/rankings/config - Update ranking weights
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface RankingConfig {
  id: string;
  org_id: string;
  weight_delivery: number;
  weight_quality: number;
  weight_collaboration: number;
  weight_learning: number;
  weight_ai_adoption: number;
  delivery_factors: Record<string, number>;
  quality_factors: Record<string, number>;
  collaboration_factors: Record<string, number>;
  learning_factors: Record<string, number>;
  ai_factors: Record<string, number>;
  calculation_period: string;
  show_rankings_to_team: boolean;
  anonymize_rankings: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by: string | null;
}

interface RankingPreset {
  name: string;
  delivery: number;
  quality: number;
  collaboration: number;
  learning: number;
  ai: number;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findRankingConfig(orgId: string): Promise<RankingConfig | null> {
  console.log('[STUB] findRankingConfig called:', { orgId });
  return null;
}

async function upsertRankingConfig(
  orgId: string,
  data: Partial<RankingConfig>
): Promise<RankingConfig> {
  console.log('[STUB] upsertRankingConfig called:', { orgId, data });
  return {
    id: 'stub-id',
    org_id: orgId,
    weight_delivery: data.weight_delivery || 35,
    weight_quality: data.weight_quality || 25,
    weight_collaboration: data.weight_collaboration || 20,
    weight_learning: data.weight_learning || 15,
    weight_ai_adoption: data.weight_ai_adoption || 5,
    delivery_factors: data.delivery_factors || { completion_rate: 40, story_points: 30, on_time: 30 },
    quality_factors: data.quality_factors || { defect_rate: 40, rework_rate: 30, review_score: 30 },
    collaboration_factors: data.collaboration_factors || { peer_recognition: 40, help_given: 30, communication: 30 },
    learning_factors: data.learning_factors || { skill_acquisition: 40, knowledge_sharing: 30, challenge_acceptance: 30 },
    ai_factors: data.ai_factors || { tool_usage: 50, efficiency_gain: 50 },
    calculation_period: data.calculation_period || 'monthly',
    show_rankings_to_team: data.show_rankings_to_team ?? true,
    anonymize_rankings: data.anonymize_rankings ?? false,
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: data.updated_by || null
  };
}

// ============================================================================
// Route Handlers
// ============================================================================

// GET: Get ranking config
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

    let config = await findRankingConfig(payload.orgId);

    if (!config) {
      // Return defaults
      config = {
        id: '',
        org_id: payload.orgId,
        weight_delivery: 35,
        weight_quality: 25,
        weight_collaboration: 20,
        weight_learning: 15,
        weight_ai_adoption: 5,
        delivery_factors: { completion_rate: 40, story_points: 30, on_time: 30 },
        quality_factors: { defect_rate: 40, rework_rate: 30, review_score: 30 },
        collaboration_factors: { peer_recognition: 40, help_given: 30, communication: 30 },
        learning_factors: { skill_acquisition: 40, knowledge_sharing: 30, challenge_acceptance: 30 },
        ai_factors: { tool_usage: 50, efficiency_gain: 50 },
        calculation_period: 'monthly',
        show_rankings_to_team: true,
        anonymize_rankings: false,
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: null
      };
    }

    // Define presets
    const presets: RankingPreset[] = [
      { name: 'Balanced', delivery: 35, quality: 25, collaboration: 20, learning: 15, ai: 5 },
      { name: 'Speed-Focused', delivery: 50, quality: 20, collaboration: 15, learning: 10, ai: 5 },
      { name: 'Quality-First', delivery: 25, quality: 40, collaboration: 20, learning: 10, ai: 5 },
      { name: 'Team-Centric', delivery: 25, quality: 20, collaboration: 35, learning: 15, ai: 5 },
      { name: 'Growth-Oriented', delivery: 25, quality: 20, collaboration: 20, learning: 30, ai: 5 },
      { name: 'AI-Forward', delivery: 30, quality: 20, collaboration: 15, learning: 15, ai: 20 }
    ];

    return NextResponse.json({
      config,
      presets
    });

  } catch (error) {
    console.error('Get ranking config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update ranking config
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      weight_delivery,
      weight_quality,
      weight_collaboration,
      weight_learning,
      weight_ai_adoption,
      delivery_factors,
      quality_factors,
      collaboration_factors,
      learning_factors,
      ai_factors,
      calculation_period,
      show_rankings_to_team,
      anonymize_rankings
    } = body;

    // Validate weights sum to 100
    const totalWeight = (weight_delivery || 0) + (weight_quality || 0) +
      (weight_collaboration || 0) + (weight_learning || 0) + (weight_ai_adoption || 0);

    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: `Weights must sum to 100, got ${totalWeight}` },
        { status: 400 }
      );
    }

    const config = await upsertRankingConfig(payload.orgId, {
      weight_delivery,
      weight_quality,
      weight_collaboration,
      weight_learning,
      weight_ai_adoption,
      delivery_factors,
      quality_factors,
      collaboration_factors,
      learning_factors,
      ai_factors,
      calculation_period,
      show_rankings_to_team,
      anonymize_rankings,
      updated_by: payload.userId
    });

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Update ranking config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
