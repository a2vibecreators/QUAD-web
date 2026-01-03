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

export default {
  callAI,
  streamAI,
  getContext,
  assignTicket,
  getAssignmentSuggestions,
  getGitHubAuthUrl,
  listGitHubRepos,
  getCalendarAuthUrl,
  createMeeting,
  checkBackendHealth,
};
