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

    // Fetch user's domain memberships with domain details
    const result = await query(
      `SELECT
        dm.id as membership_id,
        dm.domain_id,
        dm.role,
        dm.allocation_percentage,
        dm.is_primary_domain,
        dm.status,
        d.name as domain_name,
        d.display_name as domain_display_name,
        d.path as domain_path,
        d.domain_type,
        d.depth,
        c.name as company_name
      FROM "QUAD_domain_members" dm
      JOIN "QUAD_domains" d ON dm.domain_id = d.id
      LEFT JOIN "QUAD_organizations" c ON d.company_id = c.id
      WHERE dm.email = $1
        AND dm.status = 'active'
      ORDER BY
        dm.is_primary_domain DESC,
        d.depth ASC,
        d.display_name ASC`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        domains: [],
        message: 'No active domain memberships found',
      });
    }

    interface DomainRow {
      membership_id: string;
      domain_id: string;
      domain_name: string;
      domain_display_name: string;
      domain_path: string;
      domain_type: string;
      depth: number;
      role: string;
      allocation_percentage: string;
      is_primary_domain: boolean;
      company_name: string;
    }
    const domains = result.rows.map((r) => {
      const row = r as DomainRow;
      return {
        membership_id: row.membership_id,
        domain_id: row.domain_id,
        domain_name: row.domain_name,
        domain_display_name: row.domain_display_name,
        domain_path: row.domain_path,
        domain_type: row.domain_type,
        depth: row.depth,
        role: row.role,
        allocation_percentage: parseFloat(row.allocation_percentage),
        is_primary_domain: row.is_primary_domain,
        company_name: row.company_name,
      };
    });

    return NextResponse.json({
      domains,
      total_count: domains.length,
    });
  } catch (error: any) {
    console.error('Fetch user domains error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
