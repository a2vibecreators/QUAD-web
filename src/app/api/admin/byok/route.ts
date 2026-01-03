/**
 * GET /api/admin/byok
 *
 * Get BYOK status overview for the organization.
 * Shows which categories have BYOK enabled and which providers are configured.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import {
  getAllBYOKCategories,
  BYOK_CATEGORY_NAMES,
  BYOK_CATEGORY_DESCRIPTIONS,
  type BYOKCategory,
} from '@/lib/integrations/byok-matrix';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
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

    // Check if user has admin role (can configure BYOK)
    const isAdmin = user.role === 'ADMIN' || user.role === 'OWNER';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get org settings for BYOK flags
    const orgSettings = await prisma.qUAD_org_settings.findUnique({
      where: { org_id: user.org_id },
      select: {
        byok_git_enabled: true,
        byok_calendar_enabled: true,
        byok_ai_enabled: true,
        byok_communication_enabled: true,
      },
    });

    // Get all integrations with BYOK status
    const [gitIntegrations, meetingIntegrations] = await Promise.all([
      prisma.qUAD_git_integrations.findMany({
        where: { org_id: user.org_id },
        select: {
          provider: true,
          use_byok: true,
          byok_client_id: true,
          is_configured: true,
        },
      }),
      prisma.qUAD_meeting_integrations.findMany({
        where: { org_id: user.org_id },
        select: {
          provider: true,
          use_byok: true,
          byok_client_id: true,
          is_configured: true,
        },
      }),
    ]);

    // Build BYOK status for each category
    const byokEnabledMap: Record<BYOKCategory, boolean> = {
      git: orgSettings?.byok_git_enabled || false,
      calendar: orgSettings?.byok_calendar_enabled || false,
      ai: orgSettings?.byok_ai_enabled || false,
      communication: orgSettings?.byok_communication_enabled || false,
    };

    // Map integrations to providers with BYOK status
    const providerStatus: Record<string, { hasByok: boolean; isConnected: boolean }> = {};

    gitIntegrations.forEach((i) => {
      providerStatus[i.provider] = {
        hasByok: i.use_byok && !!i.byok_client_id,
        isConnected: i.is_configured,
      };
    });

    meetingIntegrations.forEach((i) => {
      providerStatus[i.provider] = {
        hasByok: i.use_byok && !!i.byok_client_id,
        isConnected: i.is_configured,
      };
    });

    // Build response
    const categories = getAllBYOKCategories().map(({ category, providers }) => ({
      id: category,
      name: BYOK_CATEGORY_NAMES[category],
      description: BYOK_CATEGORY_DESCRIPTIONS[category],
      byokEnabled: byokEnabledMap[category],
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        supportsByok: p.supportsByok,
        authType: p.authType,
        hasByok: providerStatus[p.id]?.hasByok || false,
        isConnected: providerStatus[p.id]?.isConnected || false,
      })),
    }));

    return NextResponse.json({
      categories,
      summary: {
        totalProviders: categories.reduce((sum, c) => sum + c.providers.length, 0),
        byokConfigured: Object.values(providerStatus).filter((p) => p.hasByok).length,
        connected: Object.values(providerStatus).filter((p) => p.isConnected).length,
      },
    });
  } catch (error) {
    console.error('Get BYOK status error:', error);
    return NextResponse.json(
      { error: 'Failed to get BYOK status' },
      { status: 500 }
    );
  }
}
