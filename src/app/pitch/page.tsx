"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

// Industry benchmarks (typical before QUAD)
const industryBenchmarks = {
  avgProjectDelay: 45, // % of projects delayed
  avgBudgetOverrun: 35, // % over budget
  avgReworkRate: 30, // % time spent on rework
  avgDocOutdated: 70, // % documentation outdated
  avgAgentUsage: 0, // AI usage %
  avgCycleTime: 21, // days per iteration
};

// QUAD expected improvements
const quadImprovements = {
  projectDelay: 12, // down to 12%
  budgetOverrun: 8, // down to 8%
  reworkRate: 5, // down to 5%
  docOutdated: 5, // down to 5%
  agentUsage: 80, // up to 80%
  cycleTime: 7, // down to 7 days
};

type CompanySize = "startup" | "medium" | "enterprise";

const companySizes = {
  startup: { label: "Startup", devs: 10, salary: 120000, projects: 2 },
  medium: { label: "Medium (1K-10K)", devs: 50, salary: 130000, projects: 8 },
  enterprise: { label: "Enterprise (10K+)", devs: 200, salary: 140000, projects: 30 },
};

// Metric comparison card
function MetricCard({
  label,
  before,
  after,
  unit = "%",
  improvement,
  isGood = true, // true if lower is better
}: {
  label: string;
  before: number;
  after: number;
  unit?: string;
  improvement: string;
  isGood?: boolean;
}) {
  const beforeColor = isGood ? "text-red-400" : "text-yellow-400";
  const afterColor = isGood ? "text-green-400" : "text-green-400";

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="text-sm text-slate-400 mb-3">{label}</div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">BEFORE</div>
          <div className={`text-2xl font-bold ${beforeColor}`}>
            {before}{unit}
          </div>
        </div>
        <div className="text-2xl text-slate-600">→</div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">AFTER</div>
          <div className={`text-2xl font-bold ${afterColor}`}>
            {after}{unit}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
          {improvement}
        </span>
      </div>
    </div>
  );
}

// ROI Calculator
function ROICalculator({ companySize }: { companySize: CompanySize }) {
  const company = companySizes[companySize];

  // Calculations
  const annualDevCost = company.devs * company.salary;
  const reworkCostBefore = annualDevCost * (industryBenchmarks.avgReworkRate / 100);
  const reworkCostAfter = annualDevCost * (quadImprovements.reworkRate / 100);
  const reworkSavings = reworkCostBefore - reworkCostAfter;

  const delayCostBefore = annualDevCost * (industryBenchmarks.avgProjectDelay / 100) * 0.5;
  const delayCostAfter = annualDevCost * (quadImprovements.projectDelay / 100) * 0.5;
  const delaySavings = delayCostBefore - delayCostAfter;

  const agentProductivityGain = annualDevCost * 0.20; // 20% productivity boost from AI

  const totalSavings = reworkSavings + delaySavings + agentProductivityGain;
  const savingsPercent = ((totalSavings / annualDevCost) * 100).toFixed(0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        ROI Calculator
        <span className="text-sm font-normal text-slate-400">| {company.label}</span>
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Summary */}
        <div className="space-y-3">
          <div className="text-sm text-slate-400">Company Profile</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Developers</span>
              <span className="text-white font-mono">{company.devs}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Avg Salary</span>
              <span className="text-white font-mono">{formatCurrency(company.salary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Active Projects</span>
              <span className="text-white font-mono">{company.projects}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
              <span className="text-slate-400">Annual Dev Cost</span>
              <span className="text-blue-300 font-mono font-bold">{formatCurrency(annualDevCost)}</span>
            </div>
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="space-y-3">
          <div className="text-sm text-slate-400">Annual Savings with QUAD</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rework Reduction</span>
              <span className="text-green-400 font-mono">+{formatCurrency(reworkSavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Delay Reduction</span>
              <span className="text-green-400 font-mono">+{formatCurrency(delaySavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">AI Productivity Boost</span>
              <span className="text-green-400 font-mono">+{formatCurrency(agentProductivityGain)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
              <span className="text-white font-bold">Total Annual Savings</span>
              <span className="text-green-400 font-mono font-bold text-lg">{formatCurrency(totalSavings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Savings Number */}
      <div className="mt-6 text-center bg-slate-900/50 rounded-lg p-4">
        <div className="text-6xl font-bold text-green-400">{savingsPercent}%</div>
        <div className="text-slate-400 mt-2">Projected Cost Reduction</div>
        <div className="text-xs text-slate-500 mt-1">Based on industry benchmarks vs QUAD methodology</div>
      </div>
    </div>
  );
}

export default function QUADPitch() {
  const [companySize, setCompanySize] = useState<CompanySize>("medium");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Transform Your Development with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              QUAD
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-6">
            See how companies achieve <span className="text-green-400 font-bold">4X efficiency</span> by
            adopting the QUAD methodology with AI-powered agents.
          </p>

          {/* 4-4-4 Principle Hero Banner */}
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30">
            <div className="text-lg font-semibold text-emerald-300 mb-3">The 4-4-4 Principle</div>
            <div className="flex justify-center items-center gap-6 mb-3">
              <div className="text-center">
                <div className="text-4xl font-black text-emerald-400">4</div>
                <div className="text-xs text-slate-400">hours/day</div>
              </div>
              <div className="text-2xl text-slate-600">×</div>
              <div className="text-center">
                <div className="text-4xl font-black text-emerald-400">4</div>
                <div className="text-xs text-slate-400">days/week</div>
              </div>
              <div className="text-2xl text-slate-600">=</div>
              <div className="text-center">
                <div className="text-4xl font-black text-emerald-400">4X</div>
                <div className="text-xs text-slate-400">efficiency</div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Work smarter, not longer. 16 focused hours beat 40 distracted hours.
            </p>
          </div>
        </div>

        {/* Company Size Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {Object.entries(companySizes).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setCompanySize(key as CompanySize)}
              className={`px-6 py-3 rounded-lg transition-all ${
                companySize === key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* The Problem */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-2">
            The Problem: Industry Reality
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
              <div className="text-4xl font-bold text-red-400">{industryBenchmarks.avgProjectDelay}%</div>
              <div className="text-slate-400 mt-2">Projects Delayed</div>
              <p className="text-xs text-slate-500 mt-2">
                Nearly half of software projects miss their deadlines
              </p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
              <div className="text-4xl font-bold text-red-400">{industryBenchmarks.avgReworkRate}%</div>
              <div className="text-slate-400 mt-2">Time on Rework</div>
              <p className="text-xs text-slate-500 mt-2">
                Developers spend 1/3 of time fixing bugs and redoing work
              </p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
              <div className="text-4xl font-bold text-red-400">{industryBenchmarks.avgDocOutdated}%</div>
              <div className="text-slate-400 mt-2">Docs Outdated</div>
              <p className="text-xs text-slate-500 mt-2">
                Most documentation becomes stale within weeks
              </p>
            </div>
          </div>
        </div>

        {/* Before vs After */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Before vs After QUAD</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <MetricCard
              label="Project Delays"
              before={industryBenchmarks.avgProjectDelay}
              after={quadImprovements.projectDelay}
              improvement="73% reduction"
            />
            <MetricCard
              label="Budget Overruns"
              before={industryBenchmarks.avgBudgetOverrun}
              after={quadImprovements.budgetOverrun}
              improvement="77% reduction"
            />
            <MetricCard
              label="Rework Rate"
              before={industryBenchmarks.avgReworkRate}
              after={quadImprovements.reworkRate}
              improvement="83% reduction"
            />
            <MetricCard
              label="Documentation Drift"
              before={industryBenchmarks.avgDocOutdated}
              after={quadImprovements.docOutdated}
              improvement="93% reduction"
            />
            <MetricCard
              label="AI Agent Usage"
              before={industryBenchmarks.avgAgentUsage}
              after={quadImprovements.agentUsage}
              improvement="80% automation"
              isGood={false}
            />
            <MetricCard
              label="Cycle Time"
              before={industryBenchmarks.avgCycleTime}
              after={quadImprovements.cycleTime}
              unit=" days"
              improvement="67% faster"
            />
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mb-12">
          <ROICalculator key={companySize} companySize={companySize} />
        </div>

        {/* How QUAD Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How QUAD Achieves This</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                num: "1",
                title: "4 Circles",
                desc: "Clear separation: Management, Dev, QA, Infrastructure",
                icon: "🔵",
              },
              {
                num: "2",
                title: "AI Agents",
                desc: "Automated story expansion, code gen, testing, deployment",
                icon: "🤖",
              },
              {
                num: "3",
                title: "Docs-First",
                desc: "Flow Documents are the source of truth, always in sync",
                icon: "📋",
              },
              {
                num: "4",
                title: "Human Gates",
                desc: "AI suggests, humans approve - quality at every step",
                icon: "🚦",
              },
            ].map((item) => (
              <div key={item.num} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Honest Considerations (Cons) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
            Honest Considerations
            <span className="text-sm font-normal text-slate-400">| What to expect</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                con: "Learning Curve",
                reality: "New terminology (Cycles, Circles, Flow Documents) requires adjustment",
                mitigation: "2-week onboarding program, start at 0D adoption level",
                icon: "📚",
              },
              {
                con: "Initial Setup Time",
                reality: "Configuration, tool integrations, team structure setup",
                mitigation: "1-3 days with /configure wizard, templates provided",
                icon: "⏱️",
              },
              {
                con: "Documentation Overhead",
                reality: "Docs-first means writing specs before coding",
                mitigation: "AI agents generate 80% of documentation automatically",
                icon: "📝",
              },
              {
                con: "Cultural Resistance",
                reality: "Teams comfortable with Scrum may resist change",
                mitigation: "Gradual adoption: Start at 0D (docs only), add agents over time",
                icon: "🔄",
              },
              {
                con: "AI Trust Issues",
                reality: "Some developers skeptical of AI-generated code",
                mitigation: "Human Gates ensure developers approve ALL changes",
                icon: "🤖",
              },
              {
                con: "Not for Tiny Teams",
                reality: "Overhead may not justify for 2-5 person teams",
                mitigation: "Best ROI with 10+ developers, multiple projects",
                icon: "👥",
              },
            ].map((item, i) => (
              <div key={i} className="bg-yellow-500/5 rounded-xl p-5 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-300 mb-1">{item.con}</h3>
                    <p className="text-sm text-slate-400 mb-2">{item.reality}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓ Mitigation:</span>
                      <span className="text-sm text-slate-300">{item.mitigation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-4">
            We believe in transparency. QUAD isn&apos;t magic - it&apos;s a systematic approach that requires commitment.
          </p>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What Can QUAD Revamp?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "New Product Development",
                desc: "From idea to MVP 3x faster with AI agents handling 80% of boilerplate",
                savings: "70%",
              },
              {
                title: "Legacy System Modernization",
                desc: "Systematic migration with Flow Documents ensuring nothing is missed",
                savings: "60%",
              },
              {
                title: "DevOps Transformation",
                desc: "Automated deployments, monitoring, and incident response",
                savings: "80%",
              },
              {
                title: "Quality Improvement",
                desc: "AI-powered testing catches bugs before they reach production",
                savings: "85%",
              },
              {
                title: "Team Onboarding",
                desc: "New developers productive in days, not weeks, with Docs-First approach",
                savings: "75%",
              },
              {
                title: "Regulatory Compliance",
                desc: "Automated audit trails and compliance checks",
                savings: "90%",
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all">
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{item.desc}</p>
                <div className="text-2xl font-bold text-green-400">{item.savings} savings</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
