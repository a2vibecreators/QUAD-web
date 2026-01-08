/**
 * Database Operations API
 *
 * GET /api/database-operations - List database operations for a domain
 * POST /api/database-operations - Create new database operation
 *
 * Operations:
 * 1. copy_data: Copy PROD data to DEV with anonymization
 * 2. generate_sample: AI-generate realistic sample data
 * 3. sync_check: Compare schemas between environments
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

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
  created_at: Date;
  approvals?: DatabaseApproval[];
}

interface AnonymizationRule {
  id: string;
  domain_id: string;
  table_name: string;
  column_name: string;
  is_active: boolean;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function findDomainById(domainId: string): Promise<Domain | null> {
  console.log(`[DatabaseOperations] findDomainById stub called: ${domainId}`);
  return null;
}

async function findDatabaseOperations(
  where: Record<string, unknown>
): Promise<(DatabaseOperation & { approvals: DatabaseApproval[] })[]> {
  console.log(`[DatabaseOperations] findDatabaseOperations stub called:`, where);
  return [];
}

async function findAnonymizationRules(
  domainId: string,
  tableNames: string[]
): Promise<AnonymizationRule[]> {
  console.log(`[DatabaseOperations] findAnonymizationRules stub called: ${domainId}`, tableNames);
  return [];
}

async function createDatabaseOperation(
  data: Omit<DatabaseOperation, 'id' | 'created_at'>
): Promise<DatabaseOperation> {
  console.log(`[DatabaseOperations] createDatabaseOperation stub called:`, data);
  return {
    id: 'mock-operation-id',
    domain_id: data.domain_id,
    operation_type: data.operation_type,
    source_env: data.source_env || null,
    target_env: data.target_env || null,
    tables_included: data.tables_included,
    anonymize_pii: data.anonymize_pii,
    pii_fields_masked: data.pii_fields_masked,
    sample_config: data.sample_config || null,
    status: data.status,
    requires_approval: data.requires_approval,
    required_approvers: data.required_approvers,
    initiated_by: data.initiated_by,
    created_at: new Date(),
  };
}

async function createDatabaseApproval(
  data: Omit<DatabaseApproval, 'id' | 'comments' | 'decided_at'>
): Promise<DatabaseApproval> {
  console.log(`[DatabaseOperations] createDatabaseApproval stub called:`, data);
  return {
    id: 'mock-approval-id',
    operation_id: data.operation_id,
    approver_role: data.approver_role,
    approver_id: data.approver_id,
    decision: data.decision,
    comments: null,
    decided_at: null,
  };
}

async function findDatabaseOperationById(
  operationId: string
): Promise<(DatabaseOperation & { approvals: DatabaseApproval[] }) | null> {
  console.log(`[DatabaseOperations] findDatabaseOperationById stub called: ${operationId}`);
  return null;
}

// ============================================================================
// Common PII fields to anonymize
// ============================================================================

const DEFAULT_PII_FIELDS: Record<string, string[]> = {
  users: ['email', 'full_name', 'phone', 'address', 'ssn'],
  customers: ['email', 'name', 'phone', 'address', 'date_of_birth'],
  employees: ['email', 'name', 'phone', 'address', 'ssn', 'salary'],
  orders: ['customer_email', 'shipping_address', 'billing_address'],
  payments: ['card_number', 'card_holder', 'billing_address'],
};

// GET: List database operations for a domain
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    const operationType = searchParams.get('operation_type');
    const status = searchParams.get('status');

    if (!domainId) {
      return NextResponse.json({ error: 'domain_id is required' }, { status: 400 });
    }

    // Verify domain belongs to user's org
    const domain = await findDomainById(domainId);

    if (!domain || domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Build filter
    const where: Record<string, unknown> = { domain_id: domainId };
    if (operationType) where.operation_type = operationType;
    if (status) where.status = status;

    const operations = await findDatabaseOperations(where);

    return NextResponse.json({ operations });
  } catch (error) {
    console.error('Get database operations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new database operation
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admins and managers can create database operations
    if (!['ADMIN', 'MANAGER', 'DOMAIN_ADMIN'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      domain_id,
      operation_type,  // copy_data, generate_sample, sync_check
      source_env,
      target_env,
      tables_included,
      anonymize_pii,
      sample_config,   // For generate_sample: { rows_per_table, context, locale }
      required_approvers  // ["DBA", "DATA_OWNER", "SECURITY"]
    } = body;

    // Validation
    if (!domain_id) {
      return NextResponse.json({ error: 'domain_id is required' }, { status: 400 });
    }

    if (!operation_type) {
      return NextResponse.json({ error: 'operation_type is required' }, { status: 400 });
    }

    const validOperations = ['copy_data', 'generate_sample', 'sync_check'];
    if (!validOperations.includes(operation_type)) {
      return NextResponse.json(
        { error: `operation_type must be one of: ${validOperations.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify domain belongs to user's org
    const domain = await findDomainById(domain_id);

    if (!domain || domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Validation based on operation type
    if (operation_type === 'copy_data') {
      if (!source_env || !target_env) {
        return NextResponse.json(
          { error: 'source_env and target_env are required for copy_data' },
          { status: 400 }
        );
      }

      // PROD → DEV requires approval
      if (source_env === 'PROD') {
        if (!required_approvers || required_approvers.length === 0) {
          return NextResponse.json(
            { error: 'required_approvers is required when copying from PROD' },
            { status: 400 }
          );
        }
      }
    }

    if (operation_type === 'generate_sample' && !sample_config) {
      return NextResponse.json(
        { error: 'sample_config is required for generate_sample (e.g., { rows_per_table: 1000, context: "banking app" })' },
        { status: 400 }
      );
    }

    // Determine PII fields to mask
    let piiFieldsToMask: string[] = [];
    if (anonymize_pii && tables_included && tables_included.length > 0) {
      for (const table of tables_included) {
        const tablePii = DEFAULT_PII_FIELDS[table.toLowerCase()];
        if (tablePii) {
          piiFieldsToMask.push(...tablePii.map(field => `${table}.${field}`));
        }
      }

      // Also get custom anonymization rules for this domain
      const customRules = await findAnonymizationRules(domain_id, tables_included);

      for (const rule of customRules) {
        const fieldPath = `${rule.table_name}.${rule.column_name}`;
        if (!piiFieldsToMask.includes(fieldPath)) {
          piiFieldsToMask.push(fieldPath);
        }
      }
    }

    // Determine if approval is needed
    const needsApproval = source_env === 'PROD' || (required_approvers && required_approvers.length > 0);
    const initialStatus = needsApproval ? 'pending_approval' : 'pending';

    // Create the operation
    const operation = await createDatabaseOperation({
      domain_id,
      operation_type,
      source_env,
      target_env,
      tables_included: tables_included || [],
      anonymize_pii: anonymize_pii || false,
      pii_fields_masked: piiFieldsToMask,
      sample_config: sample_config || null,
      status: initialStatus,
      requires_approval: needsApproval,
      required_approvers: required_approvers || [],
      initiated_by: payload.userId
    });

    // If approval needed, create approval records for each approver role
    if (needsApproval && required_approvers) {
      for (const role of required_approvers) {
        await createDatabaseApproval({
          operation_id: operation.id,
          approver_role: role,
          approver_id: payload.userId, // Placeholder, will be updated when someone approves
          decision: 'pending'
        });
      }
    }

    // Fetch the created operation with approvals
    const result = await findDatabaseOperationById(operation.id);

    return NextResponse.json({
      operation: result || operation,
      message: needsApproval
        ? `Operation created. Waiting for approval from: ${required_approvers.join(', ')}`
        : 'Operation created and ready to execute'
    }, { status: 201 });
  } catch (error) {
    console.error('Create database operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
