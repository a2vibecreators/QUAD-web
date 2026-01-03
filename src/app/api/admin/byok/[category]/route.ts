/**
 * GET /api/admin/byok/[category]
 * PATCH /api/admin/byok/[category]
 *
 * Get BYOK providers for a specific category and toggle category-level BYOK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import {
  getBYOKProvidersByCategory,
  BYOK_CATEGORY_NAMES,
  BYOK_CATEGORY_DESCRIPTIONS,
  type BYOKCategory,
} from '@/lib/integrations/byok-matrix';

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

    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { org_id: true, role: true },
    });

    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Get providers for this category
    const providers = getBYOKProvidersByCategory(category as BYOKCategory);

    // Get org settings
    const orgSettings = await prisma.qUAD_org_settings.findUnique({
      where: { org_id: user.org_id },
    });

    // Get configured integrations based on category
    let configuredProviders: { provider: string; use_byok: boolean; byok_client_id: string | null }[] = [];

    if (category === 'git') {
      configuredProviders = await prisma.qUAD_git_integrations.findMany({
        where: { org_id: user.org_id },
        select: { provider: true, use_byok: true, byok_client_id: true },
      });
    } else if (category === 'calendar') {
      configuredProviders = await prisma.qUAD_meeting_integrations.findMany({
        where: { org_id: user.org_id },
        select: { provider: true, use_byok: true, byok_client_id: true },
      });
    }
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

    const user = await prisma.qUAD_users.findUnique({
      where: { email: session.user.email },
      select: { org_id: true, role: true },
    });

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
    await prisma.qUAD_org_settings.upsert({
      where: { org_id: user.org_id },
      update: { [fieldName]: enabled },
      create: {
        org_id: user.org_id,
        [fieldName]: enabled,
      },
    });

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
