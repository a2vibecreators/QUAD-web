/**
 * GET /api/domains - List domains in organization (hierarchical)
 * POST /api/domains - Create a new domain (group or project)
 *
 * QUAD Hierarchy:
 * - Organization (QUAD_companies) - top level
 * - Domain with domain_type='GROUP' - sub-organization (can nest)
 * - Domain with domain_type='PROJECT' (is_project=true) - leaf, has Cycles/Tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Recursive function to build domain tree
interface DomainNode {
  id: string;
  name: string;
  domain_type: string | null;
  is_project: boolean;
  ticket_prefix: string | null;
  description: string | null;
  path: string | null;
  children: DomainNode[];
  _count: {
    members: number;
    cycles: number;
    tickets: number;
  };
}

async function buildDomainTree(orgId: string, parentId: string | null = null, includeDeleted: boolean = false): Promise<DomainNode[]> {
  const domains = await prisma.qUAD_domains.findMany({
    where: {
      org_id: orgId,
      parent_domain_id: parentId,
      ...(includeDeleted ? {} : { is_deleted: false })
    },
    include: {
      _count: {
        select: {
          members: true,
          cycles: true,
          tickets: true
        }
      }
    },
    orderBy: [
      { is_project: 'asc' }, // Groups first, then projects
      { name: 'asc' }
    ]
  });

  const nodes: DomainNode[] = [];
  for (const domain of domains) {
    const children = await buildDomainTree(orgId, domain.id, includeDeleted);
    nodes.push({
      id: domain.id,
      name: domain.name,
      domain_type: domain.domain_type,
      is_project: domain.is_project,
      ticket_prefix: domain.ticket_prefix,
      description: domain.description,
      path: domain.path,
      children,
      _count: domain._count
    });
  }
  return nodes;
}

// GET: List domains in organization
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent_id');
    const domainType = searchParams.get('domain_type');
    const flat = searchParams.get('flat') === 'true';
    const tree = searchParams.get('tree') === 'true';
    const projectsOnly = searchParams.get('projects_only') === 'true';
    // Only admins can see deleted domains
    const includeDeleted = searchParams.get('include_deleted') === 'true' && payload.role === 'ADMIN';

    // If tree view requested, return full hierarchy
    if (tree) {
      const domainTree = await buildDomainTree(payload.companyId, null, includeDeleted);
      return NextResponse.json({ domains: domainTree, view: 'tree' });
    }

    // Build where clause - filter out deleted by default
    const where: Record<string, unknown> = {
      org_id: payload.companyId,
      ...(includeDeleted ? {} : { is_deleted: false })
    };

    if (parentId) {
      where.parent_domain_id = parentId;
    } else if (!flat) {
      // By default, only show top-level domains
      where.parent_domain_id = null;
    }

    if (domainType) {
      where.domain_type = domainType;
    }

    // Only show projects (leaf domains that can have tickets)
    if (projectsOnly) {
      where.is_project = true;
    }

    const domains = await prisma.qUAD_domains.findMany({
      where,
      include: {
        parent_domain: {
          select: { id: true, name: true, path: true }
        },
        sub_domains: {
          select: {
            id: true,
            name: true,
            domain_type: true,
            is_project: true
          }
        },
        _count: {
          select: {
            members: true,
            resources: true,
            flows: true,
            circles: true,
            cycles: true,
            tickets: true
          }
        }
      },
      orderBy: [
        { is_project: 'asc' }, // Groups first
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Get domains error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new domain
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and managers can create domains
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, parent_domain_id, domain_type } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // If parent_domain_id provided, verify it exists and belongs to same company
    if (parent_domain_id) {
      const parentDomain = await prisma.qUAD_domains.findUnique({
        where: { id: parent_domain_id }
      });

      if (!parentDomain || parentDomain.org_id !== payload.companyId) {
        return NextResponse.json(
          { error: 'Parent domain not found' },
          { status: 404 }
        );
      }
    }

    // Build path for hierarchical navigation
    let path = `/${name}`;
    if (parent_domain_id) {
      const parentDomain = await prisma.qUAD_domains.findUnique({
        where: { id: parent_domain_id }
      });
      if (parentDomain) {
        path = `${parentDomain.path || ''}/${name}`;
      }
    }

    // Create domain - creator becomes DOMAIN_ADMIN (can delete)
    const domain = await prisma.qUAD_domains.create({
      data: {
        org_id: payload.companyId,
        name,
        parent_domain_id,
        domain_type,
        path,
        created_by: payload.userId // Track creator for delete permissions
      },
      include: {
        parent_domain: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, email: true, full_name: true }
        }
      }
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error('Create domain error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
