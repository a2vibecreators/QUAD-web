/**
 * Memory Templates API - Manage reusable memory templates
 *
 * GET /api/memory/templates - List available templates
 * POST /api/memory/templates - Create a new template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// Types
interface MemoryTemplate {
  id: string;
  template_name: string;
  memory_level: string;
  template_type: string;
  content_template: string;
  sections: string[];
  is_default: boolean;
  is_active: boolean;
  times_used: number;
}

// TODO: Implement via Java backend when endpoints are ready
async function getMemoryTemplates(level?: string | null, type?: string | null): Promise<MemoryTemplate[]> {
  console.log(`[MemoryTemplates] getMemoryTemplates for level: ${level}, type: ${type}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function unsetDefaultTemplates(memoryLevel: string): Promise<void> {
  console.log(`[MemoryTemplates] unsetDefaultTemplates for level: ${memoryLevel}`);
}

// TODO: Implement via Java backend when endpoints are ready
async function createMemoryTemplate(data: Partial<MemoryTemplate>): Promise<MemoryTemplate> {
  console.log(`[MemoryTemplates] createMemoryTemplate:`, data);
  return {
    id: 'mock-id',
    template_name: data.template_name || '',
    memory_level: data.memory_level || '',
    template_type: data.template_type || 'default',
    content_template: data.content_template || '',
    sections: data.sections || [],
    is_default: data.is_default || false,
    is_active: true,
    times_used: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const type = searchParams.get('type');

    const templates = await getMemoryTemplates(level, type);

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
      await unsetDefaultTemplates(memory_level);
    }

    const template = await createMemoryTemplate({
      template_name,
      memory_level,
      template_type: template_type || 'default',
      content_template,
      sections: sections || [],
      is_default: is_default || false,
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
