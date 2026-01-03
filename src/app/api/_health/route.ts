/**
 * Liveness Probe Endpoint
 *
 * Simple endpoint for container orchestrators (Cloud Run, K8s)
 * to check if the process is alive. Does NOT check dependencies.
 *
 * Use /api/health for full health check including database.
 * Use /api/_health for simple liveness (just process is running).
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
