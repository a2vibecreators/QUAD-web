/**
 * QUAD Framework - Batch Processor
 *
 * Implements the "Come Back in 5 Minutes" async processing model.
 * Uses Claude's Batch API for 50% cost savings on non-urgent tasks.
 *
 * Flow:
 * 1. User submits request
 * 2. QUAD immediately responds with job URL
 * 3. Request queued for batch processing
 * 4. User notified when complete (email/Slack/push)
 * 5. User retrieves results from job URL
 */

import { BatchJob, BatchRequest, BatchResult, ClaudeRequest, ClaudeResponse, TaskType } from './types';

// =============================================================================
// JOB STORE (Replace with DB in production)
// =============================================================================

const jobStore: Map<string, BatchJob> = new Map();
const pendingRequests: BatchRequest[] = [];

// Process pending requests every 30 seconds (configurable)
const BATCH_INTERVAL_MS = 30 * 1000;
let batchProcessorRunning = false;

// =============================================================================
// JOB MANAGEMENT
// =============================================================================

/**
 * Create a new batch job
 */
export function createJob(
  requests: BatchRequest[],
  metadata?: {
    userId?: string;
    organizationId?: string;
    taskType?: TaskType;
  }
): BatchJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const job: BatchJob = {
    id,
    status: 'pending',
    requests,
    createdAt: new Date(),
    ...metadata,
  };

  jobStore.set(id, job);

  console.log(`[QUAD Batch] Created job ${id} with ${requests.length} requests`);

  return job;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): BatchJob | undefined {
  return jobStore.get(jobId);
}

/**
 * Get all jobs for a user
 */
export function getUserJobs(userId: string): BatchJob[] {
  return Array.from(jobStore.values()).filter(
    (job) => (job as BatchJob & { userId?: string }).userId === userId
  );
}

/**
 * Queue a single request for batch processing
 * Returns job URL immediately
 */
export function queueForBatch(
  request: ClaudeRequest,
  options?: {
    userId?: string;
    organizationId?: string;
    notifyVia?: ('email' | 'slack' | 'push')[];
  }
): {
  jobId: string;
  jobUrl: string;
  estimatedTime: string;
  message: string;
} {
  const customId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const batchRequest: BatchRequest = {
    customId,
    request,
  };

  // Add to pending queue
  pendingRequests.push(batchRequest);

  // Create a job for this request
  const job = createJob([batchRequest], {
    userId: options?.userId,
    organizationId: options?.organizationId,
    taskType: request.taskType,
  });

  // Start batch processor if not running
  if (!batchProcessorRunning) {
    startBatchProcessor();
  }

  return {
    jobId: job.id,
    jobUrl: `/api/jobs/${job.id}`,
    estimatedTime: '3-5 minutes',
    message: 'Your request has been queued for processing. We\'ll notify you when it\'s ready.',
  };
}

// =============================================================================
// BATCH PROCESSOR
// =============================================================================

/**
 * Start the background batch processor
 */
export function startBatchProcessor(): void {
  if (batchProcessorRunning) return;

  batchProcessorRunning = true;
  console.log('[QUAD Batch] Starting batch processor');

  // Process pending requests periodically
  const processInterval = setInterval(async () => {
    if (pendingRequests.length > 0) {
      await processBatch();
    }
  }, BATCH_INTERVAL_MS);

  // Allow cleanup
  process.on('SIGTERM', () => {
    clearInterval(processInterval);
    batchProcessorRunning = false;
  });
}

/**
 * Process pending batch requests
 */
async function processBatch(): Promise<void> {
  if (pendingRequests.length === 0) return;

  // Take up to 100 requests (Anthropic batch limit)
  const batchSize = Math.min(pendingRequests.length, 100);
  const batch = pendingRequests.splice(0, batchSize);

  console.log(`[QUAD Batch] Processing ${batch.length} requests`);

  // Find all jobs that have these requests
  const affectedJobs = new Set<string>();

  for (const [jobId, job] of jobStore.entries()) {
    if (job.status === 'pending') {
      for (const req of job.requests) {
        if (batch.some((b) => b.customId === req.customId)) {
          affectedJobs.add(jobId);
          break;
        }
      }
    }
  }

  // Update job statuses
  for (const jobId of affectedJobs) {
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'processing';
      jobStore.set(jobId, job);
    }
  }

  try {
    // TODO: Call actual Anthropic Batch API here
    // For now, simulate processing
    const results = await simulateBatchProcessing(batch);

    // Update jobs with results
    for (const jobId of affectedJobs) {
      const job = jobStore.get(jobId);
      if (job) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.results = results.filter((r) =>
          job.requests.some((req) => req.customId === r.customId)
        );
        jobStore.set(jobId, job);

        console.log(`[QUAD Batch] Job ${jobId} completed`);

        // TODO: Send notifications
        // await sendJobNotification(job);
      }
    }
  } catch (error) {
    console.error('[QUAD Batch] Processing error:', error);

    // Mark jobs as failed
    for (const jobId of affectedJobs) {
      const job = jobStore.get(jobId);
      if (job) {
        job.status = 'failed';
        jobStore.set(jobId, job);
      }
    }
  }
}

/**
 * Simulate batch processing (replace with real API call)
 */
async function simulateBatchProcessing(
  batch: BatchRequest[]
): Promise<BatchResult[]> {
  // Simulate 2-5 second processing time
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

  return batch.map((req) => ({
    customId: req.customId,
    response: {
      content: `[Simulated response for ${req.request.taskType}]\n\nThis is a placeholder response. In production, this would be the actual Claude API response.`,
      model: 'claude-sonnet-4-20250514',
      usage: {
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        estimatedCost: 0.0105, // Batch rate
      },
      cached: false,
      batchId: `batch_${Date.now()}`,
    },
  }));
}

// =============================================================================
// JOB STATUS API HELPERS
// =============================================================================

/**
 * Get job status response for API
 */
export function getJobStatusResponse(jobId: string): {
  found: boolean;
  status?: string;
  progress?: number;
  estimatedRemaining?: string;
  results?: BatchResult[];
  error?: string;
} {
  const job = getJob(jobId);

  if (!job) {
    return { found: false, error: 'Job not found' };
  }

  switch (job.status) {
    case 'pending':
      return {
        found: true,
        status: 'pending',
        progress: 0,
        estimatedRemaining: '3-5 minutes',
      };

    case 'processing':
      return {
        found: true,
        status: 'processing',
        progress: 50,
        estimatedRemaining: '1-3 minutes',
      };

    case 'completed':
      return {
        found: true,
        status: 'completed',
        progress: 100,
        results: job.results,
      };

    case 'failed':
      return {
        found: true,
        status: 'failed',
        error: 'Job processing failed. Please try again.',
      };

    default:
      return { found: true, status: job.status };
  }
}

// =============================================================================
// NOTIFICATION HELPERS (TO BE IMPLEMENTED)
// =============================================================================

/**
 * Send job completion notification
 */
async function sendJobNotification(job: BatchJob): Promise<void> {
  // TODO: Implement notification sending
  // - Email via Resend
  // - Slack webhook
  // - Push notification via FCM/APNs

  console.log(`[QUAD Batch] Would send notification for job ${job.id}`);
}

// =============================================================================
// BATCH STATISTICS
// =============================================================================

interface BatchStats {
  totalJobs: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number; // ms
  costSavings: number; // USD saved via batch (50% discount)
}

/**
 * Get batch processing statistics
 */
export function getBatchStats(): BatchStats {
  const jobs = Array.from(jobStore.values());

  let totalProcessingTime = 0;
  let completedCount = 0;
  let totalCost = 0;

  const stats: BatchStats = {
    totalJobs: jobs.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    averageProcessingTime: 0,
    costSavings: 0,
  };

  for (const job of jobs) {
    switch (job.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'processing':
        stats.processing++;
        break;
      case 'completed':
        stats.completed++;
        if (job.completedAt) {
          totalProcessingTime += job.completedAt.getTime() - job.createdAt.getTime();
          completedCount++;
        }
        // Calculate cost from results
        if (job.results) {
          for (const result of job.results) {
            if (result.response) {
              totalCost += result.response.usage.estimatedCost;
            }
          }
        }
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  }

  if (completedCount > 0) {
    stats.averageProcessingTime = totalProcessingTime / completedCount;
  }

  // Batch saves 50% - so savings = cost (what we paid = 50%, what we would have paid = 100%)
  stats.costSavings = totalCost; // We saved an equal amount to what we paid

  return stats;
}

/**
 * Clean up old completed/failed jobs (for memory management)
 */
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  let cleaned = 0;

  for (const [jobId, job] of jobStore.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      job.createdAt.getTime() < cutoff
    ) {
      jobStore.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[QUAD Batch] Cleaned up ${cleaned} old jobs`);
  }

  return cleaned;
}
