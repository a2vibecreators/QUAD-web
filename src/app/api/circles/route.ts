/**
 * GET /api/circles - Get circles (team groups within domains)
 * POST /api/circles - Create a new circle
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get circles
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
    const domainId = searchParams.get('domain_id');
    const isActive = searchParams.get('is_active');

    // Get organization's domains
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (isActive !== null && isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const circles = await prisma.qUAD_circles.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, email: true, full_name: true }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
                adoption_matrix: {
                  select: { skill_level: true, trust_level: true }
                }
              }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: [
        { domain_id: 'asc' },
        { circle_number: 'asc' }
      ]
    });

    return NextResponse.json({ circles });
  } catch (error) {
    console.error('Get circles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new circle
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

    // Only admins and managers can create circles
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { domain_id, circle_number, circle_name, description, lead_user_id } = body;

    // Validation
    if (!domain_id || !circle_number || !circle_name) {
      return NextResponse.json(
        { error: 'domain_id, circle_number, and circle_name are required' },
        { status: 400 }
      );
    }

    // Verify domain exists and belongs to user's company
    const domain = await prisma.qUAD_domains.findUnique({
      where: { id: domain_id }
    });

    if (!domain || domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check if circle_number already exists in domain
    const existing = await prisma.qUAD_circles.findUnique({
      where: {
        domain_id_circle_number: { domain_id, circle_number }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Circle ${circle_number} already exists in this domain` },
        { status: 409 }
      );
    }

    // If lead_user_id provided, verify they're in same company
    if (lead_user_id) {
      const leadUser = await prisma.qUAD_users.findUnique({
        where: { id: lead_user_id }
      });
      if (!leadUser || leadUser.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'Lead user not found' }, { status: 404 });
      }
    }

    const circle = await prisma.qUAD_circles.create({
      data: {
        domain_id,
        circle_number,
        circle_name,
        description,
        lead_user_id
      },
      include: {
        domain: { select: { id: true, name: true } },
        lead: { select: { id: true, email: true, full_name: true } }
      }
    });

    return NextResponse.json(circle, { status: 201 });
  } catch (error) {
    console.error('Create circle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
