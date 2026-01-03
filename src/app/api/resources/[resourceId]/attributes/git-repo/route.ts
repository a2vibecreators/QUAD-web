/**
 * POST /api/resources/[resourceId]/attributes/git-repo
 * Link Git repository to a resource for tech stack analysis and style matching
 *
 * Stores Git repo metadata as resource attributes:
 * - git_repo_url: Repository URL
 * - git_repo_type: github, gitlab, bitbucket, azure_devops
 * - git_repo_private: true/false
 * - git_access_token_vault_path: Path to access token in Vaultwarden (for private repos)
 * - git_repo_analyzed: true/false (whether repo has been analyzed)
 * - git_repo_analysis_result: JSON with tech stack, patterns, components
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Git hosting provider detection patterns
const GIT_PROVIDER_PATTERNS = {
  github: /github\.com/i,
  gitlab: /gitlab\.com/i,
  bitbucket: /bitbucket\.org/i,
  azure_devops: /dev\.azure\.com|visualstudio\.com/i,
};

interface GitRepoLinkRequest {
  gitRepoUrl: string;
  gitRepoType?: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';
  gitRepoPrivate?: boolean;
  gitAccessTokenVaultPath?: string;
  triggerAnalysis?: boolean; // Whether to trigger immediate repo analysis
}

/**
 * Auto-detect Git provider from URL
 */
function detectGitProvider(url: string): string | null {
  for (const [provider, pattern] of Object.entries(GIT_PROVIDER_PATTERNS)) {
    if (pattern.test(url)) {
      return provider;
    }
  }
  return null;
}

/**
 * Validate Git repository URL format
 */
function isValidGitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      ['http:', 'https:', 'git:', 'ssh:'].includes(parsed.protocol) &&
      /\.(git|com|org)$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * POST handler: Link Git repository to resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;
    const body: GitRepoLinkRequest = await request.json();
    const {
      gitRepoUrl,
      gitRepoType,
      gitRepoPrivate = false,
      gitAccessTokenVaultPath,
      triggerAnalysis = false,
    } = body;

    // Validation
    if (!gitRepoUrl) {
      return NextResponse.json(
        { error: 'Git repository URL is required' },
        { status: 400 }
      );
    }

    if (!isValidGitUrl(gitRepoUrl)) {
      return NextResponse.json(
        { error: 'Invalid Git repository URL format' },
        { status: 400 }
      );
    }

    // Private repos require access token path
    if (gitRepoPrivate && !gitAccessTokenVaultPath) {
      return NextResponse.json(
        { error: 'Private repositories require gitAccessTokenVaultPath (path to token in Vaultwarden)' },
        { status: 400 }
      );
    }

    // Check if resource exists
    const resourceCheck = await query(
      'SELECT id, resource_type FROM QUAD_domain_resources WHERE id = $1',
      [resourceId]
    );

    if (resourceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const resource = resourceCheck.rows[0] as { id: string; resource_type: string };

    // Auto-detect Git provider if not specified
    const detectedProvider = gitRepoType || detectGitProvider(gitRepoUrl);

    if (!detectedProvider) {
      return NextResponse.json(
        { error: 'Could not detect Git provider. Please specify gitRepoType manually.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Delete existing Git repo attributes if any
    await query(
      `DELETE FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name LIKE 'git_%'`,
      [resourceId]
    );

    // Insert new Git repo attributes
    const attributes = [
      { name: 'git_repo_url', value: gitRepoUrl },
      { name: 'git_repo_type', value: detectedProvider },
      { name: 'git_repo_private', value: gitRepoPrivate.toString() },
      { name: 'git_repo_analyzed', value: 'false' }, // Not analyzed yet
    ];

    // Add vault path if provided
    if (gitAccessTokenVaultPath) {
      attributes.push({
        name: 'git_access_token_vault_path',
        value: gitAccessTokenVaultPath,
      });
    }

    // Insert all attributes
    for (const attr of attributes) {
      await query(
        `INSERT INTO QUAD_resource_attributes (resource_id, attribute_name, attribute_value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4)`,
        [resourceId, attr.name, attr.value, now]
      );
    }

    // TODO: If triggerAnalysis is true, queue Git repo analysis job
    // For now, we'll return a message that analysis must be triggered separately
    let analysisStatus = 'not_started';
    let analysisMessage = 'Git repo linked successfully. Analysis not triggered.';

    if (triggerAnalysis) {
      analysisMessage = 'Git repo linked. Analysis queued (not implemented yet).';
      analysisStatus = 'queued';
      // TODO: Call GitRepoAnalyzer service or queue background job
    }

    return NextResponse.json({
      success: true,
      message: analysisMessage,
      data: {
        resourceId,
        gitRepoUrl,
        gitRepoType: detectedProvider,
        gitRepoPrivate,
        analysisStatus,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Git repo link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler: Retrieve Git repository attributes for a resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    // Get all Git-related attributes
    const result = await query(
      `SELECT attribute_name, attribute_value
       FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name LIKE 'git_%'
       ORDER BY attribute_name`,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No Git repository found for this resource' },
        { status: 404 }
      );
    }

    // Transform rows to object
    const gitRepo: any = {};
    for (const row of result.rows) {
      const r = row as { attribute_name: string; attribute_value: string };
      const key = r.attribute_name.replace('git_', '').replace('repo_', '');
      let value: string | boolean | object = r.attribute_value;

      // Parse JSON values
      if (key === 'analysis_result') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      // Convert boolean strings
      if (key === 'private' || key === 'analyzed') {
        value = value === 'true';
      }

      gitRepo[key] = value;
    }

    return NextResponse.json({
      success: true,
      data: {
        resourceId,
        gitRepo,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Git repo retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler: Unlink Git repository from resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    // Delete all Git-related attributes
    const result = await query(
      `DELETE FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name LIKE 'git_%'
       RETURNING attribute_name`,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No Git repository found for this resource' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Git repository unlinked successfully',
      data: {
        resourceId,
        deletedAttributes: result.rows.length,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Git repo deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
