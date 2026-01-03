/**
 * Codebase Search API - Find relevant tables/code for AI context
 *
 * GET /api/codebase/search - Search codebase index
 * POST /api/codebase/index - Build/refresh codebase index
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { CodebaseIndexer } from '@/lib/services/codebase-indexer';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const orgId = searchParams.get('org_id');
    const maxResults = parseInt(searchParams.get('max_results') || '10');
    const useRag = searchParams.get('use_rag') === 'true';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const format = searchParams.get('format') || 'json'; // json or ai

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const results = await CodebaseIndexer.search({
      query,
      orgId,
      maxResults,
      useRag,
      categories,
    });

    if (format === 'ai') {
      // Return formatted for AI consumption
      const aiContext = CodebaseIndexer.formatForAI(results, 2000);
      return NextResponse.json({
        success: true,
        context: aiContext,
        tables_included: results.length,
        total_tokens: Math.ceil(aiContext.length / 4),
      });
    }

    return NextResponse.json({
      success: true,
      query,
      results: results.map(r => ({
        table_name: r.table.tableName,
        display_name: r.table.displayName,
        category: r.table.category,
        description: r.table.description,
        score: r.score.toFixed(2),
        match_type: r.matchType,
        matched_keywords: r.matchedKeywords,
        columns: r.table.columns.length,
        relationships: r.table.relationships,
        token_count: r.table.tokenCount,
      })),
      metadata: {
        total_results: results.length,
        search_mode: useRag ? 'rag' : 'keyword',
        categories_searched: categories || 'all',
      },
    });
  } catch (error) {
    console.error('[Codebase Search API] Error:', error);
    return NextResponse.json({ error: 'Failed to search codebase' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { org_id } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    await CodebaseIndexer.buildIndex(org_id);

    const stats = {
      tables_indexed: CodebaseIndexer.QUAD_TABLES.length,
      categories: [...new Set(CodebaseIndexer.QUAD_TABLES.map(t => t.category))],
      total_tokens: CodebaseIndexer.QUAD_TABLES.reduce((sum, t) => sum + t.tokenCount, 0),
    };

    return NextResponse.json({
      success: true,
      message: 'Codebase index built successfully',
      stats,
      categories_breakdown: stats.categories.map(cat => ({
        category: cat,
        tables: CodebaseIndexer.QUAD_TABLES.filter(t => t.category === cat).length,
      })),
    });
  } catch (error) {
    console.error('[Codebase Index API] Error:', error);
    return NextResponse.json({ error: 'Failed to build index' }, { status: 500 });
  }
}
