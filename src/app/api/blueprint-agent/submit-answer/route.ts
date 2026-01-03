/**
 * POST /api/blueprint-agent/submit-answer
 * Submit answer to Blueprint Agent conversational interview
 *
 * Flow:
 * 1. User submits answer to current question
 * 2. API stores answer in conversation history
 * 3. Generates next contextual question based on answers so far
 * 4. Returns next question OR completion status
 * 5. On completion, triggers QUAD blueprint generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

interface SubmitAnswerRequest {
  sessionId: string;
  answer: string;
}

/**
 * POST: Submit answer to current question
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

    const body: SubmitAnswerRequest = await request.json();
    const { sessionId, answer } = body;

    // Validation
    if (!sessionId || !answer) {
      return NextResponse.json(
        { error: 'Session ID and answer are required' },
        { status: 400 }
      );
    }

    // Get interview session resource
    const sessionResult = await query(
      `SELECT dr.*, dm.user_id
       FROM quad_domain_resources dr
       JOIN quad_domain_members dm ON dm.domain_id = dr.domain_id
       JOIN quad_users u ON u.id = dm.user_id
       WHERE dr.resource_name LIKE $1 AND dr.resource_type = 'blueprint_agent_session'
         AND u.email = $2
       LIMIT 1`,
      [`%${sessionId.substring(0, 8)}%`, session.user.email]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    const sessionResource = sessionResult.rows[0] as { id: string };

    // For now, we'll store the conversation in a simple structure
    // TODO: Move to dedicated table with proper conversation tracking
    // Simulate conversation history (in production, retrieve from database)
    const questionsAsked = parseInt(sessionId.split('-')[4]?.substring(0, 1) || '1', 10);

    // Generate next question based on conversation context
    const nextQuestion = generateNextQuestion(questionsAsked, answer);

    // Check if interview is complete (typically 5-7 questions)
    const isComplete = shouldCompleteInterview(questionsAsked, answer);

    if (isComplete) {
      // Update resource status to completed
      await query(
        `UPDATE quad_domain_resources
         SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [sessionResource.id]
      );

      return NextResponse.json({
        success: true,
        session: {
          sessionId,
          currentQuestion: null,
          isComplete: true,
          blueprint: null, // TODO: Generate actual blueprint
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        currentQuestion: nextQuestion,
        isComplete: false,
        blueprint: null,
      },
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate next question based on conversation
// TODO: Replace with AI-powered question generation
function generateNextQuestion(questionNumber: number, previousAnswer: string): string {
  const questions = [
    // Question 2: Technical Stack
    "**Question 2: Technical Stack & Platform**\n\nWhat technology stack are you considering, or would you like recommendations? Please mention:\n- Platform (Web, iOS, Android, Desktop)\n- Programming language preferences (if any)\n- Any specific frameworks or libraries you want to use\n- Hosting preferences (cloud, on-premise, hybrid)\n\nIf you're unsure, just say 'recommend' and I'll suggest based on your project.",

    // Question 3: Key Features
    "**Question 3: Core Features**\n\nWhat are the must-have features for your MVP (Minimum Viable Product)? Please list:\n- The top 3-5 features users absolutely need\n- Any nice-to-have features for future versions\n- Features that differentiate you from alternatives\n\nBe specific about functionality, not just names.",

    // Question 4: Data & Integration
    "**Question 4: Data & Integrations**\n\nWhat data will your application handle, and any external integrations needed?\n- What data needs to be stored (user profiles, transactions, content, etc.)\n- Any third-party services to integrate (payment, maps, analytics, etc.)\n- Data privacy or compliance requirements (GDPR, HIPAA, etc.)\n\nThis helps me design the architecture and database schema.",

    // Question 5: User Experience
    "**Question 5: User Experience & Design**\n\nDescribe your vision for the user experience:\n- Design style (modern/minimal, colorful, professional, etc.)\n- Key user flows (how users accomplish their main goals)\n- Mobile-first or desktop-first?\n- Accessibility requirements?\n\nShare any design inspirations or similar apps you admire.",

    // Question 6: Scale & Performance
    "**Question 6: Scale & Performance**\n\nWhat are your expectations for scale and performance?\n- Expected number of users (initially and after 1 year)\n- Performance requirements (page load times, response times)\n- Any real-time features (chat, notifications, live updates)?\n- Budget constraints for hosting/infrastructure?\n\nThis determines architecture decisions.",
  ];

  const index = Math.min(questionNumber, questions.length - 1);
  return questions[index];
}

// Helper function to determine if interview should be completed
// TODO: Use AI to determine when enough information is gathered
function shouldCompleteInterview(questionNumber: number, lastAnswer: string): boolean {
  // For now, complete after 6 questions (initial description + 5 follow-ups)
  // In production, AI should analyze if enough information is gathered
  return questionNumber >= 5;
}

