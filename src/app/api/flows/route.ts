/**
 * GET /api/flows - List flows (Q-U-A-D work items)
 * POST /api/flows - Create a new flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: List flows with filtering
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
    const quadStage = searchParams.get('quad_stage'); // Q, U, A, or D
    const stageStatus = searchParams.get('stage_status');
    const assignedTo = searchParams.get('assigned_to');
    const priority = searchParams.get('priority');
    const circleNumber = searchParams.get('circle_number');
    const flowType = searchParams.get('flow_type');

    // Build where clause - filter by organization's domains
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId },
      select: { id: true }
    });
    const domainIds = orgDomains.map(d => d.id);

    const where: Record<string, unknown> = {
      domain_id: domainId ? domainId : { in: domainIds }
    };

    if (quadStage) where.quad_stage = quadStage;
    if (stageStatus) where.stage_status = stageStatus;
    if (assignedTo) where.assigned_to = assignedTo;
    if (priority) where.priority = priority;
    if (circleNumber) where.circle_number = parseInt(circleNumber);
    if (flowType) where.flow_type = flowType;

    const flows = await prisma.qUAD_flows.findMany({
      where,
      include: {
        domain: {
          select: { id: true, name: true }
        },
        assignee: {
          select: { id: true, email: true, full_name: true }
        },
        creator: {
          select: { id: true, email: true, full_name: true }
        },
        _count: {
          select: { stage_history: true }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { created_at: 'desc' }
      ]
    });

    // Group by QUAD stage for board view
    const byStage = {
      Q: flows.filter(f => f.quad_stage === 'Q'),
      U: flows.filter(f => f.quad_stage === 'U'),
      A: flows.filter(f => f.quad_stage === 'A'),
      D: flows.filter(f => f.quad_stage === 'D')
    };

    return NextResponse.json({
      flows,
      by_stage: byStage,
      total: flows.length
    });
  } catch (error) {
    console.error('Get flows error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new flow
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
      flow_type,
      assigned_to,
      circle_number,
      priority,
      ai_estimate_hours,
      buffer_pct,
      external_id,
      external_url
    } = body;

    // Validation
    if (!domain_id || !title) {
      return NextResponse.json(
        { error: 'domain_id and title are required' },
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

    // Create flow - starts in Q (Question) stage
    const flow = await prisma.qUAD_flows.create({
      data: {
        domain_id,
        title,
        description,
        flow_type: flow_type || 'feature',
        quad_stage: 'Q',
        stage_status: 'pending',
        question_started_at: new Date(),
        assigned_to,
        circle_number,
        priority: priority || 'medium',
        ai_estimate_hours,
        buffer_pct,
        external_id,
        external_url,
        created_by: payload.userId
      },
      include: {
        domain: {
          select: { id: true, name: true }
        },
        assignee: {
          select: { id: true, email: true, full_name: true }
        }
      }
    });

    // Create initial stage history entry
    await prisma.qUAD_flow_stage_history.create({
      data: {
        flow_id: flow.id,
        to_stage: 'Q',
        to_status: 'pending',
        changed_by: payload.userId,
        change_reason: 'Flow created'
      }
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error('Create flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
