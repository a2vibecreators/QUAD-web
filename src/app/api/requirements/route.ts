/**
 * GET /api/requirements - List requirements for a domain
 * POST /api/requirements - Create a new requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: List requirements with filtering
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
    const status = searchParams.get('status');
    const sourceType = searchParams.get('source_type');
    const aiProcessed = searchParams.get('ai_processed');

    // Get organization domains
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
    const domainIds = orgDomains.map(d => d.id);

    // Build where clause
    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (status) where.status = status;
    if (sourceType) where.source_type = sourceType;
    if (aiProcessed !== null) where.ai_processed = aiProcessed === 'true';

    const requirements = await prisma.qUAD_requirements.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        milestones: {
          select: {
            id: true,
            title: true,
            status: true,
            sequence_order: true
          },
          orderBy: { sequence_order: 'asc' }
        },
        _count: {
          select: { milestones: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Group by status
    const byStatus = {
      draft: requirements.filter(r => r.status === 'draft'),
      processing: requirements.filter(r => r.status === 'processing'),
      approved: requirements.filter(r => r.status === 'approved'),
      archived: requirements.filter(r => r.status === 'archived')
    };

    return NextResponse.json({
      requirements,
      by_status: byStatus,
      total: requirements.length
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new requirement
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

    const body = await request.json();
    const {
      domain_id,
      title,
      description,
      source_type,
      source_file_url,
      source_file_name
    } = body;

    // Validation
    if (!domain_id || !title) {
      return NextResponse.json(
        { error: 'domain_id and title are required' },
        { status: 400 }
      );
    }

    if (!source_type || !['UPLOAD', 'MANUAL', 'MEETING_TRANSCRIPT'].includes(source_type)) {
      return NextResponse.json(
        { error: 'source_type must be UPLOAD, MANUAL, or MEETING_TRANSCRIPT' },
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

    // Create requirement
    const requirement = await prisma.qUAD_requirements.create({
      data: {
        domain_id,
        title,
        description,
        source_type,
        source_file_url,
        source_file_name,
        status: 'draft',
        created_by: payload.userId
      },
      include: {
        domain: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error('Create requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
