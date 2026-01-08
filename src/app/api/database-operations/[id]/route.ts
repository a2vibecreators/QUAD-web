/**
 * Database Operations - Single Operation API
 *
 * GET /api/database-operations/[id] - Get operation details
 * PATCH /api/database-operations/[id] - Approve/reject or execute operation
 * DELETE /api/database-operations/[id] - Cancel pending operation
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface DatabaseApproval {
  id: string;
  operation_id: string;
  approver_role: string;
  approver_id: string;
  decision: string;
  comments: string | null;
  decided_at: Date | null;
}

interface DatabaseOperation {
  id: string;
  domain_id: string;
  operation_type: string;
  source_env: string | null;
  target_env: string | null;
  tables_included: string[];
  anonymize_pii: boolean;
  pii_fields_masked: string[];
  sample_config: Record<string, unknown> | null;
  status: string;
  requires_approval: boolean;
  required_approvers: string[];
  initiated_by: string;
  started_at: Date | null;
  completed_at: Date | null;
  execution_log: string | null;
  record_count: number | null;
  error_message: string | null;
  created_at: Date;
  domain?: Domain;
  approvals?: DatabaseApproval[];
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findDatabaseOperationById(
  operationId: string
): Promise<(DatabaseOperation & { domain: Domain; approvals: DatabaseApproval[] }) | null> {
  console.log(`[DatabaseOperations] findDatabaseOperationById stub called: ${operationId}`);
  return null;
}

async function updateDatabaseApproval(
  approvalId: string,
  data: Partial<DatabaseApproval>
): Promise<DatabaseApproval> {
  console.log(`[DatabaseOperations] updateDatabaseApproval stub called: ${approvalId}`, data);
  return {
    id: approvalId,
    operation_id: 'mock-operation-id',
    approver_role: 'DBA',
    approver_id: data.approver_id || 'mock-user-id',
    decision: data.decision || 'pending',
    comments: data.comments || null,
    decided_at: data.decided_at || null,
  };
}

async function findApprovalsByOperationId(operationId: string): Promise<DatabaseApproval[]> {
  console.log(`[DatabaseOperations] findApprovalsByOperationId stub called: ${operationId}`);
  return [];
}

async function updateDatabaseOperation(
  operationId: string,
  data: Partial<DatabaseOperation>
): Promise<DatabaseOperation> {
  console.log(`[DatabaseOperations] updateDatabaseOperation stub called: ${operationId}`, data);
  return {
    id: operationId,
    domain_id: 'mock-domain-id',
    operation_type: 'copy_data',
    source_env: null,
    target_env: null,
    tables_included: [],
    anonymize_pii: false,
    pii_fields_masked: [],
    sample_config: null,
    status: data.status || 'pending',
    requires_approval: false,
    required_approvers: [],
    initiated_by: 'mock-user-id',
    started_at: data.started_at || null,
    completed_at: data.completed_at || null,
    execution_log: data.execution_log || null,
    record_count: data.record_count || null,
    error_message: data.error_message || null,
    created_at: new Date(),
  };
}

async function deleteDatabaseOperation(operationId: string): Promise<void> {
  console.log(`[DatabaseOperations] deleteDatabaseOperation stub called: ${operationId}`);
}

// GET: Get operation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const operation = await findDatabaseOperationById(id);

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Get operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Approve, reject, or execute operation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
    const { action, approver_role, comments } = body;
    // action: 'approve', 'reject', 'execute'

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const operation = await findDatabaseOperationById(id);

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle approval/rejection
    if (action === 'approve' || action === 'reject') {
      if (!approver_role) {
        return NextResponse.json({ error: 'approver_role is required for approve/reject' }, { status: 400 });
      }

      // Find the approval record
      const approval = operation.approvals?.find(a => a.approver_role === approver_role);
      if (!approval) {
        return NextResponse.json(
          { error: `No approval pending for role: ${approver_role}` },
          { status: 400 }
        );
      }

      if (approval.decision !== 'pending') {
        return NextResponse.json(
          { error: `This role has already ${approval.decision}` },
          { status: 400 }
        );
      }

      // Update the approval
      await updateDatabaseApproval(approval.id, {
        approver_id: payload.userId,
        decision: action === 'approve' ? 'approved' : 'rejected',
        comments,
        decided_at: new Date()
      });

      // Check if operation is now fully approved or rejected
      const updatedApprovals = await findApprovalsByOperationId(id);

      const allApproved = updatedApprovals.every(a => a.decision === 'approved');
      const anyRejected = updatedApprovals.some(a => a.decision === 'rejected');

      let newStatus = operation.status;
      if (anyRejected) {
        newStatus = 'failed';
        await updateDatabaseOperation(id, {
          status: 'failed',
          error_message: `Rejected by ${approver_role}: ${comments || 'No reason provided'}`
        });
      } else if (allApproved) {
        newStatus = 'pending';
        await updateDatabaseOperation(id, { status: 'pending' });
      }

      return NextResponse.json({
        message: action === 'approve' ? 'Approved successfully' : 'Rejected',
        operation_status: newStatus,
        all_approved: allApproved,
        ready_to_execute: allApproved && !anyRejected
      });
    }

    // Handle execution
    if (action === 'execute') {
      if (operation.status === 'pending_approval') {
        return NextResponse.json(
          { error: 'Operation is pending approval. All approvers must approve first.' },
          { status: 400 }
        );
      }

      if (operation.status !== 'pending') {
        return NextResponse.json(
          { error: `Cannot execute operation with status: ${operation.status}` },
          { status: 400 }
        );
      }

      // Mark as in_progress
      await updateDatabaseOperation(id, {
        status: 'in_progress',
        started_at: new Date()
      });

      // In a real implementation, this would:
      // 1. Connect to source DB
      // 2. Export data
      // 3. Apply anonymization
      // 4. Load into target DB
      // For now, we simulate with a delay

      // Simulate execution (in production, this would be a background job)
      const executionLog: string[] = [];
      executionLog.push(`[${new Date().toISOString()}] Starting ${operation.operation_type} operation`);

      if (operation.operation_type === 'copy_data') {
        executionLog.push(`[${new Date().toISOString()}] Source: ${operation.source_env}, Target: ${operation.target_env}`);
        executionLog.push(`[${new Date().toISOString()}] Tables: ${operation.tables_included.join(', ')}`);

        if (operation.anonymize_pii) {
          executionLog.push(`[${new Date().toISOString()}] Anonymizing PII fields: ${operation.pii_fields_masked.join(', ')}`);
        }

        // Simulate success
        executionLog.push(`[${new Date().toISOString()}] Data copy completed successfully`);
      } else if (operation.operation_type === 'generate_sample') {
        executionLog.push(`[${new Date().toISOString()}] Generating sample data with config: ${JSON.stringify(operation.sample_config)}`);
        executionLog.push(`[${new Date().toISOString()}] Sample data generation completed`);
      }

      // Mark as completed
      await updateDatabaseOperation(id, {
        status: 'completed',
        completed_at: new Date(),
        execution_log: executionLog.join('\n'),
        record_count: 1000 // Simulated
      });

      const result = await findDatabaseOperationById(id);

      return NextResponse.json({
        message: 'Operation executed successfully',
        operation: result
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel pending operation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const operation = await findDatabaseOperationById(id);

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only pending operations can be cancelled
    if (!['pending', 'pending_approval'].includes(operation.status)) {
      return NextResponse.json(
        { error: `Cannot cancel operation with status: ${operation.status}` },
        { status: 400 }
      );
    }

    // Delete the operation
    await deleteDatabaseOperation(id);

    return NextResponse.json({ message: 'Operation cancelled successfully' });
  } catch (error) {
    console.error('Delete operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
