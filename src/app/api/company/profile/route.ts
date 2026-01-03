import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    // Get authenticated session
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || email !== session.user.email) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch user and organization data
    const result = await query(
      `SELECT
        u.id as user_id,
        u.email,
        u.role as user_role,
        u.is_active,
        c.id as company_id,
        c.name as company_name,
        c.admin_email,
        c.size as company_size,
        c.created_at as company_created_at,
        (SELECT COUNT(*) FROM "QUAD_users" WHERE company_id = c.id AND is_active = true) as active_users
      FROM "QUAD_users" u
      JOIN "QUAD_organizations" c ON u.company_id = c.id
      WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    interface UserDataRow {
      user_id: string;
      email: string;
      user_role: string;
      is_active: boolean;
      company_id: string;
      company_name: string;
      admin_email: string;
      company_size: string;
      company_created_at: string;
      active_users: string;
    }
    const userData = result.rows[0] as UserDataRow;

    const profile = {
      user: {
        id: userData.user_id,
        email: userData.email,
        role: userData.user_role,
        isActive: userData.is_active,
      },
      company: {
        id: userData.company_id,
        name: userData.company_name,
        adminEmail: userData.admin_email,
        size: userData.company_size,
        createdAt: userData.company_created_at,
        activeUsers: parseInt(userData.active_users),
      },
      integrations: [], // TODO: Add when QUAD_org_integrations table is implemented
    };

    // Format for dashboard component (flatten for easier access)
    return NextResponse.json({
      user_id: profile.user.id,
      email: profile.user.email,
      user_role: profile.user.role,
      company_id: profile.company.id,
      company_name: profile.company.name,
      company_size: profile.company.size,
      active_users: profile.company.activeUsers,
      integrations: profile.integrations,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
