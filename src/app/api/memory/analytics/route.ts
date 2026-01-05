/**
 * Memory Analytics API - Usage stats and learning insights
 *
 * GET /api/memory/analytics - Get memory system analytics
 *
 * Shows:
 * - Token savings from smart context
 * - Most helpful chunks
 * - Common missing categories
 * - Iteration patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// Types
interface ContextSessionStats {
  id: string;
  session_type: string;
  iteration_count: number;
  initial_context_tokens: number;
  total_context_tokens: number;
  was_successful: boolean | null;
}

interface HelpfulChunk {
  id: string;
  section_path: string;
  times_retrieved: number;
  times_helpful: number;
  helpfulness_score: number;
  document: { memory_level: string; title: string };
}

interface MissingCategoryGroup {
  missing_category: string | null;
  _count: { id: number };
}

interface SessionTypeGroup {
  session_type: string;
  _count: { id: number };
  _avg: { iteration_count: number | null; total_context_tokens: number | null };
}

// TODO: Implement via Java backend when endpoints are ready
async function getContextSessions(orgId: string, sinceDate: Date): Promise<ContextSessionStats[]> {
  console.log(`[MemoryAnalytics] getContextSessions for org: ${orgId}, since: ${sinceDate.toISOString()}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getHelpfulChunks(orgId: string, limit: number): Promise<HelpfulChunk[]> {
  console.log(`[MemoryAnalytics] getHelpfulChunks for org: ${orgId}, limit: ${limit}`);
  return [];
}

// TODO: Implement via Java backend when endpoints are ready
async function getMissingCategoriesGrouped(orgId: string, sinceDate: Date): Promise<MissingCategoryGroup[]> {
  console.log(`[MemoryAnalytics] getMissingCategoriesGrouped for org: ${orgId}`);
  return [];
}

// TODO: Implement via Java backend when endpoints are ready
async function getSessionTypeStats(orgId: string, sinceDate: Date): Promise<SessionTypeGroup[]> {
  console.log(`[MemoryAnalytics] getSessionTypeStats for org: ${orgId}`);
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const days = parseInt(searchParams.get('days') || '30');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get session stats
    const sessions = await getContextSessions(orgId, sinceDate);

    // Calculate aggregates
    const totalSessions = sessions.length;
    const successfulSessions = sessions.filter(s => s.was_successful).length;
    const singleIterationSessions = sessions.filter(s => s.iteration_count === 1).length;

    const totalInitialTokens = sessions.reduce((sum, s) => sum + s.initial_context_tokens, 0);
    const totalContextTokens = sessions.reduce((sum, s) => sum + s.total_context_tokens, 0);

    // Get most helpful chunks
    const helpfulChunks = await getHelpfulChunks(orgId, 10);

    // Get common missing categories
    const missingCategories = await getMissingCategoriesGrouped(orgId, sinceDate);

    // Get session type breakdown
    const bySessionType = await getSessionTypeStats(orgId, sinceDate);

    // Calculate efficiency metrics
    // Estimate: Without smart context, we'd send ~10K tokens per session
    const estimatedNaiveTokens = totalSessions * 10000;
    const tokensSaved = estimatedNaiveTokens - totalContextTokens;
    const savingsPercentage = totalSessions > 0 ? ((tokensSaved / estimatedNaiveTokens) * 100).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      period: { days, since: sinceDate.toISOString() },

      summary: {
        total_sessions: totalSessions,
        successful_sessions: successfulSessions,
        success_rate: totalSessions > 0 ? ((successfulSessions / totalSessions) * 100).toFixed(1) + '%' : 'N/A',
        single_iteration_rate: totalSessions > 0 ? ((singleIterationSessions / totalSessions) * 100).toFixed(1) + '%' : 'N/A',
      },

      tokens: {
        total_initial_tokens: totalInitialTokens,
        total_context_tokens: totalContextTokens,
        avg_tokens_per_session: totalSessions > 0 ? Math.round(totalContextTokens / totalSessions) : 0,
        estimated_without_smart_context: estimatedNaiveTokens,
        tokens_saved: tokensSaved,
        savings_percentage: savingsPercentage + '%',
      },

      efficiency: {
        first_try_success_rate: totalSessions > 0 ? ((singleIterationSessions / totalSessions) * 100).toFixed(1) + '%' : 'N/A',
        avg_iterations: totalSessions > 0 ? (sessions.reduce((sum, s) => sum + s.iteration_count, 0) / totalSessions).toFixed(2) : 0,
        most_efficient_session_type: bySessionType.length > 0
          ? bySessionType.reduce((best, current) =>
              (Number(current._avg.iteration_count) || 99) < (Number(best._avg.iteration_count) || 99) ? current : best
            ).session_type
          : 'N/A',
      },

      most_helpful_chunks: helpfulChunks.map(c => ({
        section: c.section_path,
        level: c.document.memory_level,
        document: c.document.title,
        times_retrieved: c.times_retrieved,
        times_helpful: c.times_helpful,
        helpfulness: ((Number(c.helpfulness_score) || 0) * 100).toFixed(0) + '%',
      })),

      common_missing_info: missingCategories.map(m => ({
        category: m.missing_category || 'unknown',
        occurrences: m._count.id,
        suggestion: getMissingSuggestion(m.missing_category || ''),
      })),

      by_session_type: bySessionType.map(s => ({
        type: s.session_type,
        count: s._count.id,
        avg_iterations: Number(s._avg.iteration_count)?.toFixed(2) || 'N/A',
        avg_tokens: Math.round(Number(s._avg.total_context_tokens) || 0),
      })),
    });
  } catch (error) {
    console.error('[Memory Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function getMissingSuggestion(category: string): string {
  const suggestions: Record<string, string> = {
    'schema': 'Consider adding more database schema documentation to project memory',
    'api_endpoint': 'Consider documenting API endpoints in domain memory',
    'business_logic': 'Add business rules and domain logic to org/domain memory',
    'code_snippet': 'Ensure important code patterns are documented in project memory',
    'file_content': 'Consider adding key file summaries to project memory',
    'clarification': 'Review memory for unclear or ambiguous sections',
  };
  return suggestions[category] || 'Review memory documents for gaps';
}
