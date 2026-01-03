/**
 * POST /api/resources/[resourceId]/attributes/blueprint
 * Upload blueprint attributes for a resource (Web App, Mobile App, Landing Page)
 *
 * Blueprint types supported:
 * - figma_url: Figma design files
 * - sketch_url: Sketch design files
 * - adobe_xd_url: Adobe XD files
 * - competitor_url: Competitor website URL (for inspiration)
 * - wireframe_image: Uploaded wireframe image
 * - blueprint_agent: AI-generated mockup
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Blueprint type detection patterns
const BLUEPRINT_PATTERNS = {
  figma_url: /figma\.com/i,
  sketch_url: /sketch\.cloud|sketch\.com/i,
  adobe_xd_url: /xd\.adobe\.com/i,
};

interface BlueprintUploadRequest {
  blueprintType?: 'figma_url' | 'sketch_url' | 'adobe_xd_url' | 'competitor_url' | 'wireframe_image' | 'blueprint_agent';
  blueprintUrl: string;
  additionalUrls?: Array<{ name: string; url: string }>;
}

/**
 * Auto-detect blueprint type from URL
 */
function detectBlueprintType(url: string): string {
  for (const [type, pattern] of Object.entries(BLUEPRINT_PATTERNS)) {
    if (pattern.test(url)) {
      return type;
    }
  }
  return 'competitor_url'; // Default to competitor URL
}

/**
 * Verify URL is accessible
 */
async function verifyUrl(url: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return {
      accessible: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message || 'URL verification failed',
    };
  }
}

/**
 * POST handler: Upload blueprint attributes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;
    const body: BlueprintUploadRequest = await request.json();
    const { blueprintType, blueprintUrl, additionalUrls } = body;

    // Validation
    if (!blueprintUrl) {
      return NextResponse.json(
        { error: 'Blueprint URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(blueprintUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
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

    // Check if blueprint is required for this resource type
    const requirementCheck = await query(
      `SELECT is_required FROM QUAD_resource_attribute_requirements
       WHERE resource_type = $1 AND attribute_name = 'blueprint_url'`,
      [resource.resource_type]
    );

    const isRequired = (requirementCheck.rows[0] as { is_required: boolean } | undefined)?.is_required || false;

    // Auto-detect blueprint type if not provided
    const detectedType = blueprintType || detectBlueprintType(blueprintUrl);

    // Verify URL accessibility
    const verification = await verifyUrl(blueprintUrl);

    // Insert/update blueprint attributes
    const now = new Date().toISOString();

    // Delete existing blueprint attributes if any
    await query(
      `DELETE FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name IN ('blueprint_type', 'blueprint_url', 'blueprint_verified', 'blueprint_verification_date', 'blueprint_additional_urls')`,
      [resourceId]
    );

    // Insert new blueprint attributes
    await query(
      `INSERT INTO QUAD_resource_attributes (resource_id, attribute_name, attribute_value, created_at, updated_at)
       VALUES
         ($1, 'blueprint_type', $2, $3, $3),
         ($1, 'blueprint_url', $4, $3, $3),
         ($1, 'blueprint_verified', $5, $3, $3),
         ($1, 'blueprint_verification_date', $6, $3, $3)`,
      [
        resourceId,
        detectedType,
        now,
        blueprintUrl,
        verification.accessible.toString(),
        now,
      ]
    );

    // Store additional URLs if provided
    if (additionalUrls && additionalUrls.length > 0) {
      await query(
        `INSERT INTO QUAD_resource_attributes (resource_id, attribute_name, attribute_value, created_at, updated_at)
         VALUES ($1, 'blueprint_additional_urls', $2, $3, $3)`,
        [resourceId, JSON.stringify(additionalUrls), now]
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Blueprint uploaded successfully',
      data: {
        resourceId,
        blueprintType: detectedType,
        blueprintUrl,
        verified: verification.accessible,
        verificationError: verification.error,
        additionalUrls: additionalUrls || [],
        isRequired,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Blueprint upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler: Retrieve blueprint attributes for a resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    // Get all blueprint-related attributes
    const result = await query(
      `SELECT attribute_name, attribute_value
       FROM QUAD_resource_attributes
       WHERE resource_id = $1
       AND attribute_name LIKE 'blueprint%'
       ORDER BY attribute_name`,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No blueprint found for this resource' },
        { status: 404 }
      );
    }

    // Transform rows to object
    const blueprint: any = {};
    for (const row of result.rows) {
      const r = row as { attribute_name: string; attribute_value: string };
      const key = r.attribute_name.replace('blueprint_', '');
      let value: string | boolean | object = r.attribute_value;

      // Parse JSON values
      if (key === 'additional_urls' || key === 'agent_answers') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      // Convert boolean strings
      if (key === 'verified' || key === 'agent_session_id') {
        value = value === 'true';
      }

      blueprint[key] = value;
    }

    return NextResponse.json({
      success: true,
      data: {
        resourceId,
        blueprint,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Blueprint retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
