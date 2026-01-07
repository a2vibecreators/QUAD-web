/**
 * API Routes for Demo Settings
 *
 * GET /api/demo-settings?orgId=xxx - Get demo settings for org
 * POST /api/demo-settings - Save demo settings for org
 *
 * Table: quad_demo_settings
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch demo settings by org_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const configName = searchParams.get("configName") || "default";

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Fetch from database
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
        AND config_name = ${configName}
        AND is_active = true
      LIMIT 1
    `;

    const result = Array.isArray(settings) ? settings[0] : null;

    if (!result) {
      // Return empty default if not found
      return NextResponse.json({
        orgId,
        configName,
        presetKey: null,
        enabledFeatures: {},
        isDefault: false,
        found: false,
      });
    }

    return NextResponse.json({
      id: result.id,
      orgId: result.org_id,
      configName: result.config_name,
      presetKey: result.preset_key,
      enabledFeatures: result.enabled_features,
      description: result.description,
      isDefault: result.is_default,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      found: true,
    });
  } catch (error) {
    console.error("Error fetching demo settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo settings" },
      { status: 500 }
    );
  }
}

// POST - Save demo settings by org_id
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgId,
      configName = "default",
      presetKey,
      enabledFeatures,
      description,
      isDefault = false,
    } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    if (!enabledFeatures || typeof enabledFeatures !== "object") {
      return NextResponse.json(
        { error: "enabledFeatures object is required" },
        { status: 400 }
      );
    }

    // Upsert - insert or update on conflict
    const result = await prisma.$executeRaw`
      INSERT INTO quad_demo_settings (
        org_id,
        config_name,
        preset_key,
        enabled_features,
        description,
        is_default,
        is_active
      ) VALUES (
        ${orgId}::uuid,
        ${configName},
        ${presetKey || null},
        ${JSON.stringify(enabledFeatures)}::jsonb,
        ${description || null},
        ${isDefault},
        true
      )
      ON CONFLICT (org_id, config_name) DO UPDATE SET
        preset_key = EXCLUDED.preset_key,
        enabled_features = EXCLUDED.enabled_features,
        description = EXCLUDED.description,
        is_default = EXCLUDED.is_default,
        updated_at = CURRENT_TIMESTAMP
    `;

    // If this is being set as default, unset other defaults for this org
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE quad_demo_settings
        SET is_default = false, updated_at = CURRENT_TIMESTAMP
        WHERE org_id = ${orgId}::uuid
          AND config_name != ${configName}
          AND is_default = true
      `;
    }

    return NextResponse.json({
      success: true,
      orgId,
      configName,
      presetKey,
      message: "Demo settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving demo settings:", error);
    return NextResponse.json(
      { error: "Failed to save demo settings" },
      { status: 500 }
    );
  }
}

// DELETE - Remove demo settings
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const configName = searchParams.get("configName");

    if (!orgId || !configName) {
      return NextResponse.json(
        { error: "orgId and configName are required" },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`
      UPDATE quad_demo_settings
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE org_id = ${orgId}::uuid
        AND config_name = ${configName}
    `;

    return NextResponse.json({
      success: true,
      message: "Demo settings deleted",
    });
  } catch (error) {
    console.error("Error deleting demo settings:", error);
    return NextResponse.json(
      { error: "Failed to delete demo settings" },
      { status: 500 }
    );
  }
}
