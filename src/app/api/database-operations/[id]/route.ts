/**
 * Database Operations - Single Operation API
 *
 * GET /api/database-operations/[id] - Get operation details
 * PATCH /api/database-operations/[id] - Approve/reject or execute operation
 * DELETE /api/database-operations/[id] - Cancel pending operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const operation = await prisma.qUAD_database_operations.findUnique({
      where: { id },
      include: {
        domain: {
          select: { id: true, name: true, org_id: true }
        },
        approvals: true
      }
    });

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.companyId) {
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

    const operation = await prisma.qUAD_database_operations.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } },
        approvals: true
      }
    });

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle approval/rejection
    if (action === 'approve' || action === 'reject') {
      if (!approver_role) {
        return NextResponse.json({ error: 'approver_role is required for approve/reject' }, { status: 400 });
      }

      // Find the approval record
      const approval = operation.approvals.find(a => a.approver_role === approver_role);
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
      await prisma.qUAD_database_approvals.update({
        where: { id: approval.id },
        data: {
          approver_id: payload.userId,
          decision: action === 'approve' ? 'approved' : 'rejected',
          comments,
          decided_at: new Date()
        }
      });

      // Check if operation is now fully approved or rejected
      const updatedApprovals = await prisma.qUAD_database_approvals.findMany({
        where: { operation_id: id }
      });

      const allApproved = updatedApprovals.every(a => a.decision === 'approved');
      const anyRejected = updatedApprovals.some(a => a.decision === 'rejected');

      let newStatus = operation.status;
      if (anyRejected) {
        newStatus = 'failed';
        await prisma.qUAD_database_operations.update({
          where: { id },
          data: {
            status: 'failed',
            error_message: `Rejected by ${approver_role}: ${comments || 'No reason provided'}`
          }
        });
      } else if (allApproved) {
        newStatus = 'pending';
        await prisma.qUAD_database_operations.update({
          where: { id },
          data: { status: 'pending' }
        });
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
      await prisma.qUAD_database_operations.update({
        where: { id },
        data: {
          status: 'in_progress',
          started_at: new Date()
        }
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
      await prisma.qUAD_database_operations.update({
        where: { id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          execution_log: executionLog.join('\n'),
          record_count: 1000 // Simulated
        }
      });

      const result = await prisma.qUAD_database_operations.findUnique({
        where: { id }
      });

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

    const operation = await prisma.qUAD_database_operations.findUnique({
      where: { id },
      include: { domain: { select: { org_id: true } } }
    });

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.domain.org_id !== payload.companyId) {
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
    await prisma.qUAD_database_operations.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Operation cancelled successfully' });
  } catch (error) {
    console.error('Delete operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
