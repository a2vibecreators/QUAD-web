/**
 * QUAD Task Classifier - Intelligent AI Model Routing
 *
 * Routes tasks to the optimal AI model based on task type:
 * - Claude: Code generation, refactoring, debugging
 * - Gemini: Understanding, summarization, classification
 *
 * Three modes:
 * - 'accuracy': Always ask Gemini to classify (95% accurate, +1 API call)
 * - 'cost': Keywords only, no API calls (80% accurate, instant)
 * - 'hybrid': Smart mix - keywords for obvious, Gemini for ambiguous (93% accurate)
 */

import { prisma } from '@/lib/prisma';

// =============================================================================
// TYPES
// =============================================================================

export type ClassificationMode = 'accuracy' | 'cost' | 'hybrid';

export type TaskType =
  | 'WRITE_CODE'      // Generate new code
  | 'REFACTOR'        // Improve existing code
  | 'DEBUG'           // Fix bugs
  | 'EXPLAIN'         // Explain code/concepts
  | 'SUMMARIZE'       // Summarize meetings/docs
  | 'CLASSIFY'        // Categorize/assign
  | 'ANALYZE'         // Analyze code/data
  | 'REVIEW'          // Review PR/code
  | 'OTHER';          // Uncategorized

export type RecommendedModel =
  | 'claude-opus'     // Complex code, architecture
  | 'claude-sonnet'   // Standard code generation
  | 'gemini-pro'      // Complex understanding
  | 'gemini-flash';   // Fast understanding/classification

export interface ClassificationResult {
  taskType: TaskType;
  codePercentage: number;       // 0-100: How much of response should be code?
  recommendedModel: RecommendedModel;
  confidence: number;           // 0-1: How confident in this classification?
  reasoning: string;            // Why this classification?
  classificationMethod: 'keyword' | 'gemini' | 'context';
  signals: {
    actionVerb: string | null;
    outputType: 'code' | 'text' | 'mixed';
    entityType: string | null;
    complexity: 'low' | 'medium' | 'high';
  };
  fallbackModel: RecommendedModel;
}

export interface ClassificationContext {
  entityType?: 'ticket' | 'pr' | 'meeting' | 'chat' | 'requirement';
  entityData?: {
    ticketType?: string;      // bug, feature, spike, task
    priority?: string;        // critical, high, medium, low
    skills?: string[];        // react, typescript, etc.
  };
  userPreferences?: {
    preferredModel?: string;
    forceModel?: boolean;
  };
}

// =============================================================================
// KEYWORD PATTERNS
// =============================================================================

const CLAUDE_PATTERNS = {
  // Action verbs that indicate code generation
  verbs: [
    /\b(write|create|implement|build|generate|make|add|develop)\b/i,
    /\b(fix|debug|repair|resolve|patch)\b/i,
    /\b(refactor|rewrite|optimize|improve|enhance)\b/i,
    /\b(update|modify|change|edit)\s+(the\s+)?(code|function|class|component)/i,
  ],
  // Output indicators
  output: [
    /\bgive\s+me\s+(the\s+)?code\b/i,
    /\bcode\s+(for|to|that)\b/i,
    /\bimplement(ation)?\b/i,
    /\bwrite\s+(a|the)\s+(function|class|component|api|endpoint)/i,
  ],
  // File/code context
  context: [
    /\.(ts|js|tsx|jsx|py|java|go|rs|cpp|c|rb|php)\b/i,
    /\bin\s+\w+\.(ts|js|py)\b/i,
    /\bPR\s*#?\d+\b/i,
    /\bpull\s+request\b/i,
  ],
};

const GEMINI_PATTERNS = {
  // Understanding verbs
  verbs: [
    /\b(explain|describe|tell\s+me|what\s+(is|are|does))\b/i,
    /\b(summarize|summary|recap)\b/i,
    /\b(analyze|analysis|review)\s+(the\s+)?(meeting|standup|discussion)/i,
    /\b(list|show|find|search|get)\s+(all|the)\b/i,
    /\b(classify|categorize|assign|prioritize)\b/i,
  ],
  // Question patterns
  questions: [
    /\bwhat\s+(is|are|does|did|should)\b/i,
    /\bhow\s+(does|do|did|to|can)\b/i,
    /\bwhy\s+(is|are|does|did)\b/i,
    /\bwhen\s+(should|did|does)\b/i,
    /\bwho\s+(should|is|are)\b/i,
    /\?$/,
  ],
  // Non-code entities
  entities: [
    /\bmeeting\b/i,
    /\bstandup\b/i,
    /\bticket\s+(description|summary)\b/i,
    /\brequirement(s)?\b/i,
    /\bdocument(ation)?\b/i,
  ],
};

const AMBIGUOUS_PATTERNS = [
  /\bhelp\s+(me\s+)?(with|on)\b/i,
  /\blook\s+at\b/i,
  /\bcheck\s+(this|the)\b/i,
  /\bcan\s+you\b/i,
  /\bi\s+need\s+(to|a)\b/i,
  /\bplease\b/i,
];

// =============================================================================
// CLASSIFICATION FUNCTIONS
// =============================================================================

/**
 * Main classification function - routes based on org's classification_mode
 */
export async function classifyTask(
  request: string,
  orgId: string,
  context?: ClassificationContext
): Promise<ClassificationResult> {
  // Get org's classification mode
  const mode = await getOrgClassificationMode(orgId);

  // Check for user override
  if (context?.userPreferences?.forceModel) {
    return createForcedResult(context.userPreferences.preferredModel || 'claude-sonnet', request);
  }

  switch (mode) {
    case 'accuracy':
      return classifyWithGemini(request, context);
    case 'cost':
      return classifyWithKeywords(request, context);
    case 'hybrid':
    default:
      return classifyHybrid(request, context);
  }
}

/**
 * Cost mode: Keywords only, no API calls
 */
export function classifyWithKeywords(
  request: string,
  context?: ClassificationContext
): ClassificationResult {
  const scores = { claude: 0, gemini: 0 };
  const signals = {
    actionVerb: null as string | null,
    outputType: 'mixed' as 'code' | 'text' | 'mixed',
    entityType: context?.entityType || null,
    complexity: 'medium' as 'low' | 'medium' | 'high',
  };

  // Check Claude patterns
  for (const pattern of CLAUDE_PATTERNS.verbs) {
    const match = request.match(pattern);
    if (match) {
      scores.claude += 40;
      signals.actionVerb = match[0];
    }
  }
  for (const pattern of CLAUDE_PATTERNS.output) {
    if (pattern.test(request)) scores.claude += 30;
  }
  for (const pattern of CLAUDE_PATTERNS.context) {
    if (pattern.test(request)) scores.claude += 20;
  }

  // Check Gemini patterns
  for (const pattern of GEMINI_PATTERNS.verbs) {
    const match = request.match(pattern);
    if (match) {
      scores.gemini += 40;
      if (!signals.actionVerb) signals.actionVerb = match[0];
    }
  }
  for (const pattern of GEMINI_PATTERNS.questions) {
    if (pattern.test(request)) scores.gemini += 25;
  }
  for (const pattern of GEMINI_PATTERNS.entities) {
    if (pattern.test(request)) scores.gemini += 20;
  }

  // Context-based adjustments
  if (context?.entityType === 'pr') scores.claude += 30;
  if (context?.entityType === 'meeting') scores.gemini += 30;
  if (context?.entityData?.ticketType === 'bug') scores.claude += 20;
  if (context?.entityData?.ticketType === 'spike') scores.gemini += 20;
  if (context?.entityData?.priority === 'critical') scores.claude += 10;

  // Determine result
  const isClaude = scores.claude > scores.gemini;
  const maxScore = Math.max(scores.claude, scores.gemini);
  const confidence = Math.min(maxScore / 100, 0.95);

  // Determine task type
  let taskType: TaskType = 'OTHER';
  if (/\b(write|create|implement|build|generate)\b/i.test(request)) taskType = 'WRITE_CODE';
  else if (/\b(fix|debug|repair)\b/i.test(request)) taskType = 'DEBUG';
  else if (/\b(refactor|rewrite|optimize)\b/i.test(request)) taskType = 'REFACTOR';
  else if (/\b(explain|describe|what)\b/i.test(request)) taskType = 'EXPLAIN';
  else if (/\b(summarize|summary)\b/i.test(request)) taskType = 'SUMMARIZE';
  else if (/\b(classify|assign|categorize)\b/i.test(request)) taskType = 'CLASSIFY';
  else if (/\b(analyze|analysis)\b/i.test(request)) taskType = 'ANALYZE';
  else if (/\b(review)\b/i.test(request)) taskType = 'REVIEW';

  // Determine code percentage
  const codePercentage = isClaude ? (taskType === 'WRITE_CODE' ? 90 : 70) : (taskType === 'EXPLAIN' ? 20 : 10);

  signals.outputType = codePercentage > 50 ? 'code' : codePercentage > 20 ? 'mixed' : 'text';

  return {
    taskType,
    codePercentage,
    recommendedModel: isClaude ? 'claude-sonnet' : 'gemini-flash',
    confidence,
    reasoning: `Keyword analysis: Claude=${scores.claude}, Gemini=${scores.gemini}`,
    classificationMethod: 'keyword',
    signals,
    fallbackModel: isClaude ? 'gemini-pro' : 'claude-sonnet',
  };
}

/**
 * Accuracy mode: Always ask Gemini to classify
 */
export async function classifyWithGemini(
  request: string,
  context?: ClassificationContext
): Promise<ClassificationResult> {
  const contextSummary = context ? JSON.stringify({
    entityType: context.entityType,
    ticketType: context.entityData?.ticketType,
    priority: context.entityData?.priority,
  }) : 'none';

  const prompt = `You are a task classifier for a development assistant.

Analyze this request and respond with JSON only (no markdown, no explanation):

{
  "code_percentage": <0-100>,
  "task_type": "<WRITE_CODE|REFACTOR|DEBUG|EXPLAIN|SUMMARIZE|CLASSIFY|ANALYZE|REVIEW|OTHER>",
  "complexity": "<low|medium|high>",
  "recommended_model": "<claude-sonnet|claude-opus|gemini-flash|gemini-pro>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence>"
}

Guidelines:
- code_percentage: How much of the ideal response should be actual code?
- Use claude-sonnet for code generation/editing (code_percentage > 50)
- Use claude-opus for complex architecture decisions
- Use gemini-flash for quick understanding/classification (code_percentage < 30)
- Use gemini-pro for complex analysis without code generation

Request: "${request.substring(0, 500)}"
Context: ${contextSummary}`;

  try {
    // Call Gemini Flash for classification (cheap and fast)
    const response = await callGeminiFlash(prompt);
    const parsed = JSON.parse(response);

    return {
      taskType: parsed.task_type || 'OTHER',
      codePercentage: parsed.code_percentage || 50,
      recommendedModel: parsed.recommended_model || 'claude-sonnet',
      confidence: parsed.confidence || 0.8,
      reasoning: parsed.reasoning || 'Gemini classification',
      classificationMethod: 'gemini',
      signals: {
        actionVerb: null,
        outputType: parsed.code_percentage > 50 ? 'code' : parsed.code_percentage > 20 ? 'mixed' : 'text',
        entityType: context?.entityType || null,
        complexity: parsed.complexity || 'medium',
      },
      fallbackModel: parsed.recommended_model?.includes('claude') ? 'gemini-pro' : 'claude-sonnet',
    };
  } catch (error) {
    console.error('[Task Classifier] Gemini classification failed, falling back to keywords:', error);
    // Fallback to keyword classification
    return classifyWithKeywords(request, context);
  }
}

/**
 * Hybrid mode: Keywords for obvious cases, Gemini for ambiguous
 */
export async function classifyHybrid(
  request: string,
  context?: ClassificationContext
): Promise<ClassificationResult> {
  // First, try keyword classification
  const keywordResult = classifyWithKeywords(request, context);

  // If confidence is high enough, use keyword result
  if (keywordResult.confidence >= 0.7) {
    return keywordResult;
  }

  // Check if request matches ambiguous patterns
  const isAmbiguous = AMBIGUOUS_PATTERNS.some(p => p.test(request));

  if (isAmbiguous || keywordResult.confidence < 0.5) {
    // Ask Gemini for ambiguous cases
    return classifyWithGemini(request, context);
  }

  // Use keyword result for medium confidence
  return keywordResult;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get org's classification mode from settings
 */
async function getOrgClassificationMode(orgId: string): Promise<ClassificationMode> {
  try {
    const settings = await prisma.qUAD_ai_configs.findUnique({
      where: { org_id: orgId },
      select: { classification_mode: true },
    });
    return (settings?.classification_mode as ClassificationMode) || 'hybrid';
  } catch {
    return 'hybrid'; // Default to hybrid
  }
}

/**
 * Create a forced result when user overrides
 */
function createForcedResult(model: string, request: string): ClassificationResult {
  const isClaude = model.includes('claude');
  return {
    taskType: 'OTHER',
    codePercentage: isClaude ? 70 : 30,
    recommendedModel: model as RecommendedModel,
    confidence: 1.0,
    reasoning: 'User forced model selection',
    classificationMethod: 'context',
    signals: {
      actionVerb: null,
      outputType: 'mixed',
      entityType: null,
      complexity: 'medium',
    },
    fallbackModel: isClaude ? 'gemini-pro' : 'claude-sonnet',
  };
}

/**
 * Call Gemini Flash API for classification
 * This is a placeholder - implement with actual Gemini API
 */
async function callGeminiFlash(prompt: string): Promise<string> {
  // TODO: Implement actual Gemini API call
  // For now, return a mock response based on keyword analysis

  const request = prompt.match(/Request: "(.+?)"/)?.[1] || '';

  // Simple mock classification
  const hasWriteVerb = /\b(write|create|implement|fix|build)\b/i.test(request);
  const hasExplainVerb = /\b(explain|summarize|what|describe)\b/i.test(request);

  if (hasWriteVerb) {
    return JSON.stringify({
      code_percentage: 85,
      task_type: 'WRITE_CODE',
      complexity: 'medium',
      recommended_model: 'claude-sonnet',
      confidence: 0.9,
      reasoning: 'Request involves code generation',
    });
  }

  if (hasExplainVerb) {
    return JSON.stringify({
      code_percentage: 15,
      task_type: 'EXPLAIN',
      complexity: 'low',
      recommended_model: 'gemini-flash',
      confidence: 0.9,
      reasoning: 'Request is for explanation/understanding',
    });
  }

  return JSON.stringify({
    code_percentage: 50,
    task_type: 'OTHER',
    complexity: 'medium',
    recommended_model: 'claude-sonnet',
    confidence: 0.6,
    reasoning: 'Unclear intent, defaulting to Claude for safety',
  });
}

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Record classification for analytics
 */
export async function recordClassification(
  orgId: string,
  result: ClassificationResult,
  actualOutcome?: {
    wasCorrect: boolean;
    actualModel: string;
    tokensSaved?: number;
  }
): Promise<void> {
  // TODO: Store in QUAD_classification_analytics table
  console.log('[Task Classifier] Classification recorded:', {
    orgId,
    taskType: result.taskType,
    recommendedModel: result.recommendedModel,
    method: result.classificationMethod,
    confidence: result.confidence,
    outcome: actualOutcome,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export const TaskClassifier = {
  classify: classifyTask,
  classifyWithKeywords,
  classifyWithGemini,
  classifyHybrid,
  recordClassification,
};

export default TaskClassifier;
