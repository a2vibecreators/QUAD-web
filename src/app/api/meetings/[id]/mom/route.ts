/**
 * Meeting Minutes (MOM) Review API - BA workflow for confirming action items
 *
 * GET /api/meetings/[id]/mom - Get meeting with action items and uncertainty flags
 * PATCH /api/meetings/[id]/mom - BA confirms/edits action items
 * POST /api/meetings/[id]/mom/propose-followups - AI proposes follow-up tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready
import { assignTicket } from '@/lib/services/assignment-service';

// TODO: All database operations in this file need to be implemented via Java backend

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface ActionItem {
  id: string;
  meeting_id: string;
  description: string;
  original_text: string | null;
  speaker_name: string | null;
  item_type: string;
  is_uncertain: boolean;
  uncertainty_reason: string | null;
  ba_reviewed: boolean;
  ba_confirmed: boolean;
  ba_edited_text: string | null;
  status: string;
  assigned_to: string | null;
  due_date: Date | null;
  ai_confidence: number | null;
}

interface FollowUp {
  id: string;
  meeting_id: string;
  action_item_id: string | null;
  proposed_title: string;
  proposed_description: string | null;
  proposed_type: string;
  proposed_priority: string;
  proposed_story_points: number | null;
  proposed_assignee_id: string | null;
  assignment_reason: string | null;
  alternative_assignees: { user_id: string; user_name: string; score: number }[] | null;
  status: string;
  ai_confidence: number | null;
}

interface Domain {
  id: string;
  name: string;
  org_id: string;
}

interface Meeting {
  id: string;
  domain_id: string;
  title: string;
  meeting_type: string;
  scheduled_at: Date | null;
  status: string;
  mom_status: string;
  mom_confirmed_by: string | null;
  mom_confirmed_at: Date | null;
  mom_has_uncertain_items: boolean;
  mom_notes: string | null;
  followups_proposed: boolean;
  ai_summary: string | null;
  transcript_text: string | null;
  domain: Domain;
  action_items: ActionItem[];
  follow_ups: FollowUp[];
}

interface Ticket {
  id: string;
  domain_id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  ticket_type: string;
  status: string;
  priority: string;
  reporter_id: string;
}

// ============================================================================
// Stub Functions - Replace with Java backend calls
// ============================================================================

async function getMeetingWithDetails(meetingId: string): Promise<Meeting | null> {
  console.log(`[MOM] getMeetingWithDetails stub called: ${meetingId}`);
  return null;
}

async function updateManyActionItems(
  meetingId: string,
  data: Partial<ActionItem>
): Promise<void> {
  console.log(`[MOM] updateManyActionItems stub called: ${meetingId}`, data);
}

async function updateMeeting(
  meetingId: string,
  data: Partial<Meeting>
): Promise<void> {
  console.log(`[MOM] updateMeeting stub called: ${meetingId}`, data);
}

async function updateActionItem(
  itemId: string,
  data: Partial<ActionItem>
): Promise<void> {
  console.log(`[MOM] updateActionItem stub called: ${itemId}`, data);
}

async function countUnreviewedActionItems(meetingId: string): Promise<number> {
  console.log(`[MOM] countUnreviewedActionItems stub called: ${meetingId}`);
  return 0;
}

async function getMeetingForFollowUps(meetingId: string): Promise<(Meeting & { action_items: ActionItem[] }) | null> {
  console.log(`[MOM] getMeetingForFollowUps stub called: ${meetingId}`);
  return null;
}

async function createTicket(data: Omit<Ticket, 'id'>): Promise<Ticket> {
  console.log(`[MOM] createTicket stub called:`, data);
  return {
    id: 'mock-ticket-id',
    ...data,
  };
}

async function deleteTicket(ticketId: string): Promise<void> {
  console.log(`[MOM] deleteTicket stub called: ${ticketId}`);
}

async function createFollowUp(data: Omit<FollowUp, 'id'>): Promise<FollowUp> {
  console.log(`[MOM] createFollowUp stub called:`, data);
  return {
    id: 'mock-followup-id',
    ...data,
  };
}

// ============================================================================
// API Routes
// ============================================================================

// GET - Get meeting with action items for BA review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await getMeetingWithDetails(id);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Count uncertain items
    const uncertainItems = meeting.action_items.filter(a => a.is_uncertain);
    const unreviewedItems = meeting.action_items.filter(a => !a.ba_reviewed);

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meeting_type: meeting.meeting_type,
        scheduled_at: meeting.scheduled_at,
        status: meeting.status,
        mom_status: meeting.mom_status,
        mom_confirmed_by: meeting.mom_confirmed_by,
        mom_confirmed_at: meeting.mom_confirmed_at,
        mom_has_uncertain_items: meeting.mom_has_uncertain_items,
        ai_summary: meeting.ai_summary,
        transcript_text: meeting.transcript_text ? '(available)' : null,
      },
      action_items: meeting.action_items.map(a => ({
        id: a.id,
        description: a.description,
        original_text: a.original_text,
        speaker_name: a.speaker_name,
        item_type: a.item_type,
        is_uncertain: a.is_uncertain,
        uncertainty_reason: a.uncertainty_reason,
        ba_reviewed: a.ba_reviewed,
        ba_confirmed: a.ba_confirmed,
        ba_edited_text: a.ba_edited_text,
        status: a.status,
        assigned_to: a.assigned_to,
        due_date: a.due_date,
        ai_confidence: a.ai_confidence,
      })),
      follow_ups: meeting.follow_ups,
      review_summary: {
        total_items: meeting.action_items.length,
        uncertain_items: uncertainItems.length,
        unreviewed_items: unreviewedItems.length,
        mom_status: meeting.mom_status,
        needs_review: unreviewedItems.length > 0 || meeting.mom_status === 'needs_review',
      },
    });
  } catch (error) {
    console.error('[MOM API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

// PATCH - BA confirms/edits action items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action_items, confirm_all, mom_notes } = body;

    // If confirm_all, mark all items as reviewed and confirmed
    if (confirm_all) {
      await updateManyActionItems(id, {
        ba_reviewed: true,
        ba_confirmed: true,
      });

      await updateMeeting(id, {
        mom_status: 'confirmed',
        mom_confirmed_by: session.user.id,
        mom_confirmed_at: new Date(),
        mom_notes: mom_notes || null,
      });

      return NextResponse.json({
        success: true,
        message: 'All action items confirmed',
        mom_status: 'confirmed',
      });
    }

    // Individual item updates
    if (!Array.isArray(action_items)) {
      return NextResponse.json({ error: 'action_items array required' }, { status: 400 });
    }

    const results: Array<{ item_id: any; action: string }> = [];
    for (const item of action_items) {
      const { item_id, confirm, reject, edited_text } = item;

      if (!item_id) continue;

      const updateData: Partial<ActionItem> = {
        ba_reviewed: true,
      };

      if (confirm) {
        updateData.ba_confirmed = true;
      } else if (reject) {
        updateData.ba_confirmed = false;
      }

      if (edited_text) {
        updateData.ba_edited_text = edited_text;
        updateData.description = edited_text; // Update main description too
      }

      await updateActionItem(item_id, updateData);

      results.push({ item_id, action: confirm ? 'confirmed' : reject ? 'rejected' : 'reviewed' });
    }

    // Check if all items are now reviewed
    const unreviewedCount = await countUnreviewedActionItems(id);

    // Update meeting status
    const newMomStatus = unreviewedCount === 0 ? 'confirmed' : 'needs_review';
    await updateMeeting(id, {
      mom_status: newMomStatus,
      mom_confirmed_by: unreviewedCount === 0 ? session.user.id : null,
      mom_confirmed_at: unreviewedCount === 0 ? new Date() : null,
      mom_notes: mom_notes || null,
    });

    return NextResponse.json({
      success: true,
      results,
      unreviewed_remaining: unreviewedCount,
      mom_status: newMomStatus,
    });
  } catch (error) {
    console.error('[MOM API] Error:', error);
    return NextResponse.json({ error: 'Failed to update action items' }, { status: 500 });
  }
}

// POST - Propose follow-up tickets from action items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await getMeetingForFollowUps(id);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Filter for confirmed pending action items
    const confirmedPendingItems = meeting.action_items.filter(
      a => a.ba_confirmed === true && a.status === 'pending'
    );

    if (confirmedPendingItems.length === 0) {
      return NextResponse.json({
        error: 'No confirmed pending action items to propose tickets for',
      }, { status: 400 });
    }

    const proposedFollowups: Array<{
      id: string;
      title: string;
      type: string;
      suggested_assignee: string;
      assignment_reason: string;
      alternatives: string[];
    }> = [];

    for (const actionItem of confirmedPendingItems) {
      // Determine ticket type from item type
      const typeMap: Record<string, string> = {
        'action': 'task',
        'decision': 'story',
        'question': 'spike',
        'risk': 'bug',
        'note': 'task',
      };

      // Create a temporary ticket-like object for assignment scoring
      // (we'll create the actual ticket later if approved)
      const proposedTitle = actionItem.description.length > 100
        ? actionItem.description.substring(0, 97) + '...'
        : actionItem.description;

      // Try to get assignment suggestion
      let assignmentSuggestion: { user_id: string; user_name: string; score: number; reason: string } | null = null;
      let alternativeAssignees: { user_id: string; user_name: string; score: number }[] | null = null;

      try {
        // Create a temp ticket to analyze for assignment (we won't save it)
        const tempTicket = await createTicket({
          domain_id: meeting.domain_id,
          ticket_number: 'TEMP-' + Date.now(),
          title: proposedTitle,
          description: actionItem.description,
          ticket_type: typeMap[actionItem.item_type] || 'task',
          status: 'backlog',
          priority: 'medium',
          reporter_id: session.user.id,
        });

        try {
          const assignResult = await assignTicket(tempTicket.id, meeting.domain_id, meeting.domain.org_id);
          assignmentSuggestion = {
            user_id: assignResult.assigned_to,
            user_name: assignResult.assigned_name,
            score: assignResult.score,
            reason: assignResult.reason,
          };
          alternativeAssignees = assignResult.candidates.slice(1, 4).map(c => ({
            user_id: c.user_id,
            user_name: c.user_name,
            score: c.total_score,
          }));
        } catch {
          // Assignment failed - no developers available
        }

        // Delete the temp ticket
        await deleteTicket(tempTicket.id);
      } catch {
        // Couldn't create temp ticket
      }

      // Create follow-up proposal
      const followUp = await createFollowUp({
        meeting_id: id,
        action_item_id: actionItem.id,
        proposed_title: proposedTitle,
        proposed_description: actionItem.description,
        proposed_type: typeMap[actionItem.item_type] || 'task',
        proposed_priority: 'medium',
        proposed_story_points: 3,
        proposed_assignee_id: assignmentSuggestion?.user_id || null,
        assignment_reason: assignmentSuggestion?.reason || null,
        alternative_assignees: alternativeAssignees || null,
        status: 'proposed',
        ai_confidence: Number(actionItem.ai_confidence) || 0.8,
      });

      proposedFollowups.push({
        id: followUp.id,
        title: followUp.proposed_title,
        type: followUp.proposed_type,
        suggested_assignee: assignmentSuggestion?.user_name || 'Unassigned',
        assignment_reason: assignmentSuggestion?.reason || 'No developers available',
        alternatives: alternativeAssignees?.map((a) => a.user_name) || [],
      });
    }

    // Update meeting to indicate follow-ups proposed
    await updateMeeting(id, { followups_proposed: true });

    return NextResponse.json({
      success: true,
      message: `Proposed ${proposedFollowups.length} follow-up tickets`,
      follow_ups: proposedFollowups,
      next_steps: [
        'Review proposed tickets in the meeting follow-ups',
        'Approve or reject each proposal',
        'Approved tickets will be created in backlog',
      ],
    });
  } catch (error) {
    console.error('[MOM API] Error:', error);
    return NextResponse.json({ error: 'Failed to propose follow-ups' }, { status: 500 });
  }
}
