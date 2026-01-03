/**
 * POST /api/blueprint-agent/start-interview
 * Start conversational Blueprint Agent interview
 *
 * User provides initial project description, then agent asks dynamic questions
 * based on the project context and previous answers to build a QUAD blueprint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

interface StartInterviewRequest {
  domainId: string; // Domain for this project
  projectDescription: string; // User's initial project description
}

interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

/**
 * POST: Start new Blueprint Agent conversational interview
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResult = await query(
      'SELECT id FROM quad_users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0] as { id: string };

    const body: StartInterviewRequest = await request.json();
    const { domainId, projectDescription } = body;

    // Validation
    if (!domainId || !projectDescription) {
      return NextResponse.json(
        { error: 'Domain ID and project description are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this domain
    const domainAccessResult = await query(
      `SELECT dm.domain_id, dm.role
       FROM quad_domain_members dm
       WHERE dm.user_id = $1 AND dm.domain_id = $2`,
      [user.id, domainId]
    );

    if (domainAccessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this domain' },
        { status: 403 }
      );
    }

    // Generate session ID
    const sessionId = randomUUID();

    // Create interview data structure
    const interviewData: {
      projectDescription: string;
      conversation: ConversationMessage[];
      currentQuestionIndex: number;
      questionsAsked: string[];
      answersGiven: string[];
    } = {
      projectDescription,
      conversation: [
        {
          role: 'user',
          content: projectDescription,
          timestamp: new Date().toISOString(),
        },
      ],
      currentQuestionIndex: 0,
      questionsAsked: [],
      answersGiven: [],
    };

    // Store interview session
    // Note: Using quad_domains table's jsonb columns for now
    // TODO: Create dedicated quad_blueprint_agent_sessions table if needed
    await query(
      `INSERT INTO quad_domain_resources (
        domain_id,
        resource_name,
        resource_type,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id`,
      [
        domainId,
        `Blueprint Agent Session ${sessionId.substring(0, 8)}`,
        'blueprint_agent_session',
        'in_progress',
        user.id,
      ]
    );

    // Generate first question based on project description
    const firstQuestion = generateFirstQuestion(projectDescription);

    // Update interview data with first question
    interviewData.questionsAsked.push(firstQuestion);
    interviewData.conversation.push({
      role: 'agent',
      content: firstQuestion,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        currentQuestion: firstQuestion,
        isComplete: false,
        blueprint: null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Blueprint Agent start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate first question based on project description
// TODO: Replace with AI-powered question generation using Gemini or Claude
function generateFirstQuestion(projectDescription: string): string {
  const desc = projectDescription.toLowerCase();

  // Check for specific project types
  if (desc.includes('calculator') || desc.includes('arithmetic')) {
    return "Great! I understand you want to build a calculator app. Let me ask a few questions to build your QUAD blueprint.\n\n**Question 1: Target Users & Use Cases**\n\nWho will be using this calculator, and what are their primary use cases? For example:\n- Students for homework and exams\n- Professionals for business calculations\n- General users for everyday math\n- Specific use case (e.g., mortgage calculator, tip calculator)\n\nPlease describe your target users and their main needs.";
  } else if (desc.includes('web') || desc.includes('website') || desc.includes('app')) {
    return "Thanks for sharing your project idea! To build a comprehensive QUAD blueprint, I need to understand more about your vision.\n\n**Question 1: Target Audience**\n\nWho are the primary users of this application? Please describe:\n- Their demographics (age, profession, technical skill level)\n- Their main pain points or needs\n- How they would typically discover and use this app\n\nThis will help me understand the user experience requirements.";
  } else {
    return "Thank you for describing your project! To create a detailed QUAD blueprint, I'll need to ask you some questions.\n\n**Question 1: Project Goals & Success Criteria**\n\nWhat are the main goals you want to achieve with this project? Please describe:\n- The primary problem you're solving\n- Who benefits from this solution\n- How you'll measure success\n\nThis will help me understand the scope and objectives.";
  }
}

