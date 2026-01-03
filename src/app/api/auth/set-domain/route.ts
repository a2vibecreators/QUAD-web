import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    // Get authenticated session
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { domain_id } = body;

    if (!domain_id) {
      return NextResponse.json(
        { error: 'Missing domain_id' },
        { status: 400 }
      );
    }

    // Verify user has access to this domain
    const membershipResult = await query(
      `SELECT
        dm.id,
        dm.role,
        dm.allocation_percentage,
        d.name as domain_name,
        d.display_name as domain_display_name,
        d.path as domain_path
      FROM QUAD_domain_members dm
      JOIN QUAD_domains d ON dm.domain_id = d.id
      WHERE dm.domain_id = $1
        AND dm.email = $2
        AND dm.status = 'active'`,
      [domain_id, session.user.email]
    );

    if (membershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this domain' },
        { status: 403 }
      );
    }

    interface MembershipRow {
      id: string;
      role: string;
      allocation_percentage: string;
      domain_name: string;
      domain_display_name: string;
      domain_path: string;
    }
    const membership = membershipResult.rows[0] as MembershipRow;

    // Get user capabilities for this domain/role
    const capabilitiesResult = await query(
      `SELECT
        capability_category,
        capability_name,
        can_execute,
        can_delegate
      FROM QUAD_role_capabilities
      WHERE role = $1`,
      [membership.role]
    );

    interface CapabilityRow {
      capability_category: string;
      capability_name: string;
      can_execute: boolean;
      can_delegate: boolean;
    }
    type CapabilitiesMap = Record<string, Record<string, { can_execute: boolean; can_delegate: boolean }>>;
    const capabilities = capabilitiesResult.rows.reduce((acc: CapabilitiesMap, r) => {
      const row = r as CapabilityRow;
      if (!acc[row.capability_category]) {
        acc[row.capability_category] = {};
      }
      acc[row.capability_category][row.capability_name] = {
        can_execute: row.can_execute,
        can_delegate: row.can_delegate,
      };
      return acc;
    }, {} as CapabilitiesMap);

    // TODO: Store domain_id and role in session
    // For now, we'll return the domain context
    // In production, this should update the session token with domain context

    return NextResponse.json({
      success: true,
      domain: {
        domain_id: domain_id,
        domain_name: membership.domain_name,
        domain_display_name: membership.domain_display_name,
        domain_path: membership.domain_path,
        role: membership.role,
        allocation_percentage: parseFloat(membership.allocation_percentage),
      },
      capabilities,
    });
  } catch (error: any) {
    console.error('Set domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
