/**
 * PUT /api/skills/[id] - Update skill
 * DELETE /api/skills/[id] - Delete skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT: Update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { proficiency_level, certified, certification_date } = body;

    // Find skill and verify ownership
    const existingSkill = await prisma.qUAD_user_skills.findUnique({
      where: { id }
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (existingSkill.user_id !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to update this skill' }, { status: 403 });
    }

    // Validate proficiency level
    if (proficiency_level !== undefined && (proficiency_level < 1 || proficiency_level > 5)) {
      return NextResponse.json(
        { error: 'proficiency_level must be between 1 and 5' },
        { status: 400 }
      );
    }

    const skill = await prisma.qUAD_user_skills.update({
      where: { id },
      data: {
        ...(proficiency_level !== undefined && { proficiency_level }),
        ...(certified !== undefined && { certified }),
        ...(certification_date !== undefined && {
          certification_date: certification_date ? new Date(certification_date) : null
        })
      }
    });

    return NextResponse.json({ skill });

  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Find skill and verify ownership
    const existingSkill = await prisma.qUAD_user_skills.findUnique({
      where: { id }
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (existingSkill.user_id !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this skill' }, { status: 403 });
    }

    await prisma.qUAD_user_skills.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Skill deleted successfully' });

  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
