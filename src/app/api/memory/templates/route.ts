/**
 * Memory Templates API - Manage reusable memory templates
 *
 * GET /api/memory/templates - List available templates
 * POST /api/memory/templates - Create a new template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { is_active: true };
    if (level) where.memory_level = level;
    if (type) where.template_type = type;

    const templates = await prisma.qUAD_memory_templates.findMany({
      where,
      orderBy: [
        { is_default: 'desc' },
        { times_used: 'desc' },
      ],
    });

    // Group by level
    const byLevel: Record<string, typeof templates> = {};
    for (const template of templates) {
      if (!byLevel[template.memory_level]) {
        byLevel[template.memory_level] = [];
      }
      byLevel[template.memory_level].push(template);
    }

    return NextResponse.json({
      success: true,
      templates,
      by_level: byLevel,
    });
  } catch (error) {
    console.error('[Memory Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      template_name,
      memory_level,
      template_type,
      content_template,
      sections,
      is_default,
    } = body;

    if (!template_name || !memory_level || !content_template) {
      return NextResponse.json({
        error: 'template_name, memory_level, and content_template are required',
      }, { status: 400 });
    }

    const validLevels = ['org', 'domain', 'project', 'circle', 'user'];
    if (!validLevels.includes(memory_level)) {
      return NextResponse.json({
        error: `Invalid memory_level. Must be one of: ${validLevels.join(', ')}`,
      }, { status: 400 });
    }

    // If setting as default, unset other defaults for this level
    if (is_default) {
      await prisma.qUAD_memory_templates.updateMany({
        where: { memory_level, is_default: true },
        data: { is_default: false },
      });
    }

    const template = await prisma.qUAD_memory_templates.create({
      data: {
        template_name,
        memory_level,
        template_type: template_type || 'default',
        content_template,
        sections: sections || [],
        is_default: is_default || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template created',
      template,
    });
  } catch (error) {
    console.error('[Memory Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
