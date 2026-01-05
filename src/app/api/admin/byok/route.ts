/**
 * GET /api/admin/byok
 *
 * Get BYOK status overview for the organization.
 * Shows which categories have BYOK enabled and which providers are configured.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getAllBYOKCategories,
  BYOK_CATEGORY_NAMES,
  BYOK_CATEGORY_DESCRIPTIONS,
  type BYOKCategory,
} from '@/lib/integrations/byok-matrix';

// TODO: All database operations in this file need to be implemented via Java backend

interface OrgSettings {
  byok_git_enabled: boolean;
  byok_calendar_enabled: boolean;
  byok_ai_enabled: boolean;
  byok_communication_enabled: boolean;
}

interface Integration {
  provider: string;
  use_byok: boolean;
  byok_client_id: string | null;
  is_configured: boolean;
}

async function getUserWithRole(_email: string): Promise<{ org_id: string | null; role: string | null } | null> {
  console.log('[BYOK] getUserWithRole - stub');
  return null;
}

async function getOrgSettings(_orgId: string): Promise<OrgSettings | null> {
  console.log(`[BYOK] getOrgSettings: ${_orgId}`);
  return null;
}

async function getGitIntegrations(_orgId: string): Promise<Integration[]> {
  console.log(`[BYOK] getGitIntegrations: ${_orgId}`);
  return [];
}

async function getMeetingIntegrations(_orgId: string): Promise<Integration[]> {
  console.log(`[BYOK] getMeetingIntegrations: ${_orgId}`);
  return [];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const user = await getUserWithRole(session.user.email);

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
    const orgSettings = await getOrgSettings(user.org_id);

    // Get all integrations with BYOK status
    const [gitIntegrations, meetingIntegrations] = await Promise.all([
      getGitIntegrations(user.org_id),
      getMeetingIntegrations(user.org_id),
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
