/**
 * POST /api/requirements/[id]/generate-tickets - BA Agent: Generate tickets from requirement
 *
 * This endpoint:
 * 1. Reads the requirement (and any milestones)
 * 2. Uses AI to extract actionable tickets
 * 3. Creates tickets with AI-suggested fields
 * 4. Requires human approval before tickets are finalized
 *
 * Human-in-the-loop:
 * - Tickets created with status='backlog' (not 'todo')
 * - ai_generated=true flag for tracking
 * - All tickets need human review before moving to active cycle
 */

import { NextRequest, NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready
import { verifyToken } from '@/lib/auth';
import { assignTicket, recordAssignment } from '@/lib/services/assignment-service';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Domain {
  id: string;
  org_id: string;
  ticket_prefix: string | null;
  name: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  sequence_order: number;
}

interface ExistingTicket {
  id: string;
  title: string;
}

interface Requirement {
  id: string;
  domain_id: string;
  title: string;
  description: string | null;
  source_type: string;
  domain: Domain;
  milestones: Milestone[];
  tickets: ExistingTicket[];
}

interface Cycle {
  id: string;
  domain_id: string;
}

interface AIOperation {
  id: string;
  domain_id: string;
  operation_type: string;
  input_summary: string;
  model_used: string;
  status: string;
  triggered_by: string;
  started_at: Date;
}

interface Ticket {
  id: string;
  domain_id: string;
  cycle_id: string | null;
  source_requirement_id: string;
  source_milestone_id: string | null;
  ai_generated: boolean;
  ticket_number: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  ticket_type: string;
  status: string;
  priority: string;
  story_points: number;
  ai_confidence: number;
  ai_implementation_plan: string | null;
  reporter_id: string;
  assigned_to?: string | null;
}

// AI-generated ticket structure
interface AITicket {
  title: string;
  description: string;
  acceptance_criteria: string;
  ticket_type: 'epic' | 'story' | 'task' | 'bug';
  priority: 'critical' | 'high' | 'medium' | 'low';
  story_points: number;
  ai_confidence: number;
  ai_implementation_plan?: string;
  milestone_reference?: string; // Which milestone this relates to
}

// ============================================================================
// Stub Functions
// ============================================================================

async function stubFindUniqueRequirement(
  id: string
): Promise<Requirement | null> {
  console.log('[STUB] findUniqueRequirement called with id:', id);
  return null;
}

async function stubFindUniqueCycle(id: string): Promise<Cycle | null> {
  console.log('[STUB] findUniqueCycle called with id:', id);
  return null;
}

async function stubCreateAIOperation(
  data: Record<string, unknown>
): Promise<AIOperation> {
  console.log('[STUB] createAIOperation called with data:', data);
  return {
    id: 'stub-ai-operation-id',
    domain_id: data.domain_id as string,
    operation_type: data.operation_type as string,
    input_summary: data.input_summary as string,
    model_used: data.model_used as string,
    status: data.status as string,
    triggered_by: data.triggered_by as string,
    started_at: data.started_at as Date
  };
}

async function stubFindFirstTicket(
  domainId: string
): Promise<{ ticket_number: string } | null> {
  console.log('[STUB] findFirstTicket called with domainId:', domainId);
  return null;
}

async function stubCreateTicket(data: Record<string, unknown>): Promise<Ticket> {
  console.log('[STUB] createTicket called with data:', data);
  return {
    id: `stub-ticket-${Date.now()}`,
    domain_id: data.domain_id as string,
    cycle_id: data.cycle_id as string | null,
    source_requirement_id: data.source_requirement_id as string,
    source_milestone_id: data.source_milestone_id as string | null,
    ai_generated: data.ai_generated as boolean,
    ticket_number: data.ticket_number as string,
    title: data.title as string,
    description: data.description as string,
    acceptance_criteria: data.acceptance_criteria as string,
    ticket_type: data.ticket_type as string,
    status: data.status as string,
    priority: data.priority as string,
    story_points: data.story_points as number,
    ai_confidence: data.ai_confidence as number,
    ai_implementation_plan: data.ai_implementation_plan as string | null,
    reporter_id: data.reporter_id as string
  };
}

async function stubUpdateTicketAssignment(
  id: string,
  assignedTo: string | null
): Promise<void> {
  console.log('[STUB] updateTicketAssignment called with id:', id, 'assignedTo:', assignedTo);
}

async function stubUpdateAIOperationCompleted(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  console.log('[STUB] updateAIOperationCompleted called with id:', id, 'data:', data);
}

async function stubUpdateAIOperationFailed(
  id: string,
  errorMessage: string
): Promise<void> {
  console.log('[STUB] updateAIOperationFailed called with id:', id, 'error:', errorMessage);
}

// ============================================================================
// AI Ticket Generation (Simulated)
// ============================================================================

// Simulated AI ticket generation (replace with actual AI service call)
async function generateTicketsWithAI(
  title: string,
  description: string | null,
  sourceType: string,
  milestones: Array<{ title: string; description: string | null; id: string }>
): Promise<{
  tickets: AITicket[];
  summary: string;
}> {
  // In production, this would call Claude/GPT API with context
  // For now, return simulated responses based on content analysis

  const tickets: AITicket[] = [];
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const combined = titleLower + ' ' + descLower;

  // If we have milestones, generate tickets for each milestone
  if (milestones.length > 0) {
    for (const milestone of milestones) {
      const mTitle = milestone.title.toLowerCase();

      if (mTitle.includes('design') || mTitle.includes('architecture')) {
        tickets.push({
          title: `[Design] ${milestone.title}`,
          description: `Create design documentation for: ${milestone.description || milestone.title}`,
          acceptance_criteria: '- Design document approved by tech lead\n- All edge cases documented\n- Architecture diagram included',
          ticket_type: 'story',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.88,
          ai_implementation_plan: '1. Research existing patterns\n2. Draft design document\n3. Review with team\n4. Finalize and share',
          milestone_reference: milestone.id
        });
      } else if (mTitle.includes('implement') || mTitle.includes('develop') || mTitle.includes('build')) {
        tickets.push({
          title: `[Dev] ${milestone.title}`,
          description: `Implement functionality: ${milestone.description || milestone.title}`,
          acceptance_criteria: '- All unit tests pass\n- Code review completed\n- No critical SonarQube issues',
          ticket_type: 'story',
          priority: 'medium',
          story_points: 8,
          ai_confidence: 0.85,
          ai_implementation_plan: '1. Create feature branch\n2. Implement core functionality\n3. Write unit tests\n4. Submit PR for review',
          milestone_reference: milestone.id
        });
        // Add subtasks
        tickets.push({
          title: `[Task] Write unit tests for ${milestone.title}`,
          description: `Create comprehensive unit tests`,
          acceptance_criteria: '- 80%+ code coverage\n- Edge cases covered',
          ticket_type: 'task',
          priority: 'medium',
          story_points: 3,
          ai_confidence: 0.82,
          milestone_reference: milestone.id
        });
      } else if (mTitle.includes('test') || mTitle.includes('qa')) {
        tickets.push({
          title: `[QA] ${milestone.title}`,
          description: `Testing and quality assurance: ${milestone.description || milestone.title}`,
          acceptance_criteria: '- All test cases pass\n- No P1/P2 bugs open\n- Performance benchmarks met',
          ticket_type: 'task',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.87,
          milestone_reference: milestone.id
        });
      } else if (mTitle.includes('document') || mTitle.includes('documentation')) {
        tickets.push({
          title: `[Docs] ${milestone.title}`,
          description: `Create documentation: ${milestone.description || milestone.title}`,
          acceptance_criteria: '- README updated\n- API docs generated\n- User guide written',
          ticket_type: 'task',
          priority: 'low',
          story_points: 3,
          ai_confidence: 0.90,
          milestone_reference: milestone.id
        });
      } else {
        // Generic milestone → ticket
        tickets.push({
          title: milestone.title,
          description: milestone.description || `Complete: ${milestone.title}`,
          acceptance_criteria: '- Functionality complete\n- Tested and verified\n- Deployed to staging',
          ticket_type: 'story',
          priority: 'medium',
          story_points: 5,
          ai_confidence: 0.75,
          milestone_reference: milestone.id
        });
      }
    }
  } else {
    // No milestones - generate tickets directly from requirement
    if (combined.includes('authentication') || combined.includes('auth') || combined.includes('login')) {
      tickets.push(
        {
          title: 'Design authentication flow',
          description: 'Create flowcharts and wireframes for login/register process',
          acceptance_criteria: '- Flow diagrams approved\n- Security review passed\n- UX review completed',
          ticket_type: 'story',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.92,
          ai_implementation_plan: '1. Create user flow diagram\n2. Design wireframes\n3. Get stakeholder approval'
        },
        {
          title: 'Implement login API endpoint',
          description: 'Create POST /api/auth/login with JWT token generation',
          acceptance_criteria: '- Returns JWT on success\n- Returns 401 on invalid credentials\n- Rate limiting applied',
          ticket_type: 'task',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.90,
          ai_implementation_plan: '1. Create endpoint\n2. Implement password verification\n3. Generate JWT token\n4. Add rate limiting'
        },
        {
          title: 'Implement registration API endpoint',
          description: 'Create POST /api/auth/register with validation',
          acceptance_criteria: '- Email validation\n- Password strength check\n- Duplicate email detection',
          ticket_type: 'task',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.88
        },
        {
          title: 'Build login UI form',
          description: 'Create login form with email/password fields',
          acceptance_criteria: '- Form validation\n- Error handling\n- Loading states\n- Responsive design',
          ticket_type: 'task',
          priority: 'medium',
          story_points: 3,
          ai_confidence: 0.85
        }
      );
    } else if (combined.includes('api') || combined.includes('endpoint')) {
      tickets.push(
        {
          title: 'Define API specifications',
          description: 'Document all endpoints with OpenAPI/Swagger',
          acceptance_criteria: '- All endpoints documented\n- Request/response schemas defined\n- Examples provided',
          ticket_type: 'story',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.90
        },
        {
          title: 'Implement CRUD endpoints',
          description: 'Create, Read, Update, Delete operations',
          acceptance_criteria: '- All CRUD operations work\n- Proper error codes\n- Pagination for list endpoints',
          ticket_type: 'story',
          priority: 'high',
          story_points: 8,
          ai_confidence: 0.87
        },
        {
          title: 'Add API validation middleware',
          description: 'Request validation and sanitization',
          acceptance_criteria: '- Input validation\n- SQL injection prevention\n- XSS prevention',
          ticket_type: 'task',
          priority: 'high',
          story_points: 3,
          ai_confidence: 0.85
        }
      );
    } else {
      // Generic requirement → tickets
      tickets.push(
        {
          title: `[Epic] ${title}`,
          description: description || `Implement: ${title}`,
          acceptance_criteria: '- All user stories completed\n- Acceptance testing passed\n- Deployed to production',
          ticket_type: 'epic',
          priority: 'medium',
          story_points: 13,
          ai_confidence: 0.80,
          ai_implementation_plan: '1. Break down into stories\n2. Prioritize backlog\n3. Execute in cycles\n4. Review and iterate'
        },
        {
          title: `[Story] Requirements analysis for ${title}`,
          description: 'Detailed analysis and documentation of requirements',
          acceptance_criteria: '- Requirements documented\n- Edge cases identified\n- Stakeholder sign-off',
          ticket_type: 'story',
          priority: 'high',
          story_points: 3,
          ai_confidence: 0.85
        },
        {
          title: `[Story] Technical design for ${title}`,
          description: 'Create technical design and architecture',
          acceptance_criteria: '- Design document complete\n- Tech lead approved\n- Dependencies identified',
          ticket_type: 'story',
          priority: 'high',
          story_points: 5,
          ai_confidence: 0.82
        },
        {
          title: `[Story] Implementation of ${title}`,
          description: 'Core implementation work',
          acceptance_criteria: '- Code complete\n- Tests written\n- Code review passed',
          ticket_type: 'story',
          priority: 'medium',
          story_points: 8,
          ai_confidence: 0.78
        }
      );
    }
  }

  return {
    tickets,
    summary: `BA Agent analyzed requirement "${title}" and generated ${tickets.length} tickets. ${milestones.length > 0 ? `Based on ${milestones.length} milestones.` : 'No milestones found.'} Human review required before moving to active cycle.`
  };
}

// ============================================================================
// API Handler
// ============================================================================

// POST: Generate tickets from requirement
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

    // Parse request body for optional cycle_id
    let cycleId: string | null = null;
    try {
      const body = await request.json();
      cycleId = body.cycle_id || null;
    } catch {
      // No body is fine - tickets will go to backlog without cycle
    }

    // Fetch requirement with milestones
    const requirement = await stubFindUniqueRequirement(id);

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (requirement.domain.org_id !== payload.orgId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Check if tickets already generated
    if (requirement.tickets.length > 0) {
      return NextResponse.json(
        {
          error: 'Tickets already generated for this requirement',
          existing_tickets: requirement.tickets.length,
          message: 'Delete existing tickets to regenerate'
        },
        { status: 400 }
      );
    }

    // If cycle_id provided, verify it exists
    if (cycleId) {
      const cycle = await stubFindUniqueCycle(cycleId);
      if (!cycle || cycle.domain_id !== requirement.domain_id) {
        return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
      }
    }

    // Track AI operation
    const aiOperation = await stubCreateAIOperation({
      domain_id: requirement.domain_id,
      operation_type: 'generate_tickets',
      input_summary: `BA Agent: Generating tickets from requirement "${requirement.title}"`,
      model_used: 'quad-ba-agent-v1', // Will be replaced with actual model
      status: 'processing',
      triggered_by: payload.userId,
      started_at: new Date()
    });

    try {
      // Generate tickets with AI
      const analysis = await generateTicketsWithAI(
        requirement.title,
        requirement.description,
        requirement.source_type,
        requirement.milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description
        }))
      );

      // Get last ticket number for this domain
      const ticketPrefix = requirement.domain.ticket_prefix || 'TICKET';
      const lastTicket = await stubFindFirstTicket(requirement.domain_id);

      let ticketNum = 1;
      if (lastTicket?.ticket_number) {
        const match = lastTicket.ticket_number.match(/-(\d+)$/);
        if (match) {
          ticketNum = parseInt(match[1]) + 1;
        }
      }

      // Create tickets with intelligent assignment
      const createdTickets: Ticket[] = [];
      const assignmentResults: Array<{ ticketId: string; assignedTo: string | null; assignedName: string; reason: string }> = [];

      for (const t of analysis.tickets) {
        const ticketNumber = `${ticketPrefix}-${ticketNum}`;
        ticketNum++;

        // Find milestone ID if referenced
        let milestoneId: string | null = null;
        if (t.milestone_reference) {
          const milestone = requirement.milestones.find(m => m.id === t.milestone_reference);
          if (milestone) {
            milestoneId = milestone.id;
          }
        }

        const ticket = await stubCreateTicket({
          domain_id: requirement.domain_id,
          cycle_id: cycleId,
          source_requirement_id: requirement.id,
          source_milestone_id: milestoneId,
          ai_generated: true,
          ticket_number: ticketNumber,
          title: t.title,
          description: t.description,
          acceptance_criteria: t.acceptance_criteria,
          ticket_type: t.ticket_type,
          status: 'backlog', // Always start in backlog for human review
          priority: t.priority,
          story_points: t.story_points,
          ai_confidence: t.ai_confidence,
          ai_implementation_plan: t.ai_implementation_plan || null,
          reporter_id: payload.userId
        });

        // Intelligent assignment for each ticket
        try {
          const assignment = await assignTicket(ticket.id, requirement.domain_id, payload.orgId);
          await stubUpdateTicketAssignment(ticket.id, assignment.assigned_to);
          await recordAssignment(ticket.id, assignment);
          (ticket as unknown as Record<string, unknown>).assigned_to = assignment.assigned_to;
          assignmentResults.push({
            ticketId: ticket.id,
            assignedTo: assignment.assigned_to,
            assignedName: assignment.assigned_name,
            reason: assignment.reason
          });
        } catch {
          // No developers available - ticket remains unassigned
          assignmentResults.push({
            ticketId: ticket.id,
            assignedTo: null,
            assignedName: 'Unassigned',
            reason: 'No developers available for auto-assignment'
          });
        }

        createdTickets.push(ticket);
      }

      // Update AI operation as completed
      await stubUpdateAIOperationCompleted(aiOperation.id, {
        status: 'completed',
        output_summary: analysis.summary,
        confidence: Math.min(...analysis.tickets.map(t => t.ai_confidence)),
        completed_at: new Date()
      });

      // Count how many were auto-assigned
      const assignedCount = assignmentResults.filter(a => a.assignedTo !== null).length;

      return NextResponse.json({
        message: 'BA Agent generated tickets successfully. Human review required.',
        requirement_id: requirement.id,
        requirement_title: requirement.title,
        tickets_generated: createdTickets.length,
        tickets_auto_assigned: assignedCount,
        tickets: createdTickets.map(t => {
          const assignment = assignmentResults.find(a => a.ticketId === t.id);
          return {
            id: t.id,
            ticket_number: t.ticket_number,
            title: t.title,
            ticket_type: t.ticket_type,
            priority: t.priority,
            story_points: t.story_points,
            ai_confidence: Number(t.ai_confidence),
            status: t.status,
            assigned_to: assignment?.assignedTo || null,
            assigned_name: assignment?.assignedName || 'Unassigned',
            assignment_reason: assignment?.reason || null
          };
        }),
        ai_summary: analysis.summary,
        human_review_required: true,
        next_steps: [
          'Review generated tickets in backlog',
          'Verify auto-assignments are appropriate',
          'Adjust titles, descriptions, and estimates as needed',
          'Move approved tickets to active cycle'
        ]
      });

    } catch (analysisError) {
      // Update AI operation as failed
      await stubUpdateAIOperationFailed(
        aiOperation.id,
        analysisError instanceof Error ? analysisError.message : 'Unknown error'
      );

      throw analysisError;
    }

  } catch (error) {
    console.error('Generate tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
