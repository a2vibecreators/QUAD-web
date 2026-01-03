/**
 * AI Router API - Intelligent model routing
 *
 * POST /api/ai - Send a request to the optimal AI model
 * GET /api/ai/preview - Preview which model would be used
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AIRouter } from '@/lib/services/ai-router';
import { ClassificationContext } from '@/lib/services/task-classifier';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      org_id,
      context,
      memory_keywords,
      max_tokens,
      temperature,
      force_model,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Build classification context
    const classificationContext: ClassificationContext | undefined = context ? {
      entityType: context.entity_type,
      entityData: {
        ticketType: context.ticket_type,
        priority: context.priority,
        skills: context.skills,
      },
      userPreferences: force_model ? {
        preferredModel: force_model,
        forceModel: true,
      } : undefined,
    } : undefined;

    const response = await AIRouter.route({
      prompt,
      orgId: org_id,
      userId: session.user.id,
      context: classificationContext,
      memoryKeywords: memory_keywords,
      maxTokens: max_tokens,
      temperature,
      forceModel: force_model,
    });

    return NextResponse.json({
      success: true,
      content: response.content,
      model: response.model,
      tokens: response.tokensUsed,
      cost: response.cost,
      classification: {
        task_type: response.classification.taskType,
        code_percentage: response.classification.codePercentage,
        recommended_model: response.classification.recommendedModel,
        confidence: response.classification.confidence,
        reasoning: response.classification.reasoning,
        method: response.classification.classificationMethod,
      },
      memory_session_id: response.memorySessionId,
      cached: response.cached,
      latency_ms: response.latencyMs,
    });
  } catch (error) {
    console.error('[AI Router API] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process AI request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const orgId = searchParams.get('org_id');
    const entityType = searchParams.get('entity_type');
    const ticketType = searchParams.get('ticket_type');

    if (!prompt || !orgId) {
      return NextResponse.json({
        error: 'prompt and org_id are required query parameters',
      }, { status: 400 });
    }

    const context: ClassificationContext | undefined = entityType ? {
      entityType: entityType as ClassificationContext['entityType'],
      entityData: ticketType ? { ticketType } : undefined,
    } : undefined;

    const preview = await AIRouter.preview(prompt, orgId, context);

    return NextResponse.json({
      success: true,
      preview: {
        recommended_model: preview.recommendedModel,
        task_type: preview.taskType,
        estimated_cost: preview.estimatedCost,
        reasoning: preview.reasoning,
      },
      models_available: Object.entries(AIRouter.MODELS).map(([key, model]) => ({
        key,
        name: model.name,
        provider: model.provider,
        cost_per_1k_tokens: `$${(model.costPer1kPrompt + model.costPer1kCompletion).toFixed(4)}`,
        supports_code: model.supportsCode,
      })),
    });
  } catch (error) {
    console.error('[AI Router API] Error:', error);
    return NextResponse.json({ error: 'Failed to preview classification' }, { status: 500 });
  }
}
