"use client";

import { useState } from "react";
import PageNavigation from "@/components/PageNavigation";

type Role = "senior_director" | "director" | "tech_lead" | "developer";

// Mock data with velocity statistics
const directorsData = [
  { name: "Sarah Chen", projects: 4, onTrack: 3, atRisk: 1, completion: 78, velocity: 45 },
  { name: "Michael Park", projects: 3, onTrack: 2, atRisk: 1, completion: 65, velocity: 32 },
  { name: "Priya Sharma", projects: 5, onTrack: 4, atRisk: 1, completion: 82, velocity: 48 },
  { name: "James Wilson", projects: 2, onTrack: 2, atRisk: 0, completion: 91, velocity: 42 },
];

// Portfolio-level statistics
const portfolioStats = {
  totalProjects: 47,
  onTrack: 38,
  atRisk: 7,
  delayed: 2,
  avgVelocity: 41.75, // Mean (μ)
  stdDeviation: 6.29,  // Standard Deviation (σ)
  healthScore: 81,     // Portfolio health score (0-100)
};

// Velocity distribution data for histogram (pts/sprint across all teams)
const velocityDistribution = [
  { range: "25-30", count: 2, teams: ["Team Alpha"] },
  { range: "31-35", count: 3, teams: ["Team Beta", "Team Gamma"] },
  { range: "36-40", count: 5, teams: ["Team Delta", "Team Epsilon"] },
  { range: "41-45", count: 8, teams: ["Team Zeta", "Team Eta", "Team Theta"] },
  { range: "46-50", count: 4, teams: ["Team Iota", "Team Kappa"] },
  { range: "51-55", count: 2, teams: ["Team Lambda"] },
];

const projectsData = [
  { name: "NutriNine Mobile App", status: "On Track", completion: 92, cycle: 3, lead: "Alex Kumar" },
  { name: "E-Commerce Platform", status: "At Risk", completion: 58, cycle: 2, lead: "Maya Patel" },
  { name: "Analytics Dashboard", status: "On Track", completion: 75, cycle: 4, lead: "David Lee" },
  { name: "Customer Portal", status: "On Track", completion: 88, cycle: 3, lead: "Emma Roberts" },
];

const tasksData = [
  { id: "TASK-142", title: "Implement login API endpoint", status: "In Progress", priority: "High", dueDate: "Jan 3" },
  { id: "TASK-156", title: "Write unit tests for AuthService", status: "Ready", priority: "Medium", dueDate: "Jan 5" },
  { id: "TASK-163", title: "Fix database connection pooling", status: "In Review", priority: "High", dueDate: "Jan 2" },
  { id: "TASK-171", title: "Update API documentation", status: "Ready", priority: "Low", dueDate: "Jan 8" },
  { id: "TASK-178", title: "Review PR #89 - User settings", status: "In Progress", priority: "Medium", dueDate: "Jan 3" },
];

// Pie chart component (simple CSS-based)
function PieChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const gradientParts = data.map((item, i) => {
    const percent = (item.value / total) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return `${colors[i]} ${start}% ${cumulativePercent}%`;
  }).join(", ");

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full"
        style={{
          background: `conic-gradient(${gradientParts})`,
        }}
      />
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
            <span className="text-sm text-slate-300">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Health Gauge component (CSS-based semi-circle gauge)
function HealthGauge({ score, label }: { score: number; label: string }) {
  // Score 0-100 maps to 0-180 degrees
  const rotation = (score / 100) * 180;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const colorClass = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Background arc */}
        <div className="absolute w-32 h-32 rounded-full border-8 border-slate-700"
             style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }} />
        {/* Colored arc */}
        <div
          className="absolute w-32 h-32 rounded-full border-8 origin-center transition-transform duration-1000"
          style={{
            borderColor: color,
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
            transform: `rotate(${rotation - 180}deg)`,
            transformOrigin: "center center"
          }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className={`text-2xl font-bold ${colorClass}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
    </div>
  );
}

// Velocity Distribution Histogram
function VelocityHistogram({
  data,
  mean,
  stdDev
}: {
  data: { range: string; count: number }[];
  mean: number;
  stdDev: number;
}) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-3">
      {/* Histogram bars */}
      <div className="flex items-end gap-1 h-24">
        {data.map((item, i) => {
          const height = (item.count / maxCount) * 100;
          const isMeanRange = item.range.includes("41"); // Highlight range containing mean
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t transition-all ${
                  isMeanRange ? "bg-blue-500" : "bg-slate-600"
                }`}
                style={{ height: `${height}%` }}
                title={`${item.count} teams`}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 text-xs text-slate-500">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center truncate">
            {item.range}
          </div>
        ))}
      </div>

      {/* Statistics summary */}
      <div className="flex justify-center gap-6 pt-2 border-t border-slate-700">
        <div className="text-center">
          <span className="text-blue-400 font-mono font-bold">{mean.toFixed(1)}</span>
          <span className="text-xs text-slate-500 ml-1">pts/sprint</span>
          <div className="text-xs text-slate-600">Mean (μ)</div>
        </div>
        <div className="text-center">
          <span className={`font-mono font-bold ${stdDev > 10 ? "text-red-400" : stdDev > 7 ? "text-yellow-400" : "text-green-400"}`}>
            {stdDev.toFixed(2)}
          </span>
          <div className="text-xs text-slate-600">Std Dev (σ)</div>
        </div>
      </div>
    </div>
  );
}

// Stat Card with trend indicator
function StatCard({
  value,
  label,
  subLabel,
  color = "blue",
  showSigma = false,
  sigmaStatus = "good"
}: {
  value: string | number;
  label: string;
  subLabel?: string;
  color?: "blue" | "purple" | "green" | "orange" | "red" | "yellow";
  showSigma?: boolean;
  sigmaStatus?: "good" | "warning" | "danger";
}) {
  const colorClasses = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
  };

  const sigmaColors = {
    good: "bg-green-500/20 text-green-300",
    warning: "bg-yellow-500/20 text-yellow-300",
    danger: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {subLabel && <div className="text-xs text-slate-500 mt-1">{subLabel}</div>}
      {showSigma && (
        <div className={`mt-2 px-2 py-0.5 rounded-full text-xs inline-block ${sigmaColors[sigmaStatus]}`}>
          {sigmaStatus === "good" ? "σ < 7 (Consistent)" : sigmaStatus === "warning" ? "7 < σ < 10" : "σ > 10 (High Variance)"}
        </div>
      )}
    </div>
  );
}

// Senior Director View - Overview of all directors with Portfolio Analytics
function SeniorDirectorView() {
  const pieData = directorsData.map(d => ({ label: d.name, value: d.projects }));
  const pieColors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

  const totalOnTrack = directorsData.reduce((sum, d) => sum + d.onTrack, 0);
  const totalAtRisk = directorsData.reduce((sum, d) => sum + d.atRisk, 0);

  // Calculate sigma status for variance indicator
  const sigmaStatus = portfolioStats.stdDeviation < 7 ? "good" : portfolioStats.stdDeviation < 10 ? "warning" : "danger";

  // Sort directors by velocity for ranking
  const sortedDirectors = [...directorsData].sort((a, b) => b.velocity - a.velocity);
  const maxVelocity = Math.max(...directorsData.map(d => d.velocity));

  return (
    <>
      {/* Portfolio Analytics Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Portfolio Analytics
              <span className="text-sm font-normal text-slate-400">| Senior Director View</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Statistical overview across all {directorsData.length} directors and {portfolioStats.totalProjects} projects
            </p>
          </div>
          <HealthGauge score={portfolioStats.healthScore} label="Portfolio Health" />
        </div>
      </div>

      {/* Key Metrics - 6 Cards */}
      <div className="grid md:grid-cols-6 gap-4 mb-8">
        <StatCard value={directorsData.length} label="Directors" color="blue" />
        <StatCard value={portfolioStats.totalProjects} label="Projects" color="purple" />
        <StatCard value={portfolioStats.onTrack} label="On Track" color="green" />
        <StatCard value={portfolioStats.atRisk} label="At Risk" color="orange" />
        <StatCard value={portfolioStats.avgVelocity.toFixed(1)} label="Avg Velocity" subLabel="pts/sprint (μ)" color="blue" />
        <StatCard
          value={portfolioStats.stdDeviation.toFixed(2)}
          label="Std Deviation"
          subLabel="(σ)"
          color={sigmaStatus === "good" ? "green" : sigmaStatus === "warning" ? "yellow" : "red"}
          showSigma
          sigmaStatus={sigmaStatus}
        />
      </div>

      {/* Velocity Distribution + Directors Ranking */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            Velocity Distribution
            <span className="text-xs text-slate-500 font-normal">(pts/sprint across teams)</span>
          </h3>
          <VelocityHistogram
            data={velocityDistribution}
            mean={portfolioStats.avgVelocity}
            stdDev={portfolioStats.stdDeviation}
          />
          <p className="text-xs text-slate-500 mt-4">
            A low σ (standard deviation) indicates consistent performance across teams.
            High σ may indicate training needs or resource imbalances.
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Directors by Velocity</h3>
          <div className="space-y-3">
            {sortedDirectors.map((director, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-300" :
                  i === 1 ? "bg-slate-400/20 text-slate-300" :
                  i === 2 ? "bg-orange-600/20 text-orange-400" :
                  "bg-slate-700 text-slate-400"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white font-medium">{director.name}</span>
                    <span className="text-blue-300 font-mono">{director.velocity} pts</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        director.velocity >= 45 ? "bg-green-500" :
                        director.velocity >= 38 ? "bg-blue-500" :
                        "bg-yellow-500"
                      }`}
                      style={{ width: `${(director.velocity / maxVelocity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Distribution + Overall Status */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Projects by Director</h3>
          <PieChart data={pieData} colors={pieColors} />
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Project Status Distribution</h3>
          <PieChart
            data={[
              { label: "On Track", value: portfolioStats.onTrack },
              { label: "At Risk", value: portfolioStats.atRisk },
              { label: "Delayed", value: portfolioStats.delayed },
            ]}
            colors={["#22c55e", "#f97316", "#ef4444"]}
          />
        </div>
      </div>

      {/* Directors Table with Velocity */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="font-bold text-white mb-4">Directors Performance Overview</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
              <th className="pb-3">Director</th>
              <th className="pb-3 text-center">Projects</th>
              <th className="pb-3 text-center">On Track</th>
              <th className="pb-3 text-center">At Risk</th>
              <th className="pb-3 text-center">Velocity</th>
              <th className="pb-3 text-center">Completion</th>
            </tr>
          </thead>
          <tbody>
            {directorsData.map((director, i) => (
              <tr key={i} className="border-b border-slate-700/50">
                <td className="py-3 text-white font-medium">{director.name}</td>
                <td className="py-3 text-center text-blue-300">{director.projects}</td>
                <td className="py-3 text-center text-green-400">{director.onTrack}</td>
                <td className="py-3 text-center text-orange-400">{director.atRisk}</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    director.velocity >= 45 ? "bg-green-500/20 text-green-300" :
                    director.velocity >= 38 ? "bg-blue-500/20 text-blue-300" :
                    "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {director.velocity} pts
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${director.completion >= 80 ? "bg-green-500" : director.completion >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${director.completion}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-300">{director.completion}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Director View - Projects under this director
function DirectorView() {
  const statusCounts = {
    onTrack: projectsData.filter(p => p.status === "On Track").length,
    atRisk: projectsData.filter(p => p.status === "At Risk").length,
  };

  return (
    <>
      {/* Director Header */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Director: Priya Sharma</h2>
            <p className="text-sm text-slate-400">Engineering Division | {projectsData.length} Active Projects</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{statusCounts.onTrack}</div>
              <div className="text-xs text-slate-500">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{statusCounts.atRisk}</div>
              <div className="text-xs text-slate-500">At Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Pie Chart */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Project Status Distribution</h3>
          <PieChart
            data={[
              { label: "On Track", value: statusCounts.onTrack },
              { label: "At Risk", value: statusCounts.atRisk },
            ]}
            colors={["#22c55e", "#f97316"]}
          />
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Cycle Progress</h3>
          <div className="space-y-4">
            {projectsData.map((project, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{project.name}</span>
                  <span className="text-slate-400">Cycle {project.cycle}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${project.completion >= 80 ? "bg-green-500" : project.completion >= 60 ? "bg-yellow-500" : "bg-orange-500"}`}
                    style={{ width: `${project.completion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="font-bold text-white mb-4">Projects Overview</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
              <th className="pb-3">Project</th>
              <th className="pb-3">Tech Lead</th>
              <th className="pb-3 text-center">Cycle</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-center">Completion</th>
            </tr>
          </thead>
          <tbody>
            {projectsData.map((project, i) => (
              <tr key={i} className="border-b border-slate-700/50">
                <td className="py-3 text-white font-medium">{project.name}</td>
                <td className="py-3 text-slate-300">{project.lead}</td>
                <td className="py-3 text-center text-blue-300">{project.cycle}</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.status === "On Track" ? "bg-green-500/20 text-green-300" : "bg-orange-500/20 text-orange-300"
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${project.completion >= 80 ? "bg-green-500" : project.completion >= 60 ? "bg-yellow-500" : "bg-orange-500"}`}
                        style={{ width: `${project.completion}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-300">{project.completion}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Tech Lead View - Single project detail (original demo content)
function TechLeadView() {
  return (
    <>
      {/* Dashboard Header */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Project: NutriNine Mobile App</h2>
            <p className="text-sm text-slate-400">Cycle 3 | Week 2 of 4 | Flow Rate: 8.5 pts/day</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">92%</div>
              <div className="text-xs text-slate-500">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">14</div>
              <div className="text-xs text-slate-500">Days Left</div>
            </div>
          </div>
        </div>
      </div>

      {/* Circle Status */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { name: "Management", status: "Active", agents: { active: 3, total: 4 }, tasks: { done: 12, total: 15 }, color: "blue" },
          { name: "Development", status: "Active", agents: { active: 4, total: 4 }, tasks: { done: 28, total: 35 }, color: "green" },
          { name: "QA", status: "Active", agents: { active: 3, total: 4 }, tasks: { done: 45, total: 52 }, color: "yellow" },
          { name: "Infrastructure", status: "Idle", agents: { active: 2, total: 4 }, tasks: { done: 8, total: 8 }, color: "purple" },
        ].map((circle) => (
          <div key={circle.name} className={`bg-${circle.color}-500/10 rounded-xl p-4 border border-${circle.color}-500/20`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">{circle.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                circle.status === "Active" ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-400"
              }`}>
                {circle.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Agents</span>
                <span className="text-white">{circle.agents.active}/{circle.agents.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tasks</span>
                <span className="text-white">{circle.tasks.done}/{circle.tasks.total}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${circle.color}-500`}
                  style={{ width: `${(circle.tasks.done / circle.tasks.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Activity + Human Gates */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Recent Agent Activity</h3>
          <div className="space-y-3">
            {[
              { agent: "Story Agent", action: "Expanded user story US-142", time: "2 min ago", status: "success" },
              { agent: "Dev Agent (API)", action: "Scaffolded AuthController", time: "5 min ago", status: "success" },
              { agent: "UI Test Agent", action: "Running login flow tests...", time: "Now", status: "running" },
              { agent: "Code Review Agent", action: "Reviewed PR #89", time: "12 min ago", status: "success" },
              { agent: "Deploy Agent", action: "Deployed to DEV", time: "15 min ago", status: "success" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-900/30 rounded-lg p-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === "success" ? "bg-green-400" :
                  item.status === "running" ? "bg-blue-400 animate-pulse" : "bg-slate-400"
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-white text-sm">{item.agent}</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4">Pending Human Gates</h3>
          <div className="space-y-3">
            {[
              { gate: "Code Review", item: "PR #91 - Add medication reminder", by: "Tech Lead", urgent: true },
              { gate: "Story Approval", item: "US-145 - Push notifications", by: "BA", urgent: false },
              { gate: "QA Sign-off", item: "Sprint 3 - Health dashboard", by: "QA Lead", urgent: false },
            ].map((item, i) => (
              <div key={i} className={`rounded-lg p-3 border ${
                item.urgent ? "bg-orange-500/10 border-orange-500/20" : "bg-blue-500/10 border-blue-500/20"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${item.urgent ? "text-orange-300" : "text-blue-300"}`}>
                    {item.gate}
                  </span>
                  {item.urgent && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">Urgent</span>
                  )}
                </div>
                <p className="text-sm text-white">{item.item}</p>
                <p className="text-xs text-slate-500">Waiting for: {item.by}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cycle Queue */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-8">
        <h3 className="font-bold text-white mb-4">Cycle Queue (Current Cycle)</h3>
        <div className="grid grid-cols-5 gap-4">
          {[
            { status: "Done", count: 18, color: "green" },
            { status: "In Progress", count: 7, color: "blue" },
            { status: "In Review", count: 4, color: "purple" },
            { status: "Ready", count: 8, color: "yellow" },
            { status: "Blocked", count: 2, color: "red" },
          ].map((col) => (
            <div key={col.status} className="text-center">
              <div className={`text-3xl font-bold text-${col.color}-400 mb-1`}>{col.count}</div>
              <div className="text-sm text-slate-400">{col.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Documents */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="font-bold text-white mb-4">Recent Flow Documents</h3>
        <div className="space-y-2">
          {[
            { id: "FLOW_AUTH_001", name: "User Authentication Flow", status: "Active", tests: 24, coverage: 100 },
            { id: "FLOW_HEALTH_002", name: "Health Report Upload", status: "Active", tests: 18, coverage: 94 },
            { id: "FLOW_MEAL_003", name: "Meal Planning", status: "Draft", tests: 0, coverage: 0 },
            { id: "FLOW_NOTIF_004", name: "Push Notifications", status: "In Review", tests: 12, coverage: 75 },
          ].map((flow) => (
            <div key={flow.id} className="flex items-center justify-between bg-slate-900/30 rounded-lg p-3">
              <div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-300">{flow.id}</code>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    flow.status === "Active" ? "bg-green-500/20 text-green-300" :
                    flow.status === "Draft" ? "bg-slate-500/20 text-slate-400" :
                    "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {flow.status}
                  </span>
                </div>
                <p className="text-sm text-white mt-1">{flow.name}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white">{flow.tests} tests</div>
                <div className={`text-xs ${flow.coverage >= 90 ? "text-green-400" : flow.coverage > 0 ? "text-yellow-400" : "text-slate-500"}`}>
                  {flow.coverage}% coverage
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Developer/QA View - Personal tasks
function DeveloperView() {
  const tasksByStatus = {
    inProgress: tasksData.filter(t => t.status === "In Progress").length,
    ready: tasksData.filter(t => t.status === "Ready").length,
    inReview: tasksData.filter(t => t.status === "In Review").length,
  };

  return (
    <>
      {/* Developer Header */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xl">
              AK
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Alex Kumar</h2>
              <p className="text-sm text-slate-400">Full Stack Developer | Circle 2 (Development)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{tasksData.length}</div>
              <div className="text-xs text-slate-500">My Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
          <div className="text-3xl font-bold text-blue-400">{tasksByStatus.inProgress}</div>
          <div className="text-sm text-slate-400">In Progress</div>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20 text-center">
          <div className="text-3xl font-bold text-yellow-400">{tasksByStatus.ready}</div>
          <div className="text-sm text-slate-400">Ready to Start</div>
        </div>
        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
          <div className="text-3xl font-bold text-purple-400">{tasksByStatus.inReview}</div>
          <div className="text-sm text-slate-400">In Review</div>
        </div>
      </div>

      {/* My Tasks Table */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-8">
        <h3 className="font-bold text-white mb-4">My Assigned Tasks</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
              <th className="pb-3">Task ID</th>
              <th className="pb-3">Title</th>
              <th className="pb-3 text-center">Priority</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-center">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasksData.map((task, i) => (
              <tr key={i} className="border-b border-slate-700/50">
                <td className="py-3">
                  <code className="text-xs text-blue-300">{task.id}</code>
                </td>
                <td className="py-3 text-white">{task.title}</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.priority === "High" ? "bg-red-500/20 text-red-300" :
                    task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === "In Progress" ? "bg-blue-500/20 text-blue-300" :
                    task.status === "Ready" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-purple-500/20 text-purple-300"
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="py-3 text-center text-slate-400 text-sm">{task.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="font-bold text-white mb-4">My Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "Committed code to branch feature/auth-api", time: "10 min ago", type: "commit" },
            { action: "Created PR #92 - Login API endpoint", time: "25 min ago", type: "pr" },
            { action: "Completed TASK-138 - Database schema update", time: "1 hour ago", type: "task" },
            { action: "Added comment on PR #89", time: "2 hours ago", type: "comment" },
            { action: "Started TASK-142 - Implement login API", time: "3 hours ago", type: "task" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-900/30 rounded-lg p-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                item.type === "commit" ? "bg-green-500/20 text-green-300" :
                item.type === "pr" ? "bg-purple-500/20 text-purple-300" :
                item.type === "task" ? "bg-blue-500/20 text-blue-300" :
                "bg-slate-500/20 text-slate-400"
              }`}>
                {item.type === "commit" ? "↑" : item.type === "pr" ? "⎇" : item.type === "task" ? "✓" : "💬"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{item.action}</p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function QUADDemo() {
  const [selectedRole, setSelectedRole] = useState<Role>("senior_director");

  const roles = [
    { value: "senior_director", label: "Senior Director", icon: "👔" },
    { value: "director", label: "Director", icon: "📊" },
    { value: "tech_lead", label: "Tech Lead", icon: "⚙️" },
    { value: "developer", label: "Developer / QA", icon: "💻" },
  ];

  const renderView = () => {
    switch (selectedRole) {
      case "senior_director":
        return <SeniorDirectorView />;
      case "director":
        return <DirectorView />;
      case "tech_lead":
        return <TechLeadView />;
      case "developer":
        return <DeveloperView />;
      default:
        return <TechLeadView />;
    }
  };

  return (
    <div className="min-h-screen text-white">
      <PageNavigation />
      <div className="max-w-6xl mx-auto p-8">
        {/* Header with Role Dropdown */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌐</span>
              <h1 className="text-4xl font-bold">QUAD Dashboard Demo</h1>
            </div>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-center">
            Select a role from the dropdown to see different dashboard views
          </p>
        </div>

        {/* Dynamic View based on Role */}
        {renderView()}

        {/* Info Box */}
        <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center mt-8">
          <h3 className="font-bold text-white mb-2">This is a Demo</h3>
          <p className="text-slate-400 text-sm">
            This dashboard shows what a real QUAD implementation might look like.
            All data is simulated for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
