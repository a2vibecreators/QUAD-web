/**
 * Codebase Index API
 *
 * GET /api/codebase-index?repo=quadframework
 *   - Returns the codebase index for AI context
 *
 * POST /api/codebase-index
 *   - Regenerates the codebase index
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getCodebaseIndex,
  formatIndexForAI,
  generateCodebaseIndex
} from '@/lib/ai/codebase-indexer';

// TODO: All database operations in this file need to be implemented via Java backend

interface IndexMetadata {
  total_tokens: number;
  token_savings_percent: number;
  file_count: number;
  table_count: number;
  api_count: number;
  loc_count: number;
  last_synced_at: Date | null;
  commit_hash: string | null;
}

async function getIndexMetadata(_orgId: string, _repoName: string): Promise<IndexMetadata | null> {
  console.log(`[CodebaseIndex] getIndexMetadata: ${_repoName}`);
  return null;
}

/**
 * GET - Fetch codebase index for AI context
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);
    const repoName = searchParams.get('repo') || 'quadframework';
    const format = searchParams.get('format') || 'json'; // json or text

    // Get index from database
    const index = await getCodebaseIndex(orgId, repoName);

    if (!index) {
      return NextResponse.json({
        success: false,
        error: 'Index not found. Run POST /api/codebase-index to generate.',
        hint: 'curl -X POST /api/codebase-index -d \'{"repoName":"quadframework","repoPath":"/path/to/repo"}\''
      }, { status: 404 });
    }

    // Get metadata
    const record = await getIndexMetadata(orgId, repoName);

    if (format === 'text') {
      // Return formatted text for direct AI injection
      const text = formatIndexForAI(index);
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        index,
        formatted: formatIndexForAI(index),
        metadata: {
          totalTokens: record?.total_tokens || 0,
          tokenSavingsPercent: record?.token_savings_percent || 0,
          fileCount: record?.file_count || 0,
          tableCount: record?.table_count || 0,
          apiCount: record?.api_count || 0,
          locCount: record?.loc_count || 0,
          lastSyncedAt: record?.last_synced_at,
          commitHash: record?.commit_hash
        }
      }
    });
  } catch (error) {
    console.error('[codebase-index] GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch codebase index'
    }, { status: 500 });
  }
}

/**
 * POST - Generate/regenerate codebase index
 *
 * Body: { repoName: string, repoPath: string, repoUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const body = await request.json();
    const { repoName, repoPath, repoUrl } = body;

    if (!repoName || !repoPath) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: repoName, repoPath'
      }, { status: 400 });
    }

    // Check if path exists (only works on server with filesystem access)
    // In production, you might use Git clone or GitHub API instead

    console.log(`[codebase-index] Generating index for ${repoName} at ${repoPath}`);

    const stats = await generateCodebaseIndex(orgId, repoPath, repoName, repoUrl);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Index generated successfully',
        stats: {
          fileCount: stats.fileCount,
          tableCount: stats.tableCount,
          apiCount: stats.apiCount,
          locCount: stats.locCount,
          totalTokens: stats.totalTokens,
          tokenSavingsPercent: stats.tokenSavingsPercent
        }
      }
    });
  } catch (error) {
    console.error('[codebase-index] POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate codebase index',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
