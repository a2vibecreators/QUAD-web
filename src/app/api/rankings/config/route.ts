/**
 * GET /api/rankings/config - Get ranking configuration
 * PUT /api/rankings/config - Update ranking weights
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    let config = await prisma.qUAD_ranking_configs.findUnique({
      where: { org_id: payload.companyId }
    });

    if (!config) {
      // Return defaults
      config = {
        id: '',
        org_id: payload.companyId,
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
    const presets = [
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

    const config = await prisma.qUAD_ranking_configs.upsert({
      where: { org_id: payload.companyId },
      update: {
        weight_delivery,
        weight_quality,
        weight_collaboration,
        weight_learning,
        weight_ai_adoption,
        ...(delivery_factors && { delivery_factors }),
        ...(quality_factors && { quality_factors }),
        ...(collaboration_factors && { collaboration_factors }),
        ...(learning_factors && { learning_factors }),
        ...(ai_factors && { ai_factors }),
        ...(calculation_period && { calculation_period }),
        ...(show_rankings_to_team !== undefined && { show_rankings_to_team }),
        ...(anonymize_rankings !== undefined && { anonymize_rankings }),
        updated_by: payload.userId
      },
      create: {
        org_id: payload.companyId,
        weight_delivery: weight_delivery || 35,
        weight_quality: weight_quality || 25,
        weight_collaboration: weight_collaboration || 20,
        weight_learning: weight_learning || 15,
        weight_ai_adoption: weight_ai_adoption || 5,
        updated_by: payload.userId
      }
    });

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Update ranking config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
