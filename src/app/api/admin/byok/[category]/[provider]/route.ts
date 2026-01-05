/**
 * GET /api/admin/byok/[category]/[provider]
 * POST /api/admin/byok/[category]/[provider]
 * DELETE /api/admin/byok/[category]/[provider]
 *
 * Manage BYOK credentials for a specific provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import {
  getBYOKProviderConfig,
  type BYOKCategory,
} from '@/lib/integrations/byok-matrix';

// TODO: All database operations in this file need to be implemented via Java backend

async function getUserWithRole(_email: string): Promise<{ org_id: string | null; role: string | null } | null> {
  console.log('[BYOKProvider] getUserWithRole - stub');
  return null;
}

async function getGitIntegrationByok(_orgId: string, _provider: string): Promise<{ use_byok: boolean; byok_client_id: string | null; is_configured: boolean } | null> {
  console.log(`[BYOKProvider] getGitIntegrationByok: ${_provider}`);
  return null;
}

async function getMeetingIntegrationByok(_orgId: string, _provider: string): Promise<{ use_byok: boolean; byok_client_id: string | null; is_configured: boolean } | null> {
  console.log(`[BYOKProvider] getMeetingIntegrationByok: ${_provider}`);
  return null;
}

async function upsertGitIntegration(_orgId: string, _provider: string, _providerName: string, _data: object): Promise<void> {
  console.log(`[BYOKProvider] upsertGitIntegration: ${_provider}`);
}

async function upsertMeetingIntegration(_orgId: string, _provider: string, _providerName: string, _data: object): Promise<void> {
  console.log(`[BYOKProvider] upsertMeetingIntegration: ${_provider}`);
}

async function updateGitIntegrationByok(_orgId: string, _provider: string, _data: object): Promise<void> {
  console.log(`[BYOKProvider] updateGitIntegrationByok: ${_provider}`);
}

async function updateMeetingIntegrationByok(_orgId: string, _provider: string, _data: object): Promise<void> {
  console.log(`[BYOKProvider] updateMeetingIntegrationByok: ${_provider}`);
}

interface RouteParams {
  params: Promise<{ category: string; provider: string }>;
}

const VALID_CATEGORIES: BYOKCategory[] = ['git', 'calendar', 'ai', 'communication'];

/**
 * GET - Get BYOK status for a specific provider
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { category, provider } = await params;

    if (!VALID_CATEGORIES.includes(category as BYOKCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const providerConfig = getBYOKProviderConfig(provider);
    if (!providerConfig || providerConfig.category !== category) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
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

    // Get integration status based on category
    let byokStatus = { enabled: false, hasCredentials: false, clientIdPreview: null as string | null };

    if (category === 'git') {
      const integration = await getGitIntegrationByok(user.org_id, provider);

      byokStatus = {
        enabled: integration?.use_byok || false,
        hasCredentials: !!integration?.byok_client_id,
        clientIdPreview: integration?.byok_client_id
          ? integration.byok_client_id.substring(0, 8) + '...'
          : null,
      };
    } else if (category === 'calendar') {
      const integration = await getMeetingIntegrationByok(user.org_id, provider);

      byokStatus = {
        enabled: integration?.use_byok || false,
        hasCredentials: !!integration?.byok_client_id,
        clientIdPreview: integration?.byok_client_id
          ? integration.byok_client_id.substring(0, 8) + '...'
          : null,
      };
    }
    // AI and Communication would follow similar pattern

    return NextResponse.json({
      provider: {
        id: providerConfig.id,
        name: providerConfig.name,
        category: providerConfig.category,
        authType: providerConfig.authType,
        setupUrl: providerConfig.setupUrl,
        setupInstructions: providerConfig.setupInstructions,
        requiredFields: providerConfig.requiredFields,
        optionalFields: providerConfig.optionalFields,
      },
      byok: byokStatus,
    });
  } catch (error) {
    console.error('Get BYOK provider error:', error);
    return NextResponse.json(
      { error: 'Failed to get BYOK provider status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save BYOK credentials for a provider
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { category, provider } = await params;

    if (!VALID_CATEGORIES.includes(category as BYOKCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const providerConfig = getBYOKProviderConfig(provider);
    if (!providerConfig || providerConfig.category !== category) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (!providerConfig.supportsByok) {
      return NextResponse.json(
        { error: 'This provider does not support BYOK' },
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

    // Validate required fields
    for (const field of providerConfig.requiredFields) {
      if (!body[field.key]) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // Save BYOK credentials based on category
    if (category === 'git') {
      await upsertGitIntegration(user.org_id, provider, providerConfig.name, {
        use_byok: true,
        byok_client_id: body.client_id,
        byok_client_secret: body.client_secret,
        byok_redirect_uri: body.redirect_uri || null,
      });
    } else if (category === 'calendar') {
      await upsertMeetingIntegration(user.org_id, provider, providerConfig.name, {
        use_byok: true,
        byok_client_id: body.client_id,
        byok_client_secret: body.client_secret,
        byok_redirect_uri: body.redirect_uri || null,
      });
    }
    // AI and Communication would follow similar pattern

    return NextResponse.json({
      success: true,
      provider,
      byokEnabled: true,
      message: `BYOK credentials saved for ${providerConfig.name}. You can now connect using your own OAuth App.`,
    });
  } catch (error) {
    console.error('Save BYOK credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to save BYOK credentials' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove BYOK credentials and revert to QUAD Platform
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { category, provider } = await params;

    if (!VALID_CATEGORIES.includes(category as BYOKCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const providerConfig = getBYOKProviderConfig(provider);
    if (!providerConfig || providerConfig.category !== category) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
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

    // Clear BYOK credentials based on category
    if (category === 'git') {
      await updateGitIntegrationByok(user.org_id, provider, {
        use_byok: false,
        byok_client_id: null,
        byok_client_secret: null,
        byok_redirect_uri: null,
      });
    } else if (category === 'calendar') {
      await updateMeetingIntegrationByok(user.org_id, provider, {
        use_byok: false,
        byok_client_id: null,
        byok_client_secret: null,
        byok_redirect_uri: null,
      });
    }
    // AI and Communication would follow similar pattern

    return NextResponse.json({
      success: true,
      provider,
      byokEnabled: false,
      message: `BYOK disabled for ${providerConfig.name}. Will now use QUAD Platform credentials.`,
    });
  } catch (error) {
    console.error('Delete BYOK credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to remove BYOK credentials' },
      { status: 500 }
    );
  }
}
