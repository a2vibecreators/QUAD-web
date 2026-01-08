/**
 * GET /api/flows/[id] - Get flow by ID
 * PUT /api/flows/[id] - Update flow
 * DELETE /api/flows/[id] - Delete flow
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

interface RouteParams {
  params: Promise<{ id: string }>;
}

// TypeScript interfaces for data types
interface User {
  id: string;
  email: string;
  full_name: string | null;
  adoption_matrix?: { skill_level: number; trust_level: number }[];
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface FlowStageHistory {
  id: string;
  flow_id: string;
  from_stage: string | null;
  to_stage: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  change_reason: string | null;
  created_at: Date;
}

interface Flow {
  id: string;
  domain_id: string;
  title: string;
  description: string | null;
  flow_type: string;
  quad_stage: string;
  stage_status: string | null;
  question_started_at: Date | null;
  question_completed_at: Date | null;
  understand_started_at: Date | null;
  understand_completed_at: Date | null;
  allocate_started_at: Date | null;
  allocate_completed_at: Date | null;
  deliver_started_at: Date | null;
  deliver_completed_at: Date | null;
  assigned_to: string | null;
  circle_number: number | null;
  priority: string;
  ai_estimate_hours: number | null;
  buffer_pct: number | null;
  actual_hours: number | null;
  external_id: string | null;
  external_url: string | null;
  created_by: string;
  created_at: Date;
  domain?: Domain;
  assignee?: User | null;
  creator?: User | null;
  stage_history?: FlowStageHistory[];
}

interface FlowStageHistoryCreateInput {
  flow_id: string;
  from_stage?: string;
  to_stage: string;
  from_status?: string;
  to_status: string;
  changed_by: string;
  change_reason: string;
}

// Stub functions - replace with Java backend calls
async function findFlowById(id: string): Promise<Flow | null> {
  console.log(`[Flow] findFlowById: ${id} - stub`);
  return null;
}

async function findFlowWithDomain(id: string): Promise<(Flow & { domain: { org_id: string } }) | null> {
  console.log(`[Flow] findFlowWithDomain: ${id} - stub`);
  return null;
}

async function updateFlow(id: string, _data: Record<string, unknown>): Promise<Flow> {
  console.log(`[Flow] updateFlow: ${id} - stub`);
  const now = new Date();
  return {
    id,
    domain_id: 'mock-domain-id',
    title: 'Mock Flow',
    description: null,
    flow_type: 'feature',
    quad_stage: 'Q',
    stage_status: 'pending',
    question_started_at: now,
    question_completed_at: null,
    understand_started_at: null,
    understand_completed_at: null,
    allocate_started_at: null,
    allocate_completed_at: null,
    deliver_started_at: null,
    deliver_completed_at: null,
    assigned_to: null,
    circle_number: null,
    priority: 'medium',
    ai_estimate_hours: null,
    buffer_pct: null,
    actual_hours: null,
    external_id: null,
    external_url: null,
    created_by: 'mock-user-id',
    created_at: now,
  };
}

async function createFlowStageHistory(_data: FlowStageHistoryCreateInput): Promise<void> {
  console.log(`[Flow] createFlowStageHistory: flow=${_data.flow_id}, stage=${_data.to_stage} - stub`);
}

async function deleteFlow(id: string): Promise<void> {
  console.log(`[Flow] deleteFlow: ${id} - stub`);
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

    const flow = await findFlowById(id);

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    // Verify flow belongs to user's organization
    if (flow.domain?.org_id !== payload.orgId) {
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
    const existing = await findFlowWithDomain(id);

    if (!existing) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
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
      await createFlowStageHistory({
        flow_id: id,
        from_stage: existing.quad_stage,
        to_stage: quad_stage,
        from_status: existing.stage_status || undefined,
        to_status: stage_status || 'pending',
        changed_by: payload.userId,
        change_reason: change_reason || `Moved from ${existing.quad_stage} to ${quad_stage}`
      });
    } else if (stage_status && stage_status !== existing.stage_status) {
      // Just status change within same stage
      updateData.stage_status = stage_status;

      await createFlowStageHistory({
        flow_id: id,
        from_stage: existing.quad_stage,
        to_stage: existing.quad_stage,
        from_status: existing.stage_status || undefined,
        to_status: stage_status,
        changed_by: payload.userId,
        change_reason: change_reason || `Status changed to ${stage_status}`
      });
    }

    const flow = await updateFlow(id, updateData);

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

    const existing = await findFlowWithDomain(id);

    if (!existing) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    if (existing.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteFlow(id);

    return NextResponse.json({ message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('Delete flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
