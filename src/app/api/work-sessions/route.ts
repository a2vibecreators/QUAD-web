/**
 * GET /api/work-sessions - Get work sessions (4-4-4 tracking)
 * POST /api/work-sessions - Log a work session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get work sessions
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
    const userId = searchParams.get('user_id') || payload.userId;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const isWorkday = searchParams.get('is_workday');

    // Verify user is in same company
    if (userId !== payload.userId) {
      const user = await prisma.qUAD_users.findUnique({
        where: { id: userId }
      });
      if (!user || user.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Build where clause
    const where: Record<string, unknown> = { user_id: userId };

    if (startDate) {
      where.session_date = { ...where.session_date as object, gte: new Date(startDate) };
    }
    if (endDate) {
      where.session_date = { ...where.session_date as object, lte: new Date(endDate) };
    }
    if (isWorkday !== null && isWorkday !== undefined) {
      where.is_workday = isWorkday === 'true';
    }

    const sessions = await prisma.qUAD_work_sessions.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        }
      },
      orderBy: { session_date: 'desc' }
    });

    // Calculate 4-4-4 metrics for the period
    const workdaySessions = sessions.filter(s => s.is_workday);
    const totalHours = workdaySessions.reduce((acc, s) => acc + Number(s.hours_worked), 0);
    const totalDays = workdaySessions.length;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const avgDeepWorkPct = workdaySessions.length > 0
      ? workdaySessions.reduce((acc, s) => acc + (Number(s.deep_work_pct) || 0), 0) / workdaySessions.length
      : 0;

    // Weekly summary (assuming 4 days/week target)
    const weeksInPeriod = totalDays > 0 ? Math.ceil(totalDays / 7) : 1;
    const avgDaysPerWeek = totalDays / weeksInPeriod;

    return NextResponse.json({
      sessions,
      summary: {
        total_sessions: sessions.length,
        workday_sessions: workdaySessions.length,
        total_hours: totalHours,
        avg_hours_per_day: avgHoursPerDay.toFixed(2),
        avg_deep_work_pct: avgDeepWorkPct.toFixed(1),
        avg_days_per_week: avgDaysPerWeek.toFixed(1),
        // 4-4-4 compliance
        meets_4_hours_avg: avgHoursPerDay >= 4,
        meets_4_days_avg: avgDaysPerWeek >= 4
      }
    });
  } catch (error) {
    console.error('Get work sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Log a work session
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
      user_id,
      session_date,
      hours_worked,
      is_workday,
      start_time,
      end_time,
      deep_work_pct,
      meeting_hours,
      notes
    } = body;

    // Use current user if user_id not specified
    const targetUserId = user_id || payload.userId;

    // Validation
    if (!session_date) {
      return NextResponse.json(
        { error: 'session_date is required' },
        { status: 400 }
      );
    }

    // If logging for another user, verify they're in same company
    if (targetUserId !== payload.userId) {
      // Only admins can log for others
      if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const user = await prisma.qUAD_users.findUnique({
        where: { id: targetUserId }
      });
      if (!user || user.org_id !== payload.companyId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Check for existing session on this date (upsert)
    const sessionDateObj = new Date(session_date);
    const existing = await prisma.qUAD_work_sessions.findUnique({
      where: {
        user_id_session_date: {
          user_id: targetUserId,
          session_date: sessionDateObj
        }
      }
    });

    let session;
    if (existing) {
      // Update existing
      session = await prisma.qUAD_work_sessions.update({
        where: { id: existing.id },
        data: {
          hours_worked: hours_worked !== undefined ? hours_worked : existing.hours_worked,
          is_workday: is_workday !== undefined ? is_workday : existing.is_workday,
          start_time: start_time !== undefined ? start_time : existing.start_time,
          end_time: end_time !== undefined ? end_time : existing.end_time,
          deep_work_pct: deep_work_pct !== undefined ? deep_work_pct : existing.deep_work_pct,
          meeting_hours: meeting_hours !== undefined ? meeting_hours : existing.meeting_hours,
          notes: notes !== undefined ? notes : existing.notes
        },
        include: {
          user: { select: { id: true, email: true, full_name: true } }
        }
      });
    } else {
      // Create new
      session = await prisma.qUAD_work_sessions.create({
        data: {
          user_id: targetUserId,
          session_date: sessionDateObj,
          hours_worked: hours_worked || 0,
          is_workday: is_workday !== undefined ? is_workday : true,
          start_time,
          end_time,
          deep_work_pct,
          meeting_hours,
          notes
        },
        include: {
          user: { select: { id: true, email: true, full_name: true } }
        }
      });
    }

    return NextResponse.json(session, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Create work session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
