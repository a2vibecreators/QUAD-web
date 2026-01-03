/**
 * GET /api/risks - Get risk factors for a domain
 * POST /api/risks - Create new risk factor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Get risk factors
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    const status = searchParams.get('status'); // identified, mitigating, resolved, accepted
    const riskLevel = searchParams.get('risk_level'); // low, medium, high, critical

    // Get domains in org
    const orgDomains = await prisma.qUAD_domains.findMany({
      where: { org_id: payload.companyId, is_deleted: false },
      select: { id: true }
    });
    const domainIds = domainId ? [domainId] : orgDomains.map(d => d.id);

    const risks = await prisma.qUAD_risk_factors.findMany({
      where: {
        domain_id: { in: domainIds },
        ...(status && { status }),
        ...(riskLevel && { risk_level: riskLevel })
      },
      orderBy: [{ risk_score: 'desc' }, { created_at: 'desc' }]
    });

    // Get domain names
    const domains = await prisma.qUAD_domains.findMany({
      where: { id: { in: domainIds } },
      select: { id: true, name: true }
    });
    const domainMap = new Map(domains.map(d => [d.id, d.name]));

    const enrichedRisks = risks.map(r => ({
      ...r,
      domain_name: domainMap.get(r.domain_id) || 'Unknown'
    }));

    // Summary stats
    const summary = {
      total: risks.length,
      by_level: {
        critical: risks.filter(r => r.risk_level === 'critical').length,
        high: risks.filter(r => r.risk_level === 'high').length,
        medium: risks.filter(r => r.risk_level === 'medium').length,
        low: risks.filter(r => r.risk_level === 'low').length
      },
      by_status: {
        identified: risks.filter(r => r.status === 'identified').length,
        mitigating: risks.filter(r => r.status === 'mitigating').length,
        resolved: risks.filter(r => r.status === 'resolved').length,
        accepted: risks.filter(r => r.status === 'accepted').length
      },
      avg_score: risks.length > 0
        ? Math.round(risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length * 10) / 10
        : 0
    };

    return NextResponse.json({
      risks: enrichedRisks,
      summary
    });

  } catch (error) {
    console.error('Get risks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create risk factor
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      domain_id,
      risk_type,
      risk_name,
      description,
      probability,
      impact,
      mitigation_plan,
      owner_user_id,
      review_due_at
    } = body;

    if (!domain_id || !risk_type || !risk_name) {
      return NextResponse.json(
        { error: 'domain_id, risk_type, and risk_name are required' },
        { status: 400 }
      );
    }

    // Validate domain belongs to org
    const domain = await prisma.qUAD_domains.findFirst({
      where: { id: domain_id, org_id: payload.companyId }
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Validate risk type
    const validTypes = ['schedule', 'scope', 'technical', 'resource', 'external'];
    if (!validTypes.includes(risk_type)) {
      return NextResponse.json(
        { error: `Invalid risk_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate probability and impact (1-5)
    const prob = probability || 3;
    const imp = impact || 3;
    if (prob < 1 || prob > 5 || imp < 1 || imp > 5) {
      return NextResponse.json(
        { error: 'probability and impact must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Calculate risk score and level
    const riskScore = prob * imp;
    let riskLevel: string;
    if (riskScore >= 20) riskLevel = 'critical';
    else if (riskScore >= 12) riskLevel = 'high';
    else if (riskScore >= 6) riskLevel = 'medium';
    else riskLevel = 'low';

    const risk = await prisma.qUAD_risk_factors.create({
      data: {
        domain_id,
        risk_type,
        risk_name,
        description,
        probability: prob,
        impact: imp,
        risk_score: riskScore,
        risk_level: riskLevel,
        mitigation_plan,
        owner_user_id,
        review_due_at: review_due_at ? new Date(review_due_at) : null
      }
    });

    return NextResponse.json({ risk }, { status: 201 });

  } catch (error) {
    console.error('Create risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
