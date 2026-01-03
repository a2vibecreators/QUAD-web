/**
 * POST /api/resources/[resourceId]/analyze-repo
 * Trigger Git repository analysis
 *
 * Clones repo, analyzes tech stack, code patterns, and stores results
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import GitRepoAnalyzer from '@/lib/services/GitRepoAnalyzer';

/**
 * POST: Trigger repository analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    // Get Git repo attributes
    const repoResult = await query(
      `SELECT attribute_name, attribute_value
       FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name LIKE 'git_%'`,
      [resourceId]
    );

    if (repoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No Git repository linked to this resource. Link a repository first.' },
        { status: 404 }
      );
    }

    // Parse Git repo attributes
    const gitAttrs: Record<string, string> = {};
    for (const row of repoResult.rows) {
      const r = row as { attribute_name: string; attribute_value: string };
      const key = r.attribute_name.replace('git_', '').replace('repo_', '');
      gitAttrs[key] = r.attribute_value;
    }

    if (!gitAttrs.url) {
      return NextResponse.json(
        { error: 'Git repository URL not found' },
        { status: 400 }
      );
    }

    // Check if already analyzed
    if (gitAttrs.analyzed === 'true') {
      return NextResponse.json(
        {
          message: 'Repository already analyzed. Analysis result available.',
          data: {
            resourceId,
            analyzed: true,
            analysisResult: gitAttrs.analysis_result
              ? JSON.parse(gitAttrs.analysis_result)
              : null,
          },
        },
        { status: 200 }
      );
    }

    // Get access token from Vaultwarden if private repo
    let accessToken: string | undefined;
    if (gitAttrs.private === 'true' && gitAttrs.access_token_vault_path) {
      // TODO: Fetch token from Vaultwarden
      // For now, assume token is stored in environment variable
      accessToken = process.env.GIT_ACCESS_TOKEN;
    }

    // Initialize analyzer
    const analyzer = new GitRepoAnalyzer();

    // Run analysis (this may take 30-60 seconds)
    const analysisResult = await analyzer.analyzeRepository(
      gitAttrs.url,
      accessToken,
      gitAttrs.private === 'true'
    );

    // Save analysis result to database
    await analyzer.saveAnalysisResult(resourceId, analysisResult);

    return NextResponse.json({
      success: true,
      message: 'Repository analysis completed',
      data: {
        resourceId,
        gitRepoUrl: gitAttrs.url,
        analysisResult,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve analysis results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    // Get analysis result
    const result = await query(
      `SELECT attribute_value FROM QUAD_resource_attributes
       WHERE resource_id = $1 AND attribute_name = 'git_repo_analysis_result'`,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No analysis found. Run analysis first.' },
        { status: 404 }
      );
    }

    const analysisResult = JSON.parse((result.rows[0] as { attribute_value: string }).attribute_value);

    return NextResponse.json({
      success: true,
      data: {
        resourceId,
        analysisResult,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
