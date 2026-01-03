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
import { prisma } from '@/lib/prisma';
import { assignTicket } from '@/lib/services/assignment-service';

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

    const meeting = await prisma.qUAD_meetings.findUnique({
      where: { id },
      include: {
        domain: {
          select: { id: true, name: true, org_id: true },
        },
        action_items: {
          orderBy: { created_at: 'asc' },
        },
        follow_ups: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

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
      await prisma.qUAD_meeting_action_items.updateMany({
        where: { meeting_id: id },
        data: {
          ba_reviewed: true,
          ba_confirmed: true,
        },
      });

      await prisma.qUAD_meetings.update({
        where: { id },
        data: {
          mom_status: 'confirmed',
          mom_confirmed_by: session.user.id,
          mom_confirmed_at: new Date(),
          mom_notes: mom_notes || null,
        },
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

    const results = [];
    for (const item of action_items) {
      const { item_id, confirm, reject, edited_text } = item;

      if (!item_id) continue;

      const updateData: Record<string, unknown> = {
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

      await prisma.qUAD_meeting_action_items.update({
        where: { id: item_id },
        data: updateData,
      });

      results.push({ item_id, action: confirm ? 'confirmed' : reject ? 'rejected' : 'reviewed' });
    }

    // Check if all items are now reviewed
    const unreviewedCount = await prisma.qUAD_meeting_action_items.count({
      where: { meeting_id: id, ba_reviewed: false },
    });

    // Update meeting status
    const newMomStatus = unreviewedCount === 0 ? 'confirmed' : 'needs_review';
    await prisma.qUAD_meetings.update({
      where: { id },
      data: {
        mom_status: newMomStatus,
        mom_confirmed_by: unreviewedCount === 0 ? session.user.id : null,
        mom_confirmed_at: unreviewedCount === 0 ? new Date() : null,
        mom_notes: mom_notes || null,
      },
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

    const meeting = await prisma.qUAD_meetings.findUnique({
      where: { id },
      include: {
        domain: { select: { id: true, org_id: true } },
        action_items: {
          where: { ba_confirmed: true, status: 'pending' },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.action_items.length === 0) {
      return NextResponse.json({
        error: 'No confirmed pending action items to propose tickets for',
      }, { status: 400 });
    }

    const proposedFollowups = [];

    for (const actionItem of meeting.action_items) {
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
      let assignmentSuggestion = null;
      let alternativeAssignees = null;

      try {
        // Create a temp ticket to analyze for assignment (we won't save it)
        const tempTicket = await prisma.qUAD_tickets.create({
          data: {
            domain_id: meeting.domain_id,
            ticket_number: 'TEMP-' + Date.now(),
            title: proposedTitle,
            description: actionItem.description,
            ticket_type: typeMap[actionItem.item_type] || 'task',
            status: 'backlog',
            priority: 'medium',
            reporter_id: session.user.id,
          },
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
        await prisma.qUAD_tickets.delete({ where: { id: tempTicket.id } });
      } catch {
        // Couldn't create temp ticket
      }

      // Create follow-up proposal
      const followUp = await prisma.qUAD_meeting_follow_ups.create({
        data: {
          meeting_id: id,
          action_item_id: actionItem.id,
          proposed_title: proposedTitle,
          proposed_description: actionItem.description,
          proposed_type: typeMap[actionItem.item_type] || 'task',
          proposed_priority: 'medium',
          proposed_story_points: 3,
          proposed_assignee_id: assignmentSuggestion?.user_id || null,
          assignment_reason: assignmentSuggestion?.reason || null,
          alternative_assignees: alternativeAssignees || undefined,
          status: 'proposed',
          ai_confidence: Number(actionItem.ai_confidence) || 0.8,
        },
      });

      proposedFollowups.push({
        id: followUp.id,
        title: followUp.proposed_title,
        type: followUp.proposed_type,
        suggested_assignee: assignmentSuggestion?.user_name || 'Unassigned',
        assignment_reason: assignmentSuggestion?.reason || 'No developers available',
        alternatives: alternativeAssignees?.map((a: { user_name: string }) => a.user_name) || [],
      });
    }

    // Update meeting to indicate follow-ups proposed
    await prisma.qUAD_meetings.update({
      where: { id },
      data: { followups_proposed: true },
    });

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
