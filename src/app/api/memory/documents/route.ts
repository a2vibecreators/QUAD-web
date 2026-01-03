/**
 * Memory Documents API - Manage hierarchical memory documents
 *
 * GET /api/memory/documents - List memory documents for an org
 * POST /api/memory/documents - Create/update a memory document
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MemoryService } from '@/lib/services/memory-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const level = searchParams.get('level'); // org, domain, project, circle, user
    const entityId = searchParams.get('entity_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      org_id: orgId,
      is_active: true,
    };

    if (level) where.memory_level = level;
    if (entityId) where.level_entity_id = entityId;

    const documents = await prisma.qUAD_memory_documents.findMany({
      where,
      select: {
        id: true,
        memory_level: true,
        level_entity_id: true,
        document_key: true,
        title: true,
        version: true,
        word_count: true,
        token_estimate: true,
        sections: true,
        auto_update_enabled: true,
        auto_update_sources: true,
        last_auto_update_at: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        { memory_level: 'asc' },
        { title: 'asc' },
      ],
    });

    // Group by level for easier viewing
    const byLevel: Record<string, typeof documents> = {};
    for (const doc of documents) {
      if (!byLevel[doc.memory_level]) {
        byLevel[doc.memory_level] = [];
      }
      byLevel[doc.memory_level].push(doc);
    }

    return NextResponse.json({
      success: true,
      documents,
      by_level: byLevel,
      total: documents.length,
      total_tokens: documents.reduce((sum, d) => sum + d.token_estimate, 0),
    });
  } catch (error) {
    console.error('[Memory Documents API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
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
      org_id,
      level,
      entity_id,
      title,
      content,
      from_template,
      template_type,
      placeholders,
    } = body;

    if (!org_id || !level) {
      return NextResponse.json({
        error: 'org_id and level are required',
      }, { status: 400 });
    }

    const validLevels = ['org', 'domain', 'project', 'circle', 'user'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({
        error: `Invalid level. Must be one of: ${validLevels.join(', ')}`,
      }, { status: 400 });
    }

    let documentId: string;

    if (from_template) {
      // Initialize from template
      documentId = await MemoryService.initializeMemoryFromTemplate(
        org_id,
        level,
        entity_id || null,
        template_type || 'default',
        placeholders || { name: title || level },
        session.user.id
      );
    } else {
      // Direct content update
      if (!content) {
        return NextResponse.json({
          error: 'content is required when not using template',
        }, { status: 400 });
      }

      documentId = await MemoryService.upsertMemoryDocument(
        org_id,
        level,
        entity_id || null,
        title || `${level} Memory`,
        content,
        session.user.id
      );
    }

    // Fetch the created/updated document
    const document = await prisma.qUAD_memory_documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        document_key: true,
        title: true,
        memory_level: true,
        version: true,
        word_count: true,
        token_estimate: true,
        sections: true,
        updated_at: true,
      },
    });

    // Count chunks created
    const chunkCount = await prisma.qUAD_memory_chunks.count({
      where: { document_id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: from_template ? 'Memory initialized from template' : 'Memory document saved',
      document,
      chunks_created: chunkCount,
    });
  } catch (error) {
    console.error('[Memory Documents API] Error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}
