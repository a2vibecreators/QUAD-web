/**
 * API Route to list all demo settings for an org
 *
 * GET /api/demo-settings/list?orgId=xxx - List all configs for org
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    const settings = await prisma.$queryRaw`
      SELECT
        id,
        org_id,
        config_name,
        preset_key,
        enabled_features,
        description,
        is_default,
        is_active,
        created_at,
        updated_at
      FROM quad_demo_settings
      WHERE org_id = ${orgId}::uuid
        AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `;

    const results = Array.isArray(settings) ? settings : [];

    return NextResponse.json({
      orgId,
      count: results.length,
      settings: results.map((s: any) => ({
        id: s.id,
        configName: s.config_name,
        presetKey: s.preset_key,
        enabledFeatures: s.enabled_features,
        description: s.description,
        isDefault: s.is_default,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error listing demo settings:", error);
    return NextResponse.json(
      { error: "Failed to list demo settings" },
      { status: 500 }
    );
  }
}
