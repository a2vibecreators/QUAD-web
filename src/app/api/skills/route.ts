/**
 * Skills API - Master skill list management
 *
 * GET /api/skills - List all skills for org
 * POST /api/skills - Create new skill or seed common skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// NOTE: Prisma removed - using stubs until Java backend ready

// Types
interface Skill {
  id: string;
  org_id: string;
  skill_code: string;
  skill_name: string;
  category: string;
  description: string | null;
  ai_context: string | null;
  is_active: boolean;
  related_skills: string[];
}

// TODO: Implement via Java backend when endpoints are ready
async function getUserOrgId(userId: string): Promise<string | null> {
  console.log(`[Skills] getUserOrgId for: ${userId}`);
  return 'mock-org-id';
}

// TODO: Implement via Java backend when endpoints are ready
async function getOrgSkills(orgId: string, category?: string | null): Promise<Skill[]> {
  console.log(`[Skills] getOrgSkills for org: ${orgId}, category: ${category}`);
  return []; // Return empty until backend ready
}

// TODO: Implement via Java backend when endpoints are ready
async function getExistingSkillCodes(orgId: string): Promise<string[]> {
  console.log(`[Skills] getExistingSkillCodes for org: ${orgId}`);
  return [];
}

// TODO: Implement via Java backend when endpoints are ready
async function createManySkills(orgId: string, skills: Partial<Skill>[]): Promise<void> {
  console.log(`[Skills] createManySkills for org: ${orgId}:`, skills.length);
}

// TODO: Implement via Java backend when endpoints are ready
async function findSkillByCode(orgId: string, skillCode: string): Promise<Skill | null> {
  console.log(`[Skills] findSkillByCode: ${orgId}, ${skillCode}`);
  return null;
}

// TODO: Implement via Java backend when endpoints are ready
async function createSkill(data: Partial<Skill>): Promise<Skill> {
  console.log(`[Skills] createSkill:`, data);
  return { id: 'mock-id', org_id: data.org_id || '', skill_code: data.skill_code || '', skill_name: data.skill_name || '', category: data.category || '', description: null, ai_context: null, is_active: true, related_skills: [] };
}

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

    const orgId = await getUserOrgId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const skills = await getOrgSkills(orgId, category);

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

    const orgId = await getUserOrgId(session.user.id);

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { skill_name, skill_code, category, description, ai_context, seed_common } = body;

    // Seed all common skills
    if (seed_common) {
      const existingCodes = await getExistingSkillCodes(orgId);
      const existingCodeSet = new Set(existingCodes);
      const skillsToCreate = COMMON_SKILLS.filter(s => !existingCodeSet.has(s.skill_code));

      if (skillsToCreate.length > 0) {
        await createManySkills(orgId, skillsToCreate.map(s => ({ org_id: orgId, ...s, related_skills: [] })));
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
    const existing = await findSkillByCode(orgId, code);

    if (existing) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
    }

    const skill = await createSkill({
      org_id: orgId,
      skill_name,
      skill_code: code,
      category,
      description,
      ai_context,
      related_skills: [],
    });

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error('[Skills API] Error:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
