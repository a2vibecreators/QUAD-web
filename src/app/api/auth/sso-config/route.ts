/**
 * SSO Configuration API
 * Returns company-specific SSO providers based on domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // For now, return default Google OAuth for all domains
    // TODO: Implement company-specific SSO with quad_company_domains and quad_company_sso_configs tables

    return NextResponse.json({
      isCustomDomain: false,
      companyName: 'QUAD Platform',
      providers: [
        {
          id: 'google',
          name: 'Google',
          icon: '/icons/google.svg',
          bgColor: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
          enabled: true,
        },
      ],
    });
  } catch (error) {
    console.error('SSO config lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
