/**
 * Java Backend Client
 *
 * Calls quad-services Spring Boot backend for:
 * - AI operations (Claude, OpenAI, Gemini routing)
 * - Memory/Context retrieval
 * - Assignment/Ticket routing
 * - GitHub integration
 * - Google Calendar integration
 *
 * Backend runs on:
 * - DEV: http://localhost:14101/api
 * - QA: http://localhost:15101/api
 * - PROD: https://api.quadframe.work
 */

const JAVA_API_URL = process.env.QUAD_API_URL || 'http://localhost:14101/api';

// Types matching Java DTOs
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  estimatedCost?: number;
}

export interface ContextScope {
  orgId: string;
  domainId?: string;
  userId?: string;
  sessionType?: string;
}

export interface ContextChunk {
  content: string;
  source: string;
  relevanceScore: number;
}

export interface ContextResult {
  chunks: ContextChunk[];
  totalTokens: number;
}

export interface AssignmentResult {
  userId: string;
  userName: string;
  confidence: number;
  reason: string;
}

// AI Service
export async function callAI(
  orgId: string,
  messages: AIMessage[],
  taskType: string = 'GENERAL'
): Promise<AIResponse> {
  const response = await fetch(`${JAVA_API_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, messages, taskType }),
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.statusText}`);
  }

  return response.json();
}

export async function streamAI(
  orgId: string,
  messages: AIMessage[],
  taskType: string = 'COMPLEX_CODING'
): Promise<ReadableStream<Uint8Array> | null> {
  const response = await fetch(`${JAVA_API_URL}/ai/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, messages, taskType }),
  });

  if (!response.ok) {
    throw new Error(`AI stream failed: ${response.statusText}`);
  }

  return response.body;
}

// Memory Service
export async function getContext(
  scope: ContextScope,
  keywords: string[],
  maxTokens: number = 4000
): Promise<ContextResult> {
  const response = await fetch(`${JAVA_API_URL}/memory/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, keywords, maxTokens }),
  });

  if (!response.ok) {
    throw new Error(`Context retrieval failed: ${response.statusText}`);
  }

  return response.json();
}

// Assignment Service
export async function assignTicket(
  ticketId: string,
  domainId: string,
  orgId: string
): Promise<AssignmentResult> {
  const response = await fetch(`${JAVA_API_URL}/tickets/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, domainId, orgId }),
  });

  if (!response.ok) {
    throw new Error(`Assignment failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getAssignmentSuggestions(
  ticketId: string,
  domainId: string,
  orgId: string,
  limit: number = 3
): Promise<AssignmentResult[]> {
  const response = await fetch(`${JAVA_API_URL}/tickets/suggest?ticketId=${ticketId}&domainId=${domainId}&orgId=${orgId}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Suggestions failed: ${response.statusText}`);
  }

  return response.json();
}

// GitHub Integration
export async function getGitHubAuthUrl(orgId: string, userId: string): Promise<string> {
  const response = await fetch(`${JAVA_API_URL}/integrations/github/auth?orgId=${orgId}&userId=${userId}`);

  if (!response.ok) {
    throw new Error(`GitHub auth URL failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.authUrl;
}

export async function listGitHubRepos(orgId: string): Promise<any[]> {
  const response = await fetch(`${JAVA_API_URL}/integrations/github/repos?orgId=${orgId}`);

  if (!response.ok) {
    throw new Error(`GitHub repos failed: ${response.statusText}`);
  }

  return response.json();
}

// Google Calendar Integration
export async function getCalendarAuthUrl(
  orgId: string,
  userId: string,
  redirectUri: string
): Promise<string> {
  const response = await fetch(`${JAVA_API_URL}/integrations/calendar/auth?orgId=${orgId}&userId=${userId}&redirectUri=${encodeURIComponent(redirectUri)}`);

  if (!response.ok) {
    throw new Error(`Calendar auth URL failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.authUrl;
}

export async function createMeeting(
  orgId: string,
  meeting: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmails?: string[];
    createMeetLink?: boolean;
  }
): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/integrations/calendar/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId,
      ...meeting,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Create meeting failed: ${response.statusText}`);
  }

  return response.json();
}

// Health check
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${JAVA_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Health check with detailed response (for db.ts compatibility)
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const response = await fetch(`${JAVA_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      return await response.json();
    }
    return { status: 'DOWN' };
  } catch {
    return { status: 'DOWN' };
  }
}

// =============================================================================
// CRUD Operations - Organizations
// =============================================================================

export async function getOrganizations(): Promise<any[]> {
  const response = await fetch(`${JAVA_API_URL}/organizations`);
  if (!response.ok) throw new Error(`Failed to get organizations: ${response.statusText}`);
  return response.json();
}

export async function getOrganization(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/organizations/${id}`);
  if (!response.ok) throw new Error(`Failed to get organization: ${response.statusText}`);
  return response.json();
}

export async function createOrganization(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create organization: ${response.statusText}`);
  return response.json();
}

export async function updateOrganization(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/organizations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update organization: ${response.statusText}`);
  return response.json();
}

export async function deleteOrganization(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/organizations/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete organization: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Users
// =============================================================================

export async function getUsers(orgId?: string): Promise<any[]> {
  const url = orgId ? `${JAVA_API_URL}/users?orgId=${orgId}` : `${JAVA_API_URL}/users`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get users: ${response.statusText}`);
  return response.json();
}

export async function getUser(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/users/${id}`);
  if (!response.ok) throw new Error(`Failed to get user: ${response.statusText}`);
  return response.json();
}

// Alias for backward compatibility
export const getUserById = getUser;

export async function getUserByEmail(email: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/users/email/${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error(`Failed to get user by email: ${response.statusText}`);
  return response.json();
}

export async function createUser(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create user: ${response.statusText}`);
  return response.json();
}

export async function updateUser(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update user: ${response.statusText}`);
  return response.json();
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/users/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete user: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Domains
// =============================================================================

export async function getDomains(orgId?: string): Promise<any[]> {
  const url = orgId ? `${JAVA_API_URL}/domains?orgId=${orgId}` : `${JAVA_API_URL}/domains`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get domains: ${response.statusText}`);
  return response.json();
}

export async function getDomain(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/domains/${id}`);
  if (!response.ok) throw new Error(`Failed to get domain: ${response.statusText}`);
  return response.json();
}

// Alias for backward compatibility
export const getDomainById = getDomain;

export async function createDomain(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create domain: ${response.statusText}`);
  return response.json();
}

export async function updateDomain(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/domains/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update domain: ${response.statusText}`);
  return response.json();
}

export async function deleteDomain(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/domains/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete domain: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Tickets
// =============================================================================

export async function getTickets(params?: { domainId?: string; cycleId?: string; assignedTo?: string }): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params?.domainId) searchParams.set('domainId', params.domainId);
  if (params?.cycleId) searchParams.set('cycleId', params.cycleId);
  if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
  const url = `${JAVA_API_URL}/tickets${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get tickets: ${response.statusText}`);
  return response.json();
}

export async function getTicket(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/tickets/${id}`);
  if (!response.ok) throw new Error(`Failed to get ticket: ${response.statusText}`);
  return response.json();
}

export async function createTicket(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create ticket: ${response.statusText}`);
  return response.json();
}

export async function updateTicket(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update ticket: ${response.statusText}`);
  return response.json();
}

export async function updateTicketStatus(id: string, status: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update ticket status: ${response.statusText}`);
  return response.json();
}

export async function deleteTicket(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/tickets/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete ticket: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Cycles
// =============================================================================

export async function getCycles(domainId?: string): Promise<any[]> {
  const url = domainId ? `${JAVA_API_URL}/cycles?domainId=${domainId}` : `${JAVA_API_URL}/cycles`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get cycles: ${response.statusText}`);
  return response.json();
}

export async function getCycle(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/cycles/${id}`);
  if (!response.ok) throw new Error(`Failed to get cycle: ${response.statusText}`);
  return response.json();
}

export async function getActiveCycle(domainId: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/cycles/domain/${domainId}/active`);
  if (!response.ok) throw new Error(`Failed to get active cycle: ${response.statusText}`);
  return response.json();
}

export async function createCycle(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/cycles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create cycle: ${response.statusText}`);
  return response.json();
}

export async function updateCycle(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/cycles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update cycle: ${response.statusText}`);
  return response.json();
}

export async function deleteCycle(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/cycles/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete cycle: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Roles
// =============================================================================

export async function getRoles(domainId?: string): Promise<any[]> {
  const url = domainId ? `${JAVA_API_URL}/roles?domainId=${domainId}` : `${JAVA_API_URL}/roles`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get roles: ${response.statusText}`);
  return response.json();
}

export async function getRole(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/roles/${id}`);
  if (!response.ok) throw new Error(`Failed to get role: ${response.statusText}`);
  return response.json();
}

export async function createRole(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create role: ${response.statusText}`);
  return response.json();
}

export async function updateRole(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update role: ${response.statusText}`);
  return response.json();
}

export async function deleteRole(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/roles/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete role: ${response.statusText}`);
}

// =============================================================================
// CRUD Operations - Circles
// =============================================================================

export async function getCircles(domainId?: string): Promise<any[]> {
  const url = domainId ? `${JAVA_API_URL}/circles?domainId=${domainId}` : `${JAVA_API_URL}/circles`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to get circles: ${response.statusText}`);
  return response.json();
}

export async function getCircle(id: string): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/circles/${id}`);
  if (!response.ok) throw new Error(`Failed to get circle: ${response.statusText}`);
  return response.json();
}

export async function createCircle(data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/circles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to create circle: ${response.statusText}`);
  return response.json();
}

export async function updateCircle(id: string, data: any): Promise<any> {
  const response = await fetch(`${JAVA_API_URL}/circles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update circle: ${response.statusText}`);
  return response.json();
}

export async function deleteCircle(id: string): Promise<void> {
  const response = await fetch(`${JAVA_API_URL}/circles/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete circle: ${response.statusText}`);
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  // AI
  callAI,
  streamAI,
  // Memory
  getContext,
  // Assignment
  assignTicket,
  getAssignmentSuggestions,
  // Integrations
  getGitHubAuthUrl,
  listGitHubRepos,
  getCalendarAuthUrl,
  createMeeting,
  // Health
  checkBackendHealth,
  healthCheck,
  // Organizations
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  // Users
  getUsers,
  getUser,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  // Domains
  getDomains,
  getDomain,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  // Tickets
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  // Cycles
  getCycles,
  getCycle,
  getActiveCycle,
  createCycle,
  updateCycle,
  deleteCycle,
  // Roles
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  // Circles
  getCircles,
  getCircle,
  createCircle,
  updateCircle,
  deleteCircle,
};
