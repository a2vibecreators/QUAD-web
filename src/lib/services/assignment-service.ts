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

// NOTE: Prisma removed - using stubs until Java backend ready

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
 * TODO: Implement via Java backend when endpoints are ready
 */
async function getCircleDevelopers(domainId: string): Promise<string[]> {
  // TODO: Call Java backend to get circle developers
  console.log(`[AssignmentService] getCircleDevelopers for domain: ${domainId}`);
  return []; // Return empty until backend ready
}

/**
 * Analyze ticket to determine required skills
 * TODO: Implement via Java backend when endpoints are ready
 */
async function analyzeTicketSkills(
  ticketId: string,
  _orgId: string
): Promise<{ skill_name: string; importance: string; min_proficiency: number }[]> {
  // TODO: Call Java backend to get ticket skills
  console.log(`[AssignmentService] analyzeTicketSkills for ticket: ${ticketId}`);
  return []; // Return empty until backend ready
}

/**
 * Get current workload for a user (in-progress tickets)
 * TODO: Implement via Java backend when endpoints are ready
 */
async function getUserWorkload(userId: string): Promise<number> {
  // TODO: Call Java backend to get user workload
  console.log(`[AssignmentService] getUserWorkload for user: ${userId}`);
  return 0; // Return 0 until backend ready
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
  // TODO: Call Java backend to get user skill info
  console.log(`[AssignmentService] getUserSkillInfo for user: ${userId}, skill: ${skillName}`);
  return {
    proficiency_level: 0,
    interest_level: 'medium',
    wants_to_learn: false,
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
 * TODO: Implement via Java backend when endpoints are ready
 */
async function getUserExperienceScore(userId: string, orgId: string): Promise<number> {
  // TODO: Call Java backend to get user experience score
  console.log(`[AssignmentService] getUserExperienceScore for user: ${userId}, org: ${orgId}`);
  return 3; // Default score until backend ready
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
    return {
      assigned_to: developerIds[0],
      assigned_name: 'Developer',
      assignment_type: 'single_developer',
      score: 100,
      reason: 'Only developer in Circle 2',
      candidates: [],
    };
  }

  // 3. Get required skills and ticket priority for weighted scoring
  const requiredSkills = await analyzeTicketSkills(ticketId, orgId);
  // TODO: Get ticket priority from Java backend
  const priority = 'medium'; // Default priority until backend ready

  // 4. Score each candidate
  const candidates: AssignmentCandidate[] = [];

  for (const userId of developerIds) {
    // TODO: Get user name from Java backend
    const userName = 'Developer';

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
      user_name: userName,
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
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordAssignment(
  ticketId: string,
  result: AssignmentResult,
  overriddenBy?: string,
  overrideReason?: string
): Promise<void> {
  // TODO: Call Java backend to record assignment
  console.log(`[AssignmentService] recordAssignment for ticket: ${ticketId}, assigned to: ${result.assigned_to}`);
}

/**
 * Record skill feedback when user declines or completes a ticket
 * Also used for scrum feedback without a specific ticket
 * TODO: Implement via Java backend when endpoints are ready
 */
export async function recordSkillFeedback(
  userId: string,
  ticketId: string | null,
  feedbackType: 'ticket_completed' | 'ticket_declined' | 'ticket_reassigned' | 'scrum_feedback' | 'peer_feedback',
  skillName?: string,
  notes?: string
): Promise<void> {
  // TODO: Call Java backend to record skill feedback
  console.log(`[AssignmentService] recordSkillFeedback for user: ${userId}, feedback: ${feedbackType}`);
}
