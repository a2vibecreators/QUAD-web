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
import { prisma } from '@/lib/db';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'ok' | 'fail' | 'slow';
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
      database: 'ok',
      memory: 'ok',
    },
    details: {},
  };

  // Check database connectivity with timeout
  const dbStart = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      ),
    ]);
    const dbLatency = Date.now() - dbStart;
    health.details!.databaseLatencyMs = dbLatency;

    if (dbLatency > 1000) {
      health.checks.database = 'slow';
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = 'fail';
    health.status = 'unhealthy';
    console.error('Health check: Database failed', error);
  }

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
