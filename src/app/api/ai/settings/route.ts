/**
 * AI Settings API - Manage org AI configuration
 *
 * GET /api/ai/settings - Get AI settings for an org
 * PATCH /api/ai/settings - Update AI settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const config = await prisma.qUAD_ai_configs.findUnique({
      where: { org_id: orgId },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        config: null,
        message: 'No AI config found. Using defaults.',
        defaults: {
          primary_provider: 'gemini',
          ai_usage_mode: 'conservative',
          classification_mode: 'hybrid',
          enable_code_generation: true,
          enable_code_review: true,
          enable_estimation: true,
          enable_ticket_generation: true,
          enable_meeting_summaries: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        org_id: config.org_id,
        primary_provider: config.primary_provider,
        fallback_provider: config.fallback_provider,
        ai_usage_mode: config.ai_usage_mode,
        classification_mode: config.classification_mode,
        features: {
          code_generation: config.enable_code_generation,
          code_review: config.enable_code_review,
          estimation: config.enable_estimation,
          ticket_generation: config.enable_ticket_generation,
          meeting_summaries: config.enable_meeting_summaries,
          rag_chatbot: config.enable_rag_chatbot,
        },
        approvals: {
          code_commit: config.require_approval_code_commit,
          deployment: config.require_approval_deployment,
          db_ops: config.require_approval_db_ops,
        },
        budget: {
          monthly_budget_usd: config.monthly_budget_usd,
          current_month_spend: config.current_month_spend,
          daily_request_limit: config.daily_request_limit,
          requests_this_month: config.requests_this_month,
        },
        updated_at: config.updated_at,
      },
      classification_modes: {
        accuracy: {
          description: 'Always ask Gemini to classify tasks',
          accuracy: '95%',
          extra_calls: '+1 per request',
          best_for: 'Complex or ambiguous requests',
        },
        cost: {
          description: 'Keyword-based classification only',
          accuracy: '80%',
          extra_calls: '0',
          best_for: 'Simple, predictable tasks',
        },
        hybrid: {
          description: 'Keywords for obvious, Gemini for ambiguous',
          accuracy: '93%',
          extra_calls: '~0.3 per request',
          best_for: 'Balanced cost vs accuracy (recommended)',
        },
      },
    });
  } catch (error) {
    console.error('[AI Settings API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, ...updates } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Validate classification_mode if provided
    if (updates.classification_mode) {
      const validModes = ['accuracy', 'cost', 'hybrid'];
      if (!validModes.includes(updates.classification_mode)) {
        return NextResponse.json({
          error: `Invalid classification_mode. Must be one of: ${validModes.join(', ')}`,
        }, { status: 400 });
      }
    }

    // Validate ai_usage_mode if provided
    if (updates.ai_usage_mode) {
      const validModes = ['conservative', 'balanced', 'full'];
      if (!validModes.includes(updates.ai_usage_mode)) {
        return NextResponse.json({
          error: `Invalid ai_usage_mode. Must be one of: ${validModes.join(', ')}`,
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (updates.primary_provider) updateData.primary_provider = updates.primary_provider;
    if (updates.fallback_provider !== undefined) updateData.fallback_provider = updates.fallback_provider;
    if (updates.ai_usage_mode) updateData.ai_usage_mode = updates.ai_usage_mode;
    if (updates.classification_mode) updateData.classification_mode = updates.classification_mode;

    // Feature toggles
    if (updates.enable_code_generation !== undefined) updateData.enable_code_generation = updates.enable_code_generation;
    if (updates.enable_code_review !== undefined) updateData.enable_code_review = updates.enable_code_review;
    if (updates.enable_estimation !== undefined) updateData.enable_estimation = updates.enable_estimation;
    if (updates.enable_ticket_generation !== undefined) updateData.enable_ticket_generation = updates.enable_ticket_generation;
    if (updates.enable_meeting_summaries !== undefined) updateData.enable_meeting_summaries = updates.enable_meeting_summaries;
    if (updates.enable_rag_chatbot !== undefined) updateData.enable_rag_chatbot = updates.enable_rag_chatbot;

    // Approval settings
    if (updates.require_approval_code_commit !== undefined) updateData.require_approval_code_commit = updates.require_approval_code_commit;
    if (updates.require_approval_deployment !== undefined) updateData.require_approval_deployment = updates.require_approval_deployment;
    if (updates.require_approval_db_ops !== undefined) updateData.require_approval_db_ops = updates.require_approval_db_ops;

    // Budget settings
    if (updates.monthly_budget_usd !== undefined) updateData.monthly_budget_usd = updates.monthly_budget_usd;
    if (updates.daily_request_limit !== undefined) updateData.daily_request_limit = updates.daily_request_limit;
    if (updates.max_tokens_per_request !== undefined) updateData.max_tokens_per_request = updates.max_tokens_per_request;

    // Upsert the config
    const config = await prisma.qUAD_ai_configs.upsert({
      where: { org_id },
      create: {
        org_id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'AI settings updated',
      config: {
        id: config.id,
        org_id: config.org_id,
        classification_mode: config.classification_mode,
        ai_usage_mode: config.ai_usage_mode,
        primary_provider: config.primary_provider,
        updated_at: config.updated_at,
      },
      impact: getImpactDescription(config.classification_mode, config.ai_usage_mode),
    });
  } catch (error) {
    console.error('[AI Settings API] Error:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}

function getImpactDescription(classificationMode: string, usageMode: string): string {
  const modeImpacts: Record<string, string> = {
    accuracy: 'Maximum classification accuracy with +1 Gemini call per request',
    cost: 'Zero extra API calls, but ~20% of tasks may route to wrong model',
    hybrid: 'Best balance - smart routing with minimal extra calls',
  };

  const usageImpacts: Record<string, string> = {
    conservative: 'AI used sparingly, human approval required for most actions',
    balanced: 'AI assists but humans verify critical actions',
    full: 'AI operates with minimal human intervention (use with caution)',
  };

  return `${modeImpacts[classificationMode] || 'Unknown mode'}. ${usageImpacts[usageMode] || 'Unknown usage mode'}.`;
}
