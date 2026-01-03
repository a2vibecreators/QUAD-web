/**
 * GET /api/integrations/git/providers
 *
 * Returns list of available Git providers with their configuration.
 */

import { NextResponse } from 'next/server';
import { getAllGitProviders } from '@/lib/integrations';

export async function GET() {
  try {
    const providers = getAllGitProviders();

    // Return providers with safe info (no secrets)
    const safeProviders = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      icon: provider.icon,
      description: provider.description,
      features: provider.features,
      oauth: provider.oauth,
      comingSoon: provider.comingSoon || false,
    }));

    return NextResponse.json({
      providers: safeProviders,
      recommended: 'github',
    });
  } catch (error) {
    console.error('Failed to get Git providers:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    );
  }
}
