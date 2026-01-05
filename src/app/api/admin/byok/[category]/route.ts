/**
 * GET /api/admin/byok/[category]
 * PATCH /api/admin/byok/[category]
 *
 * Get BYOK providers for a specific category and toggle category-level BYOK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getBYOKProvidersByCategory,
  BYOK_CATEGORY_NAMES,
  BYOK_CATEGORY_DESCRIPTIONS,
  type BYOKCategory,
} from '@/lib/integrations/byok-matrix';

// TODO: All database operations in this file need to be implemented via Java backend

async function getUserWithRole(_email: string): Promise<{ org_id: string | null; role: string | null } | null> {
  console.log('[BYOKCategory] getUserWithRole - stub');
  return null;
}

async function getOrgSettings(_orgId: string): Promise<{ [key: string]: boolean } | null> {
  console.log(`[BYOKCategory] getOrgSettings: ${_orgId}`);
  return null;
}

async function getConfiguredProviders(_orgId: string, _category: string): Promise<{ provider: string; use_byok: boolean; byok_client_id: string | null }[]> {
  console.log(`[BYOKCategory] getConfiguredProviders: ${_category}`);
  return [];
}

async function upsertOrgSettings(_orgId: string, _data: object): Promise<void> {
  console.log(`[BYOKCategory] upsertOrgSettings: ${_orgId}`);
}

interface RouteParams {
  params: Promise<{ category: string }>;
}

const VALID_CATEGORIES: BYOKCategory[] = ['git', 'calendar', 'ai', 'communication'];

/**
 * GET - List providers for a category with their BYOK status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { category } = await params;

    if (!VALID_CATEGORIES.includes(category as BYOKCategory)) {
      return NextResponse.json(
        { error: 'Invalid category. Valid: git, calendar, ai, communication' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserWithRole(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get providers for this category
    const providers = getBYOKProvidersByCategory(category as BYOKCategory);

    // Get org settings
    const orgSettings = await getOrgSettings(user.org_id);

    // Get configured integrations based on category
    const configuredProviders = await getConfiguredProviders(user.org_id, category);
    // AI and Communication would have their own integration tables

    // Build provider status map
    const statusMap = new Map(
      configuredProviders.map((p) => [
        p.provider,
        { hasByok: p.use_byok && !!p.byok_client_id },
      ])
    );

    // Category-level BYOK enabled flag
    const categoryByokField = `byok_${category}_enabled` as keyof typeof orgSettings;
    const categoryEnabled = orgSettings?.[categoryByokField] || false;

    return NextResponse.json({
      category: {
        id: category,
        name: BYOK_CATEGORY_NAMES[category as BYOKCategory],
        description: BYOK_CATEGORY_DESCRIPTIONS[category as BYOKCategory],
        byokEnabled: categoryEnabled,
      },
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        authType: p.authType,
        supportsByok: p.supportsByok,
        requiredFields: p.requiredFields,
        optionalFields: p.optionalFields,
        setupUrl: p.setupUrl,
        setupInstructions: p.setupInstructions,
        hasByok: statusMap.get(p.id)?.hasByok || false,
      })),
    });
  } catch (error) {
    console.error('Get BYOK category error:', error);
    return NextResponse.json(
      { error: 'Failed to get BYOK category' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Toggle category-level BYOK setting
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { category } = await params;

    if (!VALID_CATEGORIES.includes(category as BYOKCategory)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserWithRole(session.user.email);

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Check admin role
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled (boolean) is required' },
        { status: 400 }
      );
    }

    // Map category to field name
    const fieldMap: Record<BYOKCategory, string> = {
      git: 'byok_git_enabled',
      calendar: 'byok_calendar_enabled',
      ai: 'byok_ai_enabled',
      communication: 'byok_communication_enabled',
    };

    const fieldName = fieldMap[category as BYOKCategory];

    // Update org settings
    await upsertOrgSettings(user.org_id, { [fieldName]: enabled });

    return NextResponse.json({
      success: true,
      category,
      byokEnabled: enabled,
    });
  } catch (error) {
    console.error('Toggle BYOK category error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle BYOK category' },
      { status: 500 }
    );
  }
}
