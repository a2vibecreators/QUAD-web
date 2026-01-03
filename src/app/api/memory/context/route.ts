/**
 * Memory Context API - Get initial context for AI sessions
 *
 * POST /api/memory/context - Get initial context based on keywords/entity
 *
 * This is the main entry point for AI interactions.
 * It retrieves hierarchical context efficiently.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { MemoryService } from '@/lib/services/memory-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      org_id,
      domain_id,
      project_id,
      circle_id,
      session_type,
      trigger_entity_type,
      trigger_entity_id,
      keywords,
      max_tokens,
    } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    if (!session_type) {
      return NextResponse.json({ error: 'session_type is required' }, { status: 400 });
    }

    const validSessionTypes = ['ticket_analysis', 'code_review', 'meeting_summary', 'chat', 'test_generation'];
    if (!validSessionTypes.includes(session_type)) {
      return NextResponse.json({
        error: `Invalid session_type. Must be one of: ${validSessionTypes.join(', ')}`,
      }, { status: 400 });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({
        error: 'keywords array is required (at least one keyword)',
      }, { status: 400 });
    }

    const result = await MemoryService.getInitialContext(
      {
        orgId: org_id,
        domainId: domain_id,
        projectId: project_id,
        circleId: circle_id,
        userId: session.user.id,
        sessionType: session_type,
        triggerEntityType: trigger_entity_type,
        triggerEntityId: trigger_entity_id,
      },
      keywords,
      max_tokens || 4000
    );

    // Format chunks for AI consumption
    const formattedContext = result.chunks.map(chunk => ({
      section: chunk.section,
      level: chunk.level,
      content: chunk.content,
    }));

    return NextResponse.json({
      success: true,
      session_id: result.sessionId,
      context: formattedContext,
      metadata: {
        total_tokens: result.totalTokens,
        chunks_count: result.chunks.length,
        hierarchy_included: result.hierarchyIncluded,
        keywords_matched: result.keywordsMatched,
      },
      // Raw context as markdown for direct AI consumption
      context_markdown: formatContextAsMarkdown(result.chunks),
    });
  } catch (error) {
    console.error('[Memory Context API] Error:', error);
    return NextResponse.json({ error: 'Failed to get context' }, { status: 500 });
  }
}

/**
 * Format chunks as markdown for easy AI consumption
 */
function formatContextAsMarkdown(chunks: { section: string; level: string; content: string }[]): string {
  const byLevel: Record<string, string[]> = {};

  for (const chunk of chunks) {
    if (!byLevel[chunk.level]) {
      byLevel[chunk.level] = [];
    }
    byLevel[chunk.level].push(`### ${chunk.section}\n${chunk.content}`);
  }

  const sections: string[] = [];

  if (byLevel.org) {
    sections.push(`## Organization Context\n${byLevel.org.join('\n\n')}`);
  }
  if (byLevel.domain) {
    sections.push(`## Domain Context\n${byLevel.domain.join('\n\n')}`);
  }
  if (byLevel.project) {
    sections.push(`## Project Context\n${byLevel.project.join('\n\n')}`);
  }
  if (byLevel.circle) {
    sections.push(`## Team Context\n${byLevel.circle.join('\n\n')}`);
  }
  if (byLevel.user) {
    sections.push(`## User Preferences\n${byLevel.user.join('\n\n')}`);
  }

  return sections.join('\n\n---\n\n');
}
