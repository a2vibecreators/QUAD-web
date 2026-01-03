/**
 * POST /api/requirements/[id]/analyze - Trigger AI analysis of requirement
 *
 * This endpoint:
 * 1. Reads the requirement document
 * 2. Uses AI to extract milestones
 * 3. Creates milestones with confidence scores
 * 4. Requires human approval before milestones are finalized
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Simulated AI analysis (replace with actual AI service call)
async function analyzeRequirementWithAI(
  title: string,
  description: string | null,
  sourceType: string
): Promise<{
  milestones: Array<{
    title: string;
    description: string;
    sequence_order: number;
    ai_confidence: number;
  }>;
  summary: string;
}> {
  // In production, this would call Claude/GPT API
  // For now, return a simulated response based on title keywords

  const milestones = [];
  const baseConfidence = 0.85;

  // Simulate milestone extraction
  if (title.toLowerCase().includes('authentication') || title.toLowerCase().includes('auth')) {
    milestones.push(
      { title: 'Design authentication flow', description: 'Create flowcharts and wireframes for login/register', sequence_order: 1, ai_confidence: 0.92 },
      { title: 'Implement backend auth endpoints', description: 'Create login, register, logout, refresh token APIs', sequence_order: 2, ai_confidence: 0.88 },
      { title: 'Build frontend auth forms', description: 'Create login and registration UI components', sequence_order: 3, ai_confidence: 0.85 },
      { title: 'Add session management', description: 'Implement JWT tokens and session handling', sequence_order: 4, ai_confidence: 0.82 }
    );
  } else if (title.toLowerCase().includes('api') || title.toLowerCase().includes('endpoint')) {
    milestones.push(
      { title: 'Define API specifications', description: 'Document all endpoints with request/response schemas', sequence_order: 1, ai_confidence: 0.90 },
      { title: 'Implement core CRUD operations', description: 'Create, Read, Update, Delete endpoints', sequence_order: 2, ai_confidence: 0.87 },
      { title: 'Add validation and error handling', description: 'Input validation and standardized error responses', sequence_order: 3, ai_confidence: 0.85 },
      { title: 'Write API tests', description: 'Unit and integration tests for all endpoints', sequence_order: 4, ai_confidence: 0.83 }
    );
  } else if (title.toLowerCase().includes('deploy') || title.toLowerCase().includes('release')) {
    milestones.push(
      { title: 'Prepare deployment environment', description: 'Set up staging and production environments', sequence_order: 1, ai_confidence: 0.88 },
      { title: 'Create deployment scripts', description: 'Automate build and deployment process', sequence_order: 2, ai_confidence: 0.85 },
      { title: 'Configure monitoring', description: 'Set up logging, alerts, and health checks', sequence_order: 3, ai_confidence: 0.82 },
      { title: 'Document release process', description: 'Create runbooks and rollback procedures', sequence_order: 4, ai_confidence: 0.80 }
    );
  } else {
    // Generic milestones
    milestones.push(
      { title: 'Requirements Analysis', description: `Analyze and document requirements for: ${title}`, sequence_order: 1, ai_confidence: baseConfidence },
      { title: 'Technical Design', description: 'Create technical design document with architecture decisions', sequence_order: 2, ai_confidence: baseConfidence - 0.05 },
      { title: 'Implementation', description: 'Develop the core functionality', sequence_order: 3, ai_confidence: baseConfidence - 0.08 },
      { title: 'Testing & QA', description: 'Comprehensive testing and quality assurance', sequence_order: 4, ai_confidence: baseConfidence - 0.10 },
      { title: 'Documentation', description: 'Create user and technical documentation', sequence_order: 5, ai_confidence: baseConfidence - 0.12 }
    );
  }

  return {
    milestones,
    summary: `AI analyzed requirement "${title}" and extracted ${milestones.length} milestones. Source type: ${sourceType}. Human review recommended before approval.`
  };
}

// POST: Trigger AI analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch requirement
    const requirement = await prisma.qUAD_requirements.findUnique({
      where: { id },
      include: {
        domain: { select: { org_id: true } },
        milestones: true
      }
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (requirement.domain.org_id !== payload.companyId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Check if already processed
    if (requirement.ai_processed && requirement.milestones.length > 0) {
      return NextResponse.json(
        {
          error: 'Requirement already analyzed. Delete existing milestones to re-analyze.',
          milestones: requirement.milestones
        },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.qUAD_requirements.update({
      where: { id },
      data: { status: 'processing' }
    });

    // Track AI operation
    const aiOperation = await prisma.qUAD_ai_operations.create({
      data: {
        domain_id: requirement.domain_id,
        operation_type: 'analyze_requirement',
        input_summary: `Analyzing requirement: ${requirement.title}`,
        model_used: 'quad-requirement-analyzer-v1', // Will be replaced with actual model
        status: 'processing',
        triggered_by: payload.userId,
        started_at: new Date()
      }
    });

    try {
      // Run AI analysis
      const analysis = await analyzeRequirementWithAI(
        requirement.title,
        requirement.description,
        requirement.source_type
      );

      // Create milestones
      const createdMilestones = await Promise.all(
        analysis.milestones.map(m =>
          prisma.qUAD_milestones.create({
            data: {
              requirement_id: requirement.id,
              domain_id: requirement.domain_id,
              title: m.title,
              description: m.description,
              sequence_order: m.sequence_order,
              ai_confidence: m.ai_confidence,
              status: 'pending'
            }
          })
        )
      );

      // Update requirement as processed
      const updatedRequirement = await prisma.qUAD_requirements.update({
        where: { id },
        data: {
          ai_processed: true,
          ai_processed_at: new Date(),
          status: 'draft' // Back to draft for human review
        },
        include: {
          milestones: {
            orderBy: { sequence_order: 'asc' }
          }
        }
      });

      // Update AI operation as completed
      await prisma.qUAD_ai_operations.update({
        where: { id: aiOperation.id },
        data: {
          status: 'completed',
          output_summary: analysis.summary,
          confidence: Math.min(...analysis.milestones.map(m => m.ai_confidence)),
          completed_at: new Date()
        }
      });

      return NextResponse.json({
        message: 'AI analysis complete. Please review milestones before approval.',
        requirement: updatedRequirement,
        milestones: createdMilestones,
        ai_summary: analysis.summary,
        requires_human_review: true
      });

    } catch (analysisError) {
      // Update AI operation as failed
      await prisma.qUAD_ai_operations.update({
        where: { id: aiOperation.id },
        data: {
          status: 'failed',
          error_message: analysisError instanceof Error ? analysisError.message : 'Unknown error',
          completed_at: new Date()
        }
      });

      // Revert requirement status
      await prisma.qUAD_requirements.update({
        where: { id },
        data: { status: 'draft' }
      });

      throw analysisError;
    }

  } catch (error) {
    console.error('Analyze requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
