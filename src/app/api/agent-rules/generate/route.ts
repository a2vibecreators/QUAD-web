/**
 * POST /api/agent-rules/generate
 *
 * PRODUCTION endpoint: Generate code using Agent Rules + Claude AI
 *
 * Flow:
 * 1. Takes task description + activity type + orgId
 * 2. Fetches rules from Java backend (GET /v1/agent-rules)
 * 3. Builds prompt with rules
 * 4. Calls Claude AI (Haiku/Sonnet/Opus based on complexity)
 * 5. Returns generated code
 *
 * This is the core of Story Agent - what VS Code extension will use
 *
 * Required inputs:
 * - task: string (description of what to build)
 * - activityType: string (add_api_endpoint, create_ui_screen, etc.)
 * - orgId: string (organization UUID)
 * - industry?: string (optional, defaults to org's industry)
 * - complexity?: 'simple' | 'medium' | 'complex' (defaults to 'medium')
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAI, AIMessage } from '@/lib/ai/providers';

// Helper function to generate code with given rules
async function generateCodeWithRules(
  task: string,
  activityType: string,
  ruleSet: { industry: string; rules: { DO: string[]; DONT: string[] } },
  body: any
) {
  // Build system prompt with rules
  const systemPrompt = `You are a senior software engineer generating code for ${ruleSet.industry} industry.

## Task
${task}

## Activity Type
${activityType}

## MANDATORY RULES - You MUST follow these:

### DO (Best Practices):
${ruleSet.rules.DO.map(r => `✅ ${r}`).join('\n')}

### DON'T (Avoid These):
${ruleSet.rules.DONT.map(r => `❌ ${r}`).join('\n')}

## Instructions:
1. Generate production-ready code following ALL the rules above
2. Add comments showing which rule each code section follows
3. Use proper error handling
4. Include necessary imports
5. Return ONLY the code - no explanations`;

  // Call Claude AI
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate code for: ${task}` },
  ];

  console.log(`[AgentRules] Generating code for: ${task.slice(0, 50)}...`);
  console.log(`[AgentRules] Industry: ${ruleSet.industry}, Activity: ${activityType}`);

  const startTime = Date.now();

  // Use Gemini by default (cheapest provider)
  // Provider will be selected automatically by callAI (defaults to 'gemini')
  const response = await callAI(body.orgId || 'demo-org', messages, {
    activityType: activityType,
    provider: 'gemini',  // Use Gemini for demo (cheapest: $0.075/M input)
    maxTokens: 4096,
    temperature: 0.3,
  });

  const latencyMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    data: {
      generatedCode: response.content,
      metadata: {
        task,
        activityType,
        industry: ruleSet.industry,
        rulesApplied: {
          do: ruleSet.rules.DO.length,
          dont: ruleSet.rules.DONT.length,
        },
      },
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
      },
      model: response.model,
      latencyMs,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task,
      activityType = 'add_api_endpoint',
      industry,  // Optional - will use org's industry if not provided
      orgId,     // Required
    } = body;

    if (!task) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch rules from Java backend (PRODUCTION)
    const backendUrl = process.env.QUAD_API_URL || 'http://quad-services-dev:8080';
    let rulesResponse;

    try {
      if (industry) {
        // Use industry directly (for testing/demo)
        rulesResponse = await fetch(
          `${backendUrl}/v1/agent-rules/by-industry?industry=${industry}&activityType=${activityType}`
        );
      } else {
        // Use org's industry (production flow)
        rulesResponse = await fetch(
          `${backendUrl}/v1/agent-rules?orgId=${orgId}&activityType=${activityType}`
        );
      }

      if (!rulesResponse.ok) {
        throw new Error(`Backend returned ${rulesResponse.status}`);
      }
    } catch (backendError) {
      console.error('[AgentRules] Backend fetch failed:', backendError);
      return NextResponse.json(
        { error: 'Failed to fetch rules from backend. Ensure Java backend is running.' },
        { status: 503 }
      );
    }

    const ruleSet = await rulesResponse.json();

    // 2. Generate code with fetched rules
    return generateCodeWithRules(task, activityType, ruleSet, body);

  } catch (error) {
    console.error('[AgentRules] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate code' },
      { status: 500 }
    );
  }
}
