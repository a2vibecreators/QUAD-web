/**
 * GET /api/flows - List flows (Q-U-A-D work items)
 * POST /api/flows - Create a new flow
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// TypeScript interfaces for data types
interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
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
  external_id: string | null;
  external_url: string | null;
  created_by: string;
  created_at: Date;
  domain?: { id: string; name: string };
  assignee?: User | null;
  creator?: User | null;
  _count?: { stage_history: number };
}

interface FlowCreateInput {
  domain_id: string;
  title: string;
  description?: string;
  flow_type: string;
  quad_stage: string;
  stage_status: string;
  question_started_at: Date;
  assigned_to?: string;
  circle_number?: number;
  priority: string;
  ai_estimate_hours?: number;
  buffer_pct?: number;
  external_id?: string;
  external_url?: string;
  created_by: string;
}

interface FlowStageHistoryCreateInput {
  flow_id: string;
  to_stage: string;
  to_status: string;
  changed_by: string;
  change_reason: string;
}

// Stub functions - replace with Java backend calls
async function findDomainsByOrgId(orgId: string): Promise<{ id: string }[]> {
  console.log(`[Flows] findDomainsByOrgId: ${orgId} - stub`);
  return [];
}

async function findFlows(_where: Record<string, unknown>): Promise<Flow[]> {
  console.log('[Flows] findFlows - stub');
  return [];
}

async function findDomainById(domainId: string): Promise<Domain | null> {
  console.log(`[Flows] findDomainById: ${domainId} - stub`);
  return null;
}

async function createFlow(_data: FlowCreateInput): Promise<Flow> {
  console.log('[Flows] createFlow - stub');
  const now = new Date();
  return {
    id: 'mock-flow-id',
    domain_id: _data.domain_id,
    title: _data.title,
    description: _data.description || null,
    flow_type: _data.flow_type,
    quad_stage: _data.quad_stage,
    stage_status: _data.stage_status,
    question_started_at: now,
    question_completed_at: null,
    understand_started_at: null,
    understand_completed_at: null,
    allocate_started_at: null,
    allocate_completed_at: null,
    deliver_started_at: null,
    deliver_completed_at: null,
    assigned_to: _data.assigned_to || null,
    circle_number: _data.circle_number || null,
    priority: _data.priority,
    ai_estimate_hours: _data.ai_estimate_hours || null,
    buffer_pct: _data.buffer_pct || null,
    external_id: _data.external_id || null,
    external_url: _data.external_url || null,
    created_by: _data.created_by,
    created_at: now,
  };
}

async function createFlowStageHistory(_data: FlowStageHistoryCreateInput): Promise<void> {
  console.log(`[Flows] createFlowStageHistory: flow=${_data.flow_id}, stage=${_data.to_stage} - stub`);
}

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
    const orgDomains = await findDomainsByOrgId(payload.orgId);
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

    const flows = await findFlows(where);

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
    const domain = await findDomainById(domain_id);

    if (!domain || domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Create flow - starts in Q (Question) stage
    const flow = await createFlow({
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
    });

    // Create initial stage history entry
    await createFlowStageHistory({
      flow_id: flow.id,
      to_stage: 'Q',
      to_status: 'pending',
      changed_by: payload.userId,
      change_reason: 'Flow created'
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
