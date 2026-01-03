/**
 * GET /api/flows/[id] - Get flow by ID
 * PUT /api/flows/[id] - Update flow
 * DELETE /api/flows/[id] - Delete flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get flow by ID with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const flow = await prisma.qUAD_flows.findUnique({
      where: { id },
      include: {
        domain: {
          select: { id: true, name: true, org_id: true }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            full_name: true,
            adoption_matrix: {
              select: { skill_level: true, trust_level: true }
            }
          }
        },
        creator: {
          select: { id: true, email: true, full_name: true }
        },
        stage_history: {
          orderBy: { created_at: 'desc' },
          take: 20
        }
      }
    });

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    // Verify flow belongs to user's organization
    if (flow.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate time in each stage
    const stageTimes = {
      Q: flow.question_completed_at && flow.question_started_at
        ? (new Date(flow.question_completed_at).getTime() - new Date(flow.question_started_at).getTime()) / 1000 / 60 / 60
        : null,
      U: flow.understand_completed_at && flow.understand_started_at
        ? (new Date(flow.understand_completed_at).getTime() - new Date(flow.understand_started_at).getTime()) / 1000 / 60 / 60
        : null,
      A: flow.allocate_completed_at && flow.allocate_started_at
        ? (new Date(flow.allocate_completed_at).getTime() - new Date(flow.allocate_started_at).getTime()) / 1000 / 60 / 60
        : null,
      D: flow.deliver_completed_at && flow.deliver_started_at
        ? (new Date(flow.deliver_completed_at).getTime() - new Date(flow.deliver_started_at).getTime()) / 1000 / 60 / 60
        : null
    };

    return NextResponse.json({
      ...flow,
      stage_times_hours: stageTimes
    });
  } catch (error) {
    console.error('Get flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update flow
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Get existing flow
    const existing = await prisma.qUAD_flows.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      flow_type,
      quad_stage,
      stage_status,
      assigned_to,
      circle_number,
      priority,
      ai_estimate_hours,
      buffer_pct,
      actual_hours,
      external_id,
      external_url,
      change_reason
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (flow_type !== undefined) updateData.flow_type = flow_type;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (circle_number !== undefined) updateData.circle_number = circle_number;
    if (priority !== undefined) updateData.priority = priority;
    if (ai_estimate_hours !== undefined) updateData.ai_estimate_hours = ai_estimate_hours;
    if (buffer_pct !== undefined) updateData.buffer_pct = buffer_pct;
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours;
    if (external_id !== undefined) updateData.external_id = external_id;
    if (external_url !== undefined) updateData.external_url = external_url;

    // Handle stage transition
    if (quad_stage && quad_stage !== existing.quad_stage) {
      // Complete current stage
      const now = new Date();
      const stageCompletedField = `${existing.quad_stage.toLowerCase() === 'q' ? 'question' :
        existing.quad_stage.toLowerCase() === 'u' ? 'understand' :
        existing.quad_stage.toLowerCase() === 'a' ? 'allocate' : 'deliver'}_completed_at`;
      updateData[stageCompletedField] = now;

      // Start new stage
      const stageStartedField = `${quad_stage.toLowerCase() === 'q' ? 'question' :
        quad_stage.toLowerCase() === 'u' ? 'understand' :
        quad_stage.toLowerCase() === 'a' ? 'allocate' : 'deliver'}_started_at`;
      updateData[stageStartedField] = now;

      updateData.quad_stage = quad_stage;
      updateData.stage_status = stage_status || 'pending';

      // Record stage history
      await prisma.qUAD_flow_stage_history.create({
        data: {
          flow_id: id,
          from_stage: existing.quad_stage,
          to_stage: quad_stage,
          from_status: existing.stage_status || undefined,
          to_status: stage_status || 'pending',
          changed_by: payload.userId,
          change_reason: change_reason || `Moved from ${existing.quad_stage} to ${quad_stage}`
        }
      });
    } else if (stage_status && stage_status !== existing.stage_status) {
      // Just status change within same stage
      updateData.stage_status = stage_status;

      await prisma.qUAD_flow_stage_history.create({
        data: {
          flow_id: id,
          from_stage: existing.quad_stage,
          to_stage: existing.quad_stage,
          from_status: existing.stage_status || undefined,
          to_status: stage_status,
          changed_by: payload.userId,
          change_reason: change_reason || `Status changed to ${stage_status}`
        }
      });
    }

    const flow = await prisma.qUAD_flows.update({
      where: { id },
      data: updateData,
      include: {
        domain: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, full_name: true } }
      }
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Update flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete flow
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Only admins and managers can delete flows
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.qUAD_flows.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.qUAD_flows.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('Delete flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
