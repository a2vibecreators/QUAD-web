/**
 * List Domains API
 * Returns all domains for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
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
      'SELECT id FROM quad_users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0] as { id: string };

    // Get all domains where user is a member
    const domainsResult = await query(
      `SELECT DISTINCT
        d.id,
        d.name,
        d.domain_type,
        d.path,
        d.created_at,
        ARRAY_AGG(DISTINCT dm.role) as roles
      FROM quad_domains d
      JOIN quad_domain_members dm ON dm.domain_id = d.id
      WHERE dm.user_id = $1
      GROUP BY d.id, d.name, d.domain_type, d.path, d.created_at
      ORDER BY d.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      domains: domainsResult.rows,
    });

  } catch (error) {
    console.error('List domains error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
