/**
 * Health Check Endpoint
 *
 * Used by:
 * - GCP Cloud Run liveness/readiness probes
 * - Monitoring systems (Uptime checks)
 * - Load balancers
 * - Startup tests
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service is unhealthy
 */

import { NextResponse } from 'next/server';
// NOTE: Prisma removed - using stubs until Java backend ready

// TODO: Database health check should be implemented via Java backend

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'ok' | 'fail' | 'slow' | 'skipped';
    memory: 'ok' | 'warning' | 'critical';
  };
  details?: {
    databaseLatencyMs?: number;
    memoryUsedMb?: number;
    memoryTotalMb?: number;
  };
}

const startTime = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const health: HealthStatus = {
    status: 'healthy',
    timestamp,
    uptime,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'skipped', // Database check skipped until Java backend ready
      memory: 'ok',
    },
    details: {},
  };

  // Database check skipped - will use Java backend health endpoint
  console.log('[Health] Database check skipped - using Java backend');
  health.details!.databaseLatencyMs = 0;

  // Check memory usage (Node.js)
  try {
    const memUsage = process.memoryUsage();
    const memUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
    health.details!.memoryUsedMb = memUsedMb;
    health.details!.memoryTotalMb = memTotalMb;

    // Warning if using more than 80% of heap
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memPercent > 90) {
      health.checks.memory = 'critical';
      health.status = 'unhealthy';
    } else if (memPercent > 80) {
      health.checks.memory = 'warning';
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  } catch (error) {
    console.error('Health check: Memory check failed', error);
  }

  // Return appropriate status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
