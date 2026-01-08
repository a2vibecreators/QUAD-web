/**
 * GET /api/ai-config - Get AI configuration
 * PUT /api/ai-config - Update AI configuration
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

interface AIConfig {
  id: string;
  org_id: string;
  primary_provider: string;
  fallback_provider: string | null;
  ai_usage_mode: string;
  classification_mode: string;
  enable_code_generation: boolean;
  enable_code_review: boolean;
  enable_estimation: boolean;
  enable_ticket_generation: boolean;
  enable_meeting_summaries: boolean;
  enable_rag_chatbot: boolean;
  require_approval_code_commit: boolean;
  require_approval_deployment: boolean;
  require_approval_db_ops: boolean;
  monthly_budget_usd: number | null;
  daily_request_limit: number | null;
  max_tokens_per_request: number | null;
  openai_key_ref: string | null;
  anthropic_key_ref: string | null;
  gemini_key_ref: string | null;
  current_month_spend: number;
  requests_this_month: number;
  last_reset_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

async function getAIConfig(_orgId: string): Promise<AIConfig | null> {
  console.log(`[AIConfig] getAIConfig: ${_orgId}`);
  return null;
}

async function upsertAIConfig(_orgId: string, _data: Partial<AIConfig>): Promise<AIConfig> {
  console.log(`[AIConfig] upsertAIConfig: ${_orgId}`);
  return {
    id: 'mock-id',
    org_id: _orgId,
    primary_provider: _data.primary_provider || 'gemini',
    fallback_provider: _data.fallback_provider || null,
    ai_usage_mode: _data.ai_usage_mode || 'conservative',
    classification_mode: 'hybrid',
    enable_code_generation: true,
    enable_code_review: true,
    enable_estimation: true,
    enable_ticket_generation: true,
    enable_meeting_summaries: true,
    enable_rag_chatbot: true,
    require_approval_code_commit: true,
    require_approval_deployment: true,
    require_approval_db_ops: true,
    monthly_budget_usd: null,
    daily_request_limit: null,
    max_tokens_per_request: null,
    openai_key_ref: null,
    anthropic_key_ref: null,
    gemini_key_ref: null,
    current_month_spend: 0,
    requests_this_month: 0,
    last_reset_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// GET: Get AI config
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

    let config = await getAIConfig(payload.orgId);

    if (!config) {
      // Return defaults
      config = {
        id: '',
        org_id: payload.orgId,
        primary_provider: 'gemini',
        fallback_provider: null,
        ai_usage_mode: 'conservative',
        classification_mode: 'hybrid',  // accuracy, cost, or hybrid
        enable_code_generation: true,
        enable_code_review: true,
        enable_estimation: true,
        enable_ticket_generation: true,
        enable_meeting_summaries: true,
        enable_rag_chatbot: true,
        require_approval_code_commit: true,
        require_approval_deployment: true,
        require_approval_db_ops: true,
        monthly_budget_usd: null,
        daily_request_limit: null,
        max_tokens_per_request: null,
        openai_key_ref: null,
        anthropic_key_ref: null,
        gemini_key_ref: null,
        current_month_spend: 0,
        requests_this_month: 0,
        last_reset_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    // Define usage mode options
    const usageModes = [
      {
        id: 'conservative',
        name: 'Conservative',
        description: 'Free tier only (Gemini), human approval required for all operations',
        features: {
          providers: ['gemini'],
          auto_commit: false,
          auto_deploy: false,
          auto_db_ops: false
        }
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Mix of free and paid providers, human approval for critical operations',
        features: {
          providers: ['gemini', 'openai'],
          auto_commit: false,
          auto_deploy: false,
          auto_db_ops: false
        }
      },
      {
        id: 'full',
        name: 'Full AI',
        description: 'All providers available, AI can auto-execute with configurable approvals',
        features: {
          providers: ['gemini', 'openai', 'anthropic', 'bedrock'],
          auto_commit: true,
          auto_deploy: false,
          auto_db_ops: false
        }
      }
    ];

    // Define available providers
    const providers = [
      { id: 'gemini', name: 'Google Gemini', cost: 'Free tier available', recommended: true },
      { id: 'openai', name: 'OpenAI GPT-4', cost: '$0.03/1K tokens', recommended: false },
      { id: 'anthropic', name: 'Anthropic Claude', cost: '$0.015/1K tokens', recommended: false },
      { id: 'bedrock', name: 'AWS Bedrock', cost: 'HIPAA compliant', recommended: false }
    ];

    return NextResponse.json({
      config: {
        ...config,
        // Mask API key references
        openai_key_ref: config.openai_key_ref ? '****configured****' : null,
        anthropic_key_ref: config.anthropic_key_ref ? '****configured****' : null,
        gemini_key_ref: config.gemini_key_ref ? '****configured****' : null
      },
      usage_modes: usageModes,
      providers
    });

  } catch (error) {
    console.error('Get AI config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update AI config
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
      primary_provider,
      fallback_provider,
      ai_usage_mode,
      enable_code_generation,
      enable_code_review,
      enable_estimation,
      enable_ticket_generation,
      enable_meeting_summaries,
      enable_rag_chatbot,
      require_approval_code_commit,
      require_approval_deployment,
      require_approval_db_ops,
      monthly_budget_usd,
      daily_request_limit,
      max_tokens_per_request
    } = body;

    // Validate provider
    const validProviders = ['gemini', 'openai', 'anthropic', 'bedrock'];
    if (primary_provider && !validProviders.includes(primary_provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate usage mode
    const validModes = ['conservative', 'balanced', 'full'];
    if (ai_usage_mode && !validModes.includes(ai_usage_mode)) {
      return NextResponse.json(
        { error: `Invalid usage mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    const config = await upsertAIConfig(payload.orgId, {
      primary_provider,
      fallback_provider,
      ai_usage_mode,
      enable_code_generation,
      enable_code_review,
      enable_estimation,
      enable_ticket_generation,
      enable_meeting_summaries,
      enable_rag_chatbot,
      require_approval_code_commit,
      require_approval_deployment,
      require_approval_db_ops,
      monthly_budget_usd,
      daily_request_limit,
      max_tokens_per_request
    });

    return NextResponse.json({
      message: 'AI configuration updated',
      config: {
        ...config,
        openai_key_ref: config.openai_key_ref ? '****configured****' : null,
        anthropic_key_ref: config.anthropic_key_ref ? '****configured****' : null,
        gemini_key_ref: config.gemini_key_ref ? '****configured****' : null
      }
    });

  } catch (error) {
    console.error('Update AI config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
