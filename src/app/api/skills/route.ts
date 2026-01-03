/**
 * Skills API - Master skill list management
 *
 * GET /api/skills - List all skills for org
 * POST /api/skills - Create new skill or seed common skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// Common tech skills to seed when org creates first skill
const COMMON_SKILLS = [
  // Frontend
  { skill_code: 'react', skill_name: 'React', category: 'frontend', ai_context: 'React is a JavaScript library for building user interfaces' },
  { skill_code: 'typescript', skill_name: 'TypeScript', category: 'frontend', ai_context: 'TypeScript is a typed superset of JavaScript' },
  { skill_code: 'nextjs', skill_name: 'Next.js', category: 'frontend', ai_context: 'Next.js is a React framework for production' },
  { skill_code: 'tailwind', skill_name: 'Tailwind CSS', category: 'frontend', ai_context: 'Tailwind is a utility-first CSS framework' },
  // Backend
  { skill_code: 'nodejs', skill_name: 'Node.js', category: 'backend', ai_context: 'Node.js is a JavaScript runtime for server-side' },
  { skill_code: 'python', skill_name: 'Python', category: 'backend', ai_context: 'Python is a general-purpose programming language' },
  { skill_code: 'java', skill_name: 'Java', category: 'backend', ai_context: 'Java is an object-oriented programming language' },
  // Database
  { skill_code: 'postgresql', skill_name: 'PostgreSQL', category: 'database', ai_context: 'PostgreSQL is an open-source relational database' },
  { skill_code: 'mongodb', skill_name: 'MongoDB', category: 'database', ai_context: 'MongoDB is a NoSQL document database' },
  { skill_code: 'prisma', skill_name: 'Prisma', category: 'database', ai_context: 'Prisma is a next-gen Node.js ORM' },
  // DevOps
  { skill_code: 'docker', skill_name: 'Docker', category: 'devops', ai_context: 'Docker is a containerization platform' },
  { skill_code: 'aws', skill_name: 'AWS', category: 'devops', ai_context: 'Amazon Web Services cloud platform' },
  { skill_code: 'gcp', skill_name: 'Google Cloud', category: 'devops', ai_context: 'Google Cloud Platform services' },
  // Mobile
  { skill_code: 'swift', skill_name: 'Swift/iOS', category: 'mobile', ai_context: 'Swift programming for iOS development' },
  { skill_code: 'kotlin', skill_name: 'Kotlin/Android', category: 'mobile', ai_context: 'Kotlin programming for Android development' },
  // Testing
  { skill_code: 'jest', skill_name: 'Jest', category: 'testing', ai_context: 'Jest is a JavaScript testing framework' },
  { skill_code: 'cypress', skill_name: 'Cypress', category: 'testing', ai_context: 'Cypress is an end-to-end testing framework' },
  // AI
  { skill_code: 'ai_ml', skill_name: 'AI/ML', category: 'ai', ai_context: 'Artificial Intelligence and Machine Learning' },
  { skill_code: 'llm', skill_name: 'LLM Integration', category: 'ai', ai_context: 'Large Language Model integration' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const skills = await prisma.qUAD_skills.findMany({
      where: {
        org_id: user.org_id,
        is_active: true,
        ...(category && { category }),
      },
      orderBy: [{ category: 'asc' }, { skill_name: 'asc' }],
    });

    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof skills>);

    return NextResponse.json({ success: true, skills, skillsByCategory });
  } catch (error) {
    console.error('[Skills API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.qUAD_users.findUnique({
      where: { id: session.user.id },
      select: { org_id: true },
    });

    if (!user?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { skill_name, skill_code, category, description, ai_context, seed_common } = body;

    // Seed all common skills
    if (seed_common) {
      const existingSkills = await prisma.qUAD_skills.findMany({
        where: { org_id: user.org_id },
        select: { skill_code: true },
      });
      const existingCodes = new Set(existingSkills.map(s => s.skill_code));
      const skillsToCreate = COMMON_SKILLS.filter(s => !existingCodes.has(s.skill_code));

      if (skillsToCreate.length > 0) {
        await prisma.qUAD_skills.createMany({
          data: skillsToCreate.map(s => ({ org_id: user.org_id, ...s, related_skills: [] })),
        });
      }

      return NextResponse.json({
        success: true,
        message: `Seeded ${skillsToCreate.length} common skills`,
        seeded: skillsToCreate.length,
      });
    }

    // Create single skill
    if (!skill_name || !category) {
      return NextResponse.json({ error: 'skill_name and category are required' }, { status: 400 });
    }

    const code = skill_code || skill_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = await prisma.qUAD_skills.findFirst({
      where: { org_id: user.org_id, skill_code: code },
    });

    if (existing) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
    }

    const skill = await prisma.qUAD_skills.create({
      data: { org_id: user.org_id, skill_name, skill_code: code, category, description, ai_context, related_skills: [] },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error('[Skills API] Error:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
