/**
 * Create Domain API
 * Creates a new domain and assigns user as admin with all roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResult = await query(
      'SELECT id, company_id FROM quad_users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0] as { id: string; company_id: string };

    // Parse request body
    const body = await request.json();
    const { name, domainType } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }

    // Create domain
    const domainResult = await query(
      `INSERT INTO quad_domains (
        company_id,
        name,
        domain_type,
        path
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, name, domain_type, created_at`,
      [user.company_id, name.trim(), domainType || 'project', `/${name.trim().toLowerCase().replace(/\s+/g, '-')}`]
    );

    const domain = domainResult.rows[0] as { id: string; name: string; domain_type: string; created_at: string };

    // Assign user to domain with DOMAIN_ADMIN role
    // Note: Database has unique constraint on (user_id, domain_id), so only one row per user per domain
    await query(
      `INSERT INTO quad_domain_members (
        user_id,
        domain_id,
        role,
        allocation_percentage
      ) VALUES ($1, $2, $3, $4)`,
      [user.id, domain.id, 'DOMAIN_ADMIN', 100]
    );

    return NextResponse.json({
      success: true,
      domain: {
        id: domain.id,
        name: domain.name,
        type: domain.domain_type,
        createdAt: domain.created_at,
        roles: ['DOMAIN_ADMIN'],
      },
    });

  } catch (error) {
    console.error('Create domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
