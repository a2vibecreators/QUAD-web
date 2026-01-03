/**
 * Intelligent Ticket Assignment Service
 *
 * Assigns tickets to developers based on:
 * 1. Skill match (required skills vs user proficiency)
 * 2. Interest level (what user WANTS to learn - high/medium/low/none)
 * 3. Current workload (in-progress tickets)
 * 4. Historical performance (tickets completed, declined)
 * 5. Circle membership (Circle 2 = Development)
 *
 * Interest-based scoring:
 * - For CRITICAL tickets: Skill (70%) + Workload (20%) + Experience (10%)
 * - For HIGH priority: Skill (50%) + Workload (30%) + Experience (15%) + Interest (5%)
 * - For MEDIUM/LOW: Skill (40%) + Interest (25%) + Workload (25%) + Experience (10%)
 * - Novice + High Interest = Learning opportunity bonus
 *
 * Fallback strategies when no skill data:
 * - Round-robin based on workload
 * - Experience-based (role seniority)
 */

import { prisma } from '@/lib/prisma';

interface AssignmentCandidate {
  user_id: string;
  user_name: string;
  skill_score: number;
  interest_score: number;
  workload_score: number;
  experience_score: number;
  total_score: number;
  reasons: string[];
  skill_matches: { skill: string; user_level: number; required_level: number; interest: string; wants_to_learn: boolean }[];
}

interface AssignmentResult {
  assigned_to: string;
  assigned_name: string;
  assignment_type: 'skill_match' | 'interest_match' | 'learning_opportunity' | 'workload_balance' | 'experience_based' | 'single_developer';
  score: number;
  reason: string;
  candidates: AssignmentCandidate[];
}

/**
 * Get developers in Circle 2 (Development) for a domain
 */
async function getCircleDevelopers(domainId: string): Promise<string[]> {
  // Circle 2 is Development circle
  const circle = await prisma.qUAD_circles.findFirst({
    where: { domain_id: domainId, circle_number: 2, is_active: true },
    include: {
      members: {
        where: { role: { in: ['member', 'lead'] } },
        select: { user_id: true },
      },
    },
  });

  if (circle?.members.length) {
    return circle.members.map(m => m.user_id);
  }

  // Fallback: get all active users in domain
  const domainMembers = await prisma.qUAD_domain_members.findMany({
    where: { domain_id: domainId },
    select: { user_id: true },
  });

  return domainMembers.map(m => m.user_id);
}

/**
 * Analyze ticket to determine required skills
 */
async function analyzeTicketSkills(
  ticketId: string,
  _orgId: string
): Promise<{ skill_name: string; importance: string; min_proficiency: number }[]> {
  // First check if ticket already has skills assigned
  const existingSkills = await prisma.qUAD_ticket_skills.findMany({
    where: { ticket_id: ticketId },
    include: { skill: true },
  });

  if (existingSkills.length > 0) {
    return existingSkills.map(ts => ({
      skill_name: ts.skill.skill_name,
      importance: ts.importance,
      min_proficiency: ts.min_proficiency,
    }));
  }

  // If no skills assigned, infer from ticket title/description
  const ticket = await prisma.qUAD_tickets.findUnique({
    where: { id: ticketId },
    select: { title: true, description: true },
  });

  if (!ticket) return [];

  const text = (ticket.title + ' ' + (ticket.description || '')).toLowerCase();

  // Simple keyword matching (AI can improve this later)
  const skillKeywords: Record<string, string[]> = {
    'react': ['react', 'component', 'jsx', 'tsx', 'hooks', 'useState', 'useEffect'],
    'typescript': ['typescript', 'types', 'interface', 'ts', '.tsx'],
    'nextjs': ['next.js', 'nextjs', 'next', 'app router', 'pages'],
    'nodejs': ['node', 'express', 'api', 'backend', 'server'],
    'postgresql': ['postgres', 'sql', 'database', 'prisma', 'query'],
    'docker': ['docker', 'container', 'dockerfile', 'compose'],
    'swift': ['ios', 'swift', 'swiftui', 'xcode', 'apple'],
    'kotlin': ['android', 'kotlin', 'jetpack'],
    'python': ['python', 'django', 'flask', 'pandas'],
    'testing': ['test', 'jest', 'cypress', 'e2e', 'unit test'],
  };

  const inferredSkills: { skill_name: string; importance: string; min_proficiency: number }[] = [];

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      inferredSkills.push({
        skill_name: skill,
        importance: 'preferred',
        min_proficiency: 2,
      });
    }
  }

  return inferredSkills;
}

/**
 * Get current workload for a user (in-progress tickets)
 */
async function getUserWorkload(userId: string): Promise<number> {
  const inProgressTickets = await prisma.qUAD_tickets.count({
    where: {
      assigned_to: userId,
      status: { in: ['in_progress', 'in_review'] },
    },
  });

  return inProgressTickets;
}

/**
 * Get user's skill info including proficiency AND interest
 */
interface UserSkillInfo {
  proficiency_level: number;
  interest_level: string; // high, medium, low, none
  wants_to_learn: boolean;
}

async function getUserSkillInfo(userId: string, skillName: string): Promise<UserSkillInfo> {
  const userSkill = await prisma.qUAD_user_skills.findFirst({
    where: {
      user_id: userId,
      skill_name: { equals: skillName, mode: 'insensitive' },
    },
    select: {
      proficiency_level: true,
      interest_level: true,
      wants_to_learn: true,
    },
  });

  return {
    proficiency_level: userSkill?.proficiency_level || 0,
    interest_level: userSkill?.interest_level || 'medium',
    wants_to_learn: userSkill?.wants_to_learn || false,
  };
}

/**
 * Get user's skill level for a specific skill (backwards compatible)
 */
async function getUserSkillLevel(userId: string, skillName: string): Promise<number> {
  const info = await getUserSkillInfo(userId, skillName);
  return info.proficiency_level;
}

/**
 * Calculate interest score based on interest level and learning desire
 */
function calculateInterestScore(interest: string, wantsToLearn: boolean, proficiency: number): number {
  // Base interest score
  const interestScores: Record<string, number> = {
    'high': 100,
    'medium': 60,
    'low': 30,
    'none': 0,
  };

  let score = interestScores[interest] || 60;

  // Bonus for eager learners with low proficiency (learning opportunity)
  if (wantsToLearn && proficiency <= 2) {
    score += 20; // Bonus for novice eager to learn
  }

  return Math.min(score, 100);
}

/**
 * Get user experience score based on role and org membership
 */
async function getUserExperienceScore(userId: string, orgId: string): Promise<number> {
  const membership = await prisma.qUAD_org_members.findFirst({
    where: { user_id: userId, org_id: orgId },
    select: { role: true, joined_at: true },
  });

  if (!membership) return 1;

  // Role-based score
  const roleScores: Record<string, number> = {
    'OWNER': 5,
    'ADMIN': 4,
    'LEAD': 4,
    'SENIOR': 4,
    'DEVELOPER': 3,
    'MEMBER': 2,
    'INTERN': 1,
  };

  const baseScore = roleScores[membership.role] || 2;

  // Add tenure bonus (up to 1 point for 1+ year)
  const monthsInOrg = Math.floor((Date.now() - membership.joined_at.getTime()) / (30 * 24 * 60 * 60 * 1000));
  const tenureBonus = Math.min(monthsInOrg / 12, 1);

  return baseScore + tenureBonus;
}

/**
 * Main assignment function
 */
export async function assignTicket(
  ticketId: string,
  domainId: string,
  orgId: string
): Promise<AssignmentResult> {
  // 1. Get candidate developers from Circle 2
  const developerIds = await getCircleDevelopers(domainId);

  if (developerIds.length === 0) {
    throw new Error('No developers available for assignment');
  }

  // 2. If only one developer, assign directly
  if (developerIds.length === 1) {
    const user = await prisma.qUAD_users.findUnique({
      where: { id: developerIds[0] },
      select: { full_name: true },
    });

    return {
      assigned_to: developerIds[0],
      assigned_name: user?.full_name || 'Developer',
      assignment_type: 'single_developer',
      score: 100,
      reason: 'Only developer in Circle 2',
      candidates: [],
    };
  }

  // 3. Get required skills and ticket priority for weighted scoring
  const requiredSkills = await analyzeTicketSkills(ticketId, orgId);
  const ticket = await prisma.qUAD_tickets.findUnique({
    where: { id: ticketId },
    select: { priority: true },
  });
  const priority = ticket?.priority || 'medium';

  // 4. Score each candidate
  const candidates: AssignmentCandidate[] = [];

  for (const userId of developerIds) {
    const user = await prisma.qUAD_users.findUnique({
      where: { id: userId },
      select: { full_name: true },
    });

    const reasons: string[] = [];
    const skillMatches: AssignmentCandidate['skill_matches'] = [];
    let hasLearningOpportunity = false;

    // Skill and Interest scores (0-100)
    let skillScore = 50; // Default when no skills defined
    let interestScore = 50; // Default interest
    let totalInterestPoints = 0;
    let interestCount = 0;

    if (requiredSkills.length > 0) {
      let totalSkillPoints = 0;
      let maxSkillPoints = 0;

      for (const required of requiredSkills) {
        const skillInfo = await getUserSkillInfo(userId, required.skill_name);
        const userLevel = skillInfo.proficiency_level;
        const weight = required.importance === 'required' ? 2 : 1;

        skillMatches.push({
          skill: required.skill_name,
          user_level: userLevel,
          required_level: required.min_proficiency,
          interest: skillInfo.interest_level,
          wants_to_learn: skillInfo.wants_to_learn,
        });

        // Calculate skill contribution
        if (userLevel >= required.min_proficiency) {
          totalSkillPoints += userLevel * weight;
          reasons.push('Has ' + required.skill_name + ' (' + userLevel + '/5)');
        } else if (userLevel > 0) {
          totalSkillPoints += (userLevel / required.min_proficiency) * weight;
          reasons.push('Learning ' + required.skill_name + ' (' + userLevel + '/' + required.min_proficiency + ')');
        }
        maxSkillPoints += 5 * weight;

        // Calculate interest contribution
        const thisInterest = calculateInterestScore(skillInfo.interest_level, skillInfo.wants_to_learn, userLevel);
        totalInterestPoints += thisInterest;
        interestCount++;

        // Check for learning opportunity (novice + eager)
        if (userLevel <= 2 && skillInfo.wants_to_learn && skillInfo.interest_level === 'high') {
          hasLearningOpportunity = true;
          reasons.push('Eager to learn ' + required.skill_name + ' (growth opportunity)');
        } else if (skillInfo.interest_level === 'high') {
          reasons.push('High interest in ' + required.skill_name);
        }
      }

      skillScore = maxSkillPoints > 0 ? Math.round((totalSkillPoints / maxSkillPoints) * 100) : 50;
      interestScore = interestCount > 0 ? Math.round(totalInterestPoints / interestCount) : 50;
    }

    // Workload score (0-100, lower workload = higher score)
    const workload = await getUserWorkload(userId);
    const workloadScore = Math.max(0, 100 - (workload * 20)); // -20 points per in-progress ticket
    if (workload === 0) {
      reasons.push('No current tickets');
    } else {
      reasons.push(workload + ' active tickets');
    }

    // Experience score (0-100)
    const expRaw = await getUserExperienceScore(userId, orgId);
    const experienceScore = Math.round((expRaw / 6) * 100); // 6 is max possible

    // Priority-weighted total score
    // CRITICAL: Skill 70%, Workload 20%, Experience 10% (ignore interest - need experts)
    // HIGH: Skill 50%, Workload 30%, Experience 15%, Interest 5%
    // MEDIUM/LOW: Skill 40%, Interest 25%, Workload 25%, Experience 10%
    let totalScore: number;
    if (priority === 'critical') {
      totalScore = Math.round(
        (skillScore * 0.70) + (workloadScore * 0.20) + (experienceScore * 0.10)
      );
    } else if (priority === 'high') {
      totalScore = Math.round(
        (skillScore * 0.50) + (workloadScore * 0.30) + (experienceScore * 0.15) + (interestScore * 0.05)
      );
    } else {
      // medium or low - prioritize interest for learning opportunities
      totalScore = Math.round(
        (skillScore * 0.40) + (interestScore * 0.25) + (workloadScore * 0.25) + (experienceScore * 0.10)
      );
      // Bonus for learning opportunity on low/medium priority tickets
      if (hasLearningOpportunity) {
        totalScore += 10;
        reasons.push('Learning opportunity bonus +10');
      }
    }

    candidates.push({
      user_id: userId,
      user_name: user?.full_name || 'Unknown',
      skill_score: skillScore,
      interest_score: interestScore,
      workload_score: workloadScore,
      experience_score: experienceScore,
      total_score: totalScore,
      reasons,
      skill_matches: skillMatches,
    });
  }

  // 5. Sort by total score and pick best
  candidates.sort((a, b) => b.total_score - a.total_score);
  const winner = candidates[0];

  // Determine assignment type based on what contributed most
  let assignmentType: AssignmentResult['assignment_type'] = 'skill_match';
  if (requiredSkills.length === 0) {
    if (winner.workload_score > winner.experience_score) {
      assignmentType = 'workload_balance';
    } else {
      assignmentType = 'experience_based';
    }
  } else {
    // Check if this was a learning opportunity assignment
    const hasLearningMatch = winner.skill_matches.some(
      m => m.user_level <= 2 && m.wants_to_learn && m.interest === 'high'
    );
    if (hasLearningMatch && (priority === 'medium' || priority === 'low')) {
      assignmentType = 'learning_opportunity';
    } else if (winner.interest_score > winner.skill_score) {
      assignmentType = 'interest_match';
    } else {
      assignmentType = 'skill_match';
    }
  }

  // Build reason string
  const reasonParts = [
    'Score: ' + winner.total_score,
    'Skills: ' + winner.skill_score + '%',
    'Interest: ' + winner.interest_score + '%',
    'Availability: ' + winner.workload_score + '%',
  ];

  return {
    assigned_to: winner.user_id,
    assigned_name: winner.user_name,
    assignment_type: assignmentType,
    score: winner.total_score,
    reason: reasonParts.join(' | '),
    candidates,
  };
}

/**
 * Record assignment decision for audit and learning
 */
export async function recordAssignment(
  ticketId: string,
  result: AssignmentResult,
  overriddenBy?: string,
  overrideReason?: string
): Promise<void> {
  await prisma.qUAD_assignment_scores.create({
    data: {
      ticket_id: ticketId,
      assigned_to: result.assigned_to,
      assignment_type: overriddenBy ? 'manual_override' : result.assignment_type,
      assignment_reason: result.reason,
      candidates: JSON.parse(JSON.stringify(result.candidates)),
      overridden_by: overriddenBy,
      override_reason: overrideReason,
    },
  });
}

/**
 * Record skill feedback when user declines or completes a ticket
 * Also used for scrum feedback without a specific ticket
 */
export async function recordSkillFeedback(
  userId: string,
  ticketId: string | null,
  feedbackType: 'ticket_completed' | 'ticket_declined' | 'ticket_reassigned' | 'scrum_feedback' | 'peer_feedback',
  skillName?: string,
  notes?: string
): Promise<void> {
  // Get skills associated with this ticket (if ticket provided)
  let skillsToRecord: { skill_name: string; skill_id: string | null }[] = [];

  if (skillName) {
    skillsToRecord = [{ skill_name: skillName, skill_id: null }];
  } else if (ticketId) {
    const ticketSkills = await prisma.qUAD_ticket_skills.findMany({
      where: { ticket_id: ticketId },
      include: { skill: true },
    });
    skillsToRecord = ticketSkills.map(ts => ({ skill_name: ts.skill.skill_name, skill_id: ts.skill_id }));
  }

  // If no skills to record, return early
  if (skillsToRecord.length === 0) return;

  for (const skill of skillsToRecord) {
    const delta = feedbackType === 'ticket_completed' ? 1 :
                  feedbackType === 'ticket_declined' ? -1 :
                  feedbackType === 'scrum_feedback' ? -1 : 0;

    await prisma.qUAD_skill_feedback.create({
      data: {
        user_id: userId,
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        feedback_type: feedbackType,
        proficiency_delta: delta,
        ticket_id: ticketId,
        feedback_notes: notes,
        is_processed: false,
      },
    });

    // Update user skill stats
    if (delta !== 0) {
      const userSkill = await prisma.qUAD_user_skills.findFirst({
        where: { user_id: userId, skill_name: skill.skill_name },
      });

      if (userSkill) {
        await prisma.qUAD_user_skills.update({
          where: { id: userSkill.id },
          data: {
            tickets_completed: feedbackType === 'ticket_completed'
              ? { increment: 1 }
              : undefined,
            tickets_declined: feedbackType === 'ticket_declined'
              ? { increment: 1 }
              : undefined,
            positive_feedback: delta > 0 ? { increment: 1 } : undefined,
            negative_feedback: delta < 0 ? { increment: 1 } : undefined,
            last_assessed: new Date(),
          },
        });
      }
    }
  }
}
