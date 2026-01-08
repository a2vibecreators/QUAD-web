"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Customer Demo Page - Interactive QUAD Platform Demo
 *
 * Features:
 * - Role-based views (Developer, QA, TL, Director, Sr Director)
 * - Interactive ticket detail with GitHub-style diff
 * - Dev ↔ AI conversation for code changes
 * - Real-time notifications
 * - Allocation mismatch warnings
 * - Time saved indicators
 */

// ============================================================================
// REUSABLE CHART COMPONENTS (from /demo/page.tsx)
// ============================================================================

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

// Simulated Chat Window Component
function SimulatedChatWindow({ role }: { role: string }) {
  const [messages, setMessages] = useState<Array<{role: "user" | "ai", message: string}>>([
    { role: "ai", message: "Hello! I'm your QUAD AI assistant. Ask me anything about your organization, projects, or team metrics." }
  ]);
  const [input, setInput] = useState("");

  const simulateResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    // Role-specific responses
    if (role === "senior_director") {
      if (lowerMessage.includes("budget")) {
        return "Total budget is $2.4M across 3 active projects: Customer Portal ($1.2M), Mobile App ($800K), and Data Pipeline ($400K). We're on track with 87% utilization.";
      }
      if (lowerMessage.includes("velocity")) {
        return "Average portfolio velocity is 42 pts/sprint with σ=6.29. Team Zeta leads at 48 pts/sprint, followed by Team Alpha at 41 pts/sprint.";
      }
      if (lowerMessage.includes("allocation")) {
        return "2 team members have allocation warnings: David Kim (130% allocated - 30% over) and Sneha Reddy (150% allocated - 50% over). Would you like me to suggest reassignments?";
      }
      if (lowerMessage.includes("retention")) {
        return "Our retention rate is 94%, up 8% from last quarter. Average tenure is 3.2 years with an eNPS score of +42. We have 4 open positions.";
      }
      return "I can help with budget, velocity, team allocation, retention, or project-level questions. What would you like to know?";
    }

    if (role === "director") {
      if (lowerMessage.includes("project")) {
        return "You're managing 2 projects: Customer Portal (12 team members, 92% velocity) and API Gateway (6 members, 88% velocity). Both are on track.";
      }
      if (lowerMessage.includes("team")) {
        return "Your department has 18 team members: 6 developers, 4 QA engineers, 3 tech leads, 2 product managers, and 3 DevOps engineers.";
      }
      if (lowerMessage.includes("flow") || lowerMessage.includes("ticket")) {
        return "You have 24 active flows: 8 in Automate stage, 7 in Question, 6 in Deliver, and 3 in Understand. 5 flows need your approval.";
      }
      return "I can help with projects, team members, flows, or department metrics. What do you need?";
    }

    if (role === "developer") {
      if (lowerMessage.includes("ticket") || lowerMessage.includes("flow")) {
        return "You have 3 assigned flows: QUAD-1234 (high priority, in Automate), QUAD-1235 (critical, in Deliver), and QUAD-1236 (medium, in Question). Click any ticket above to work on it.";
      }
      if (lowerMessage.includes("code")) {
        return "QUAD-1234 generated 147 lines of code using Claude Opus. AI saved you approximately 4 hours of development time. Review the diff above.";
      }
      if (lowerMessage.includes("review")) {
        return "You have 3 code reviews pending: PR #892 (approved by TL), PR #893 (awaiting your review), and PR #894 (in progress).";
      }
      return "I can help with your tickets, code reviews, or development questions. What do you need?";
    }

    if (role === "qa") {
      if (lowerMessage.includes("test") || lowerMessage.includes("coverage")) {
        return "Current test coverage is 78%: Unit tests (45%), Integration tests (25%), E2E tests (8%). Target is 80% - we need 2% more coverage.";
      }
      if (lowerMessage.includes("bug")) {
        return "Open bugs by severity: 1 Critical, 3 High, 2 Medium, 5 Low. Critical bug is QUAD-1240 (checkout validation failure).";
      }
      if (lowerMessage.includes("queue")) {
        return "You have 12 items in your test queue. 3 are high priority: QUAD-1234 (price filter), QUAD-1235 (checkout fix), and QUAD-1237 (API endpoint).";
      }
      return "I can help with test coverage, bugs, test queue, or quality metrics. What would you like to know?";
    }

    if (role === "tech_lead") {
      if (lowerMessage.includes("sprint")) {
        return "Sprint 4 progress: 75% complete (Day 8 of 10). 3 story points remaining. Burndown is on track. No blockers reported.";
      }
      if (lowerMessage.includes("allocation")) {
        return "2 allocation warnings: David Kim (30% over-allocated) and Sneha Reddy (50% over-allocated). I recommend moving QUAD-1238 and QUAD-1239 to next sprint.";
      }
      if (lowerMessage.includes("pr") || lowerMessage.includes("review")) {
        return "8 open PRs: 3 need your review, 2 are approved and ready to merge, 3 are in progress. Oldest PR waiting for review is #889 (3 days old).";
      }
      if (lowerMessage.includes("blocker")) {
        return "No active blockers reported. Last blocker was resolved 2 days ago (API dependency issue on QUAD-1235).";
      }
      return "I can help with sprint progress, team allocation, PRs, or blockers. What do you need?";
    }

    if (role === "prod_support") {
      if (lowerMessage.includes("incident")) {
        return "3 open incidents: INC-001 (P1, API latency spike - investigating), INC-002 (P2, checkout slow - monitoring), INC-003 (P2, email delay - assigned to Lisa).";
      }
      if (lowerMessage.includes("mttr")) {
        return "Mean Time To Resolution is 45 minutes, down 15% from last week. P1 MTTR: 25 mins, P2 MTTR: 60 mins. Great improvement!";
      }
      if (lowerMessage.includes("sla")) {
        return "SLA compliance is 99.2%, exceeding our 99% target. 2 SLA breaches this month, both due to external API outages.";
      }
      if (lowerMessage.includes("alert")) {
        return "2 active alerts: CPU spike on web-server-03 (non-critical, monitoring) and disk usage at 75% on db-primary (action needed soon).";
      }
      return "I can help with incidents, MTTR, SLA compliance, or system alerts. What's your question?";
    }

    if (role === "infrastructure") {
      if (lowerMessage.includes("uptime")) {
        return "System uptime is 99.97% over the last 30 days. Only 13 minutes of downtime (scheduled maintenance on Dec 15th).";
      }
      if (lowerMessage.includes("deployment") || lowerMessage.includes("deploy")) {
        return "12 deployments this week: 8 to production, 4 to staging. Success rate: 100%. Average deployment time: 8 minutes.";
      }
      if (lowerMessage.includes("cost") || lowerMessage.includes("savings")) {
        return "Cost savings this month: $12K from spot instance optimization ($8K) and storage cleanup ($4K). YTD savings: $142K.";
      }
      if (lowerMessage.includes("resource")) {
        return "Resource utilization: CPU avg 45%, Memory avg 62%, Disk avg 53%. All within optimal range. No scaling needed.";
      }
      return "I can help with uptime, deployments, cost optimization, or resource utilization. What do you need?";
    }

    // Default response
    return "I'm here to help! Try asking about budget, velocity, projects, tickets, or team metrics specific to your role.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const aiResponse = simulateResponse(userMessage);

    setMessages(prev => [
      ...prev,
      { role: "user", message: userMessage },
      { role: "ai", message: aiResponse }
    ]);
    setInput("");
  };

  return (
    <div className="bg-slate-700/30 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <span className="text-lg">💬</span>
        <h4 className="text-sm font-semibold text-white">AI Assistant</h4>
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Simulated</span>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-200"
            }`}>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-700 bg-slate-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your metrics, projects, team..."
            className="flex-1 px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm text-white placeholder-slate-400"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO DATA
// ============================================================================

// Demo password
const DEMO_PASSWORD = "Ashrith";

// Demo roles (left sidebar)
const DEMO_ROLES = [
  { id: "senior_director", icon: "👔", title: "Senior Director", desc: "Organization-wide view" },
  { id: "director", icon: "📊", title: "Director", desc: "Department-level view" },
  { id: "tech_lead", icon: "🎯", title: "Tech Lead", desc: "Project-level view" },
  { id: "qa", icon: "🧪", title: "QA Engineer", desc: "Testing & quality view" },
  { id: "developer", icon: "💻", title: "Developer", desc: "Individual work view" },
  { id: "prod_support", icon: "🚨", title: "Production Support", desc: "Incident & monitoring view" },
  { id: "infrastructure", icon: "🔧", title: "Infrastructure", desc: "DevOps & SRE view" },
  { id: "documentation", icon: "📚", title: "Documentation", desc: "Architecture, APIs, test flows" },
];

// Demo tickets for developer view
const DEMO_TICKETS = [
  {
    id: "QUAD-1234",
    title: "Add price filter to products page",
    priority: "high",
    stage: "Automate",
    assignee: "You",
    timeSaved: "4 hours",
    aiModel: "Claude Opus",
  },
  {
    id: "QUAD-1235",
    title: "Fix checkout validation bug",
    priority: "critical",
    stage: "Deliver",
    assignee: "You",
    timeSaved: "2 hours",
    aiModel: "Claude Sonnet",
  },
  {
    id: "QUAD-1236",
    title: "Add user preferences API endpoint",
    priority: "medium",
    stage: "Question",
    assignee: "You",
    timeSaved: "—",
    aiModel: "—",
  },
];

// Demo notifications
const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    type: "meeting_to_code",
    icon: "📧",
    title: "Email → Jira → Code: Price Filter",
    subtitle: "BA email auto-created QUAD-1234, AI generated code",
    time: "Just now",
    isNew: true,
  },
  {
    id: 2,
    type: "leave",
    icon: "🏥",
    title: "Ravi took emergency leave",
    subtitle: "Outlook Agent detected PTO request",
    time: "2 min ago",
    isNew: true,
  },
  {
    id: 3,
    type: "reassign",
    icon: "🔄",
    title: "QUAD-1237 reassigned to Peter",
    subtitle: "TL approved automatic reassignment",
    time: "5 min ago",
    isNew: true,
  },
  {
    id: 4,
    type: "approval",
    icon: "✅",
    title: "TL approved PR #892",
    subtitle: "Merged to main branch",
    time: "12 min ago",
    isNew: false,
  },
  {
    id: 5,
    type: "allocation",
    icon: "⚠️",
    title: "David Kim: 100% assigned, 70% allocated",
    subtitle: "30% over-allocation detected",
    time: "1 hour ago",
    isNew: false,
    severity: "yellow",
  },
  {
    id: 6,
    type: "allocation",
    icon: "🔴",
    title: "Sneha Reddy: 100% assigned, 50% allocated",
    subtitle: "50% over-allocation - needs attention",
    time: "2 hours ago",
    isNew: false,
    severity: "red",
  },
];

// Role-specific notifications
const ROLE_NOTIFICATIONS: Record<string, typeof DEMO_NOTIFICATIONS> = {
  senior_director: [
    {
      id: 1,
      type: "budget",
      icon: "💰",
      title: "Budget variance detected",
      subtitle: "Project Mobile over budget by 12%",
      time: "5 min ago",
      isNew: true,
      severity: "yellow",
    },
    {
      id: 2,
      type: "velocity",
      icon: "📊",
      title: "Team velocity improved",
      subtitle: "Team Zeta: 48 pts/sprint (+15%)",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 3,
      type: "allocation",
      icon: "⚠️",
      title: "Over-allocation detected",
      subtitle: "2 team members need attention",
      time: "2 hours ago",
      isNew: false,
      severity: "red",
    },
    {
      id: 4,
      type: "milestone",
      icon: "🎯",
      title: "Customer Portal milestone reached",
      subtitle: "Sprint 12 completed ahead of schedule",
      time: "3 hours ago",
      isNew: false,
    },
    {
      id: 5,
      type: "director_update",
      icon: "👔",
      title: "Director requested budget review",
      subtitle: "Rajesh Patel - Digital division Q1 review",
      time: "1 day ago",
      isNew: false,
    },
  ],
  director: [
    {
      id: 1,
      type: "allocation",
      icon: "⚠️",
      title: "Over-allocation detected",
      subtitle: "David Kim: 130% allocated",
      time: "Just now",
      isNew: true,
      severity: "red",
    },
    {
      id: 2,
      type: "project_health",
      icon: "📈",
      title: "Customer Portal health: 85%",
      subtitle: "Velocity improving, 3 blockers resolved",
      time: "30 min ago",
      isNew: true,
    },
    {
      id: 3,
      type: "team_leave",
      icon: "🏥",
      title: "Ravi took emergency leave",
      subtitle: "Outlook Agent auto-reassigned 3 tasks",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 4,
      type: "sprint_complete",
      icon: "✅",
      title: "Sprint 12 completed",
      subtitle: "42 points delivered, 8% above target",
      time: "2 hours ago",
      isNew: false,
    },
    {
      id: 5,
      type: "hiring",
      icon: "👥",
      title: "New developer onboarding",
      subtitle: "Priya Sharma starts Monday",
      time: "1 day ago",
      isNew: false,
    },
  ],
  tech_lead: [
    {
      id: 1,
      type: "sprint_health",
      icon: "📊",
      title: "Sprint burndown: On track",
      subtitle: "18 points remaining, 3 days left",
      time: "Just now",
      isNew: true,
    },
    {
      id: 2,
      type: "blocker",
      icon: "🚫",
      title: "Blocker detected: API dependency",
      subtitle: "QUAD-1240 blocked by backend team",
      time: "15 min ago",
      isNew: true,
      severity: "red",
    },
    {
      id: 3,
      type: "code_review",
      icon: "👀",
      title: "3 PRs awaiting review",
      subtitle: "Priya, David, Sneha need approval",
      time: "30 min ago",
      isNew: true,
    },
    {
      id: 4,
      type: "allocation",
      icon: "⚠️",
      title: "David Kim over-allocated",
      subtitle: "30% over capacity, needs reassignment",
      time: "1 hour ago",
      isNew: false,
      severity: "yellow",
    },
    {
      id: 5,
      type: "retrospective",
      icon: "🔄",
      title: "Sprint 12 retrospective ready",
      subtitle: "12 action items identified",
      time: "3 hours ago",
      isNew: false,
    },
  ],
  qa: [
    {
      id: 1,
      type: "test_failure",
      icon: "❌",
      title: "Test failure: Checkout flow",
      subtitle: "5 tests failing in QUAD-1235",
      time: "Just now",
      isNew: true,
      severity: "red",
    },
    {
      id: 2,
      type: "coverage",
      icon: "📊",
      title: "Code coverage improved",
      subtitle: "Customer Portal: 87% (+5%)",
      time: "20 min ago",
      isNew: true,
    },
    {
      id: 3,
      type: "bug_report",
      icon: "🐛",
      title: "New bug reported",
      subtitle: "Price filter not persisting after refresh",
      time: "45 min ago",
      isNew: true,
    },
    {
      id: 4,
      type: "test_complete",
      icon: "✅",
      title: "Regression suite passed",
      subtitle: "347 tests passed in 8 minutes",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 5,
      type: "automation",
      icon: "🤖",
      title: "E2E tests automated",
      subtitle: "QUAD AI generated 23 new tests",
      time: "2 hours ago",
      isNew: false,
    },
  ],
  developer: [
    {
      id: 1,
      type: "task_assigned",
      icon: "🎫",
      title: "New task assigned: QUAD-1240",
      subtitle: "Implement price filter feature",
      time: "2 min ago",
      isNew: true,
    },
    {
      id: 2,
      type: "code_generated",
      icon: "🤖",
      title: "QUAD AI generated code",
      subtitle: "QUAD-1234: 147 lines added, 4 hours saved",
      time: "10 min ago",
      isNew: true,
    },
    {
      id: 3,
      type: "pr_approved",
      icon: "✅",
      title: "TL approved PR #892",
      subtitle: "Merged to main branch",
      time: "30 min ago",
      isNew: true,
    },
    {
      id: 4,
      type: "review_request",
      icon: "👀",
      title: "Code review requested",
      subtitle: "Sneha needs review on QUAD-1238",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 5,
      type: "build_status",
      icon: "🔨",
      title: "Build passed",
      subtitle: "Feature/price-filter deployed to DEV",
      time: "2 hours ago",
      isNew: false,
    },
  ],
  prod_support: [
    {
      id: 1,
      type: "incident",
      icon: "🚨",
      title: "P1 incident: API latency spike",
      subtitle: "Payment service response time: 3.2s",
      time: "Just now",
      isNew: true,
      severity: "red",
    },
    {
      id: 2,
      type: "alert",
      icon: "⚠️",
      title: "Memory usage warning",
      subtitle: "Web server: 85% memory utilization",
      time: "5 min ago",
      isNew: true,
      severity: "yellow",
    },
    {
      id: 3,
      type: "resolution",
      icon: "✅",
      title: "Incident resolved: Database timeout",
      subtitle: "Auto-scaled read replicas",
      time: "15 min ago",
      isNew: true,
    },
    {
      id: 4,
      type: "health_check",
      icon: "💚",
      title: "All systems operational",
      subtitle: "99.98% uptime this month",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 5,
      type: "deployment",
      icon: "🚀",
      title: "Production deployment successful",
      subtitle: "Release v2.4.0 deployed",
      time: "3 hours ago",
      isNew: false,
    },
  ],
  infrastructure: [
    {
      id: 1,
      type: "deployment",
      icon: "🚀",
      title: "Deployment to production",
      subtitle: "Release v2.4.0 in progress (3/5 pods)",
      time: "Just now",
      isNew: true,
    },
    {
      id: 2,
      type: "resource",
      icon: "💾",
      title: "Disk usage warning",
      subtitle: "Database volume: 82% full",
      time: "10 min ago",
      isNew: true,
      severity: "yellow",
    },
    {
      id: 3,
      type: "scaling",
      icon: "📈",
      title: "Auto-scaling triggered",
      subtitle: "Web tier scaled to 8 instances",
      time: "25 min ago",
      isNew: true,
    },
    {
      id: 4,
      type: "backup",
      icon: "💿",
      title: "Backup completed",
      subtitle: "Production database backed up (2.4 GB)",
      time: "1 hour ago",
      isNew: false,
    },
    {
      id: 5,
      type: "security",
      icon: "🔒",
      title: "Security scan completed",
      subtitle: "0 critical, 2 medium vulnerabilities",
      time: "3 hours ago",
      isNew: false,
    },
  ],
  documentation: [
    {
      id: 1,
      type: "doc_update",
      icon: "📝",
      title: "API documentation updated",
      subtitle: "Payment endpoints v2.4.0",
      time: "15 min ago",
      isNew: true,
    },
    {
      id: 2,
      type: "test_flow",
      icon: "🧪",
      title: "New test flow documented",
      subtitle: "E2E checkout flow with screenshots",
      time: "1 hour ago",
      isNew: true,
    },
    {
      id: 3,
      type: "architecture",
      icon: "🏗️",
      title: "Architecture diagram updated",
      subtitle: "Added new microservice: Notifications",
      time: "2 hours ago",
      isNew: false,
    },
    {
      id: 4,
      type: "runbook",
      icon: "📖",
      title: "Runbook created",
      subtitle: "Incident response: Database failover",
      time: "1 day ago",
      isNew: false,
    },
    {
      id: 5,
      type: "review",
      icon: "👀",
      title: "Documentation review needed",
      subtitle: "3 pages pending TL approval",
      time: "2 days ago",
      isNew: false,
    },
  ],
};

// Meeting to Code flow data
const MEETING_TO_CODE_FLOW = {
  email: {
    from: "sarah.johnson@company.com",
    to: "quad-agents@company.com",
    subject: "Add price filter to products page",
    body: "Hi team, we need to add a price range filter to the products page. Users should be able to filter products by price: Under $25, $25-$50, $50-$100, Over $100. Please prioritize this for Sprint 12. Thanks, Sarah (Product Manager)",
    time: "9:15 AM",
  },
  jiraTicket: {
    id: "QUAD-1234",
    title: "Add price filter to products page",
    type: "Feature",
    priority: "High",
    assignee: "Priya Sharma",
    sprint: "Sprint 12",
    status: "In Progress",
    story: "As a user, I want to filter products by price range so I can find products within my budget.",
    acceptance: [
      "Filter options: Under $25, $25-$50, $50-$100, Over $100",
      "Multiple selections allowed",
      "Results update without page reload",
      "Filter persists across pagination",
    ],
  },
  aiGenerated: {
    files: ["src/components/filters/PriceFilter.tsx", "src/hooks/usePriceFilter.ts", "src/tests/PriceFilter.test.ts"],
    linesAdded: 147,
    linesRemoved: 3,
    timeSaved: "4 hours",
  },
};

// Team allocation data - 16 person team across 4 projects
// Projects: Customer Portal (CP), Data Pipeline (DP), ML Models (ML), Mobile App (MA)
const TEAM_ALLOCATION = [
  // Leadership (shared across projects)
  { name: "Sarah Mitchell", role: "VP Engineering", allocated: 100, assigned: 95, projects: ["CP", "DP", "ML", "MA"] },
  { name: "Rajesh Patel", role: "Director - Digital", allocated: 100, assigned: 100, projects: ["CP", "MA"] },
  { name: "Jennifer Adams", role: "Director - Data", allocated: 100, assigned: 90, projects: ["DP", "ML"] },
  { name: "Ahmed Hassan", role: "Director - QA", allocated: 100, assigned: 85, projects: ["CP", "DP", "ML", "MA"] },

  // Customer Portal Team (Web UI - Next.js)
  { name: "Michael Torres", role: "Tech Lead (CP)", allocated: 100, assigned: 100, projects: ["CP"] },
  { name: "Priya Sharma", role: "Senior Developer", allocated: 100, assigned: 100, projects: ["CP"] },
  { name: "David Kim", role: "Full Stack Dev", allocated: 70, assigned: 100, projects: ["CP", "MA"], warning: "yellow" },

  // Mobile App Team (iOS + Android)
  { name: "Arun Krishnan", role: "Tech Lead (MA)", allocated: 100, assigned: 100, projects: ["MA"] },
  { name: "Jessica Brown", role: "iOS Developer", allocated: 100, assigned: 95, projects: ["MA"] },
  { name: "Farhan Ali", role: "Android Developer", allocated: 100, assigned: 90, projects: ["MA"] },

  // Data Pipeline Team (ETL - Python/Airflow)
  { name: "Robert Johnson", role: "Tech Lead (DP)", allocated: 100, assigned: 95, projects: ["DP"] },
  { name: "Sneha Reddy", role: "Data Engineer", allocated: 50, assigned: 100, projects: ["DP", "ML"], warning: "red" },

  // ML Models Team (Data Science - Python/TensorFlow)
  { name: "Emily Watson", role: "Data Scientist", allocated: 100, assigned: 90, projects: ["ML"] },
  { name: "Lisa Chen", role: "ML Engineer", allocated: 100, assigned: 85, projects: ["ML", "DP"] },

  // Shared Resources
  { name: "Chris Martinez", role: "DevOps Engineer", allocated: 100, assigned: 95, projects: ["CP", "DP", "ML", "MA"] },
  { name: "Fatima Khan", role: "Security Engineer", allocated: 100, assigned: 90, projects: ["CP", "DP", "ML", "MA"] },
];

// Project data for demo - 4 diverse project types
const DEMO_PROJECTS = [
  {
    id: "cp",
    name: "Customer Portal",
    type: "Web UI",
    tech: "Next.js, TypeScript, Tailwind",
    techLead: "Michael Torres",
    pm: "Rajesh Patel (shared)",
    health: 87,
    sprint: "Sprint 12",
    flows: 14,
    team: ["Priya Sharma", "David Kim"],
  },
  {
    id: "ma",
    name: "Mobile App",
    type: "iOS + Android",
    tech: "Swift, Kotlin, React Native",
    techLead: "Arun Krishnan",
    pm: "Rajesh Patel (dedicated)",
    health: 92,
    sprint: "Sprint 8",
    flows: 10,
    team: ["Jessica Brown", "Farhan Ali", "David Kim"],
  },
  {
    id: "dp",
    name: "Data Pipeline",
    type: "ETL",
    tech: "Python, Airflow, Spark",
    techLead: "Robert Johnson",
    pm: "Jennifer Adams",
    health: 85,
    sprint: "Sprint 6",
    flows: 8,
    team: ["Sneha Reddy", "Lisa Chen"],
  },
  {
    id: "ml",
    name: "ML Models",
    type: "Data Science",
    tech: "Python, TensorFlow, SageMaker",
    techLead: "Emily Watson",
    pm: "Jennifer Adams",
    health: 78,
    sprint: "Sprint 4",
    flows: 6,
    team: ["Lisa Chen", "Sneha Reddy", "Ahmed Hassan"],
  },
];

// Demo project configuration (for project config modal)
const DEMO_DIRECTORS = [
  {
    id: "dir1",
    name: "Director 1",
    expanded: false,
    projects: [
      {
        id: "ui",
        name: "Project UI",
        frontend: ["Next.js"],
        backend: ["Spring Boot"],
        database: ["PostgreSQL"],
        frontendOptions: ["Next.js", "React.js", "Vue.js"],
        backendOptions: ["Spring Boot", "Python", "Node.js"],
        databaseOptions: ["PostgreSQL", "MySQL", "MongoDB"],
      },
      {
        id: "mobile",
        name: "Project Mobile",
        frontend: ["React Native"],
        backend: ["Spring Boot"],
        database: ["PostgreSQL"],
        frontendOptions: ["React Native", "Flutter", "Swift"],
        backendOptions: ["Spring Boot", "Python", "Node.js"],
        databaseOptions: ["PostgreSQL", "MySQL", "MongoDB"],
      },
    ],
  },
  {
    id: "dir2",
    name: "Director 2",
    expanded: false,
    projects: [
      {
        id: "data-pipeline",
        name: "Project Data Pipeline",
        frontend: ["N/A"],
        backend: ["Python"],
        database: ["PostgreSQL"],
        frontendOptions: ["N/A"],
        backendOptions: ["Python", "Spark", "Airflow"],
        databaseOptions: ["PostgreSQL", "Snowflake", "BigQuery"],
      },
    ],
  },
  {
    id: "dir3",
    name: "Director 3",
    expanded: false,
    projects: [
      {
        id: "ml-models",
        name: "Project ML Models",
        frontend: ["N/A"],
        backend: ["Python"],
        database: ["PostgreSQL"],
        frontendOptions: ["N/A"],
        backendOptions: ["Python", "TensorFlow", "PyTorch"],
        databaseOptions: ["PostgreSQL", "MongoDB", "Redis"],
      },
    ],
  },
];

export default function CustomerDemo() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOrgNameModal, setShowOrgNameModal] = useState(false);
  const [showProjectConfigModal, setShowProjectConfigModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedDirectors, setExpandedDirectors] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("senior_director"); // Default to Senior Director

  // Interactive ticket detail states
  const [selectedTicket, setSelectedTicket] = useState<typeof DEMO_TICKETS[0] | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [ticketStage, setTicketStage] = useState<"analyzing" | "diff" | "conversation" | "approved">("analyzing");
  const [aiConversation, setAiConversation] = useState<Array<{role: "ai" | "dev", message: string}>>([]);
  const [devInput, setDevInput] = useState("");

  // Notification panel
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const newNotificationCount = notifications.filter(n => n.isNew).length;

  // Meeting to Code modal
  const [showMeetingToCode, setShowMeetingToCode] = useState(false);
  const [meetingToCodeStage, setMeetingToCodeStage] = useState<"email" | "jira" | "code" | "complete">("email");

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    aiCodeGeneration: true,
    meetingIntelligence: true,
    allocationAlerts: true,
    autoReassignment: true,
    priorityLearning: true,
    costOptimization: true,
    dataMasking: true,
    trivialErrorDetection: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = () => {
    if (password.toLowerCase() === DEMO_PASSWORD.toLowerCase()) {
      // Password correct - now ask for org name
      setShowPasswordModal(false);
      setShowOrgNameModal(true);
    } else {
      setPasswordError(true);
    }
  };

  const handleOrgNameSubmit = () => {
    // Use entered name or default
    const finalOrgName = orgName.trim() || "Demo Organization";
    setOrgName(finalOrgName);
    setShowOrgNameModal(false);
    // Show project config modal instead of going directly to dashboard
    setShowProjectConfigModal(true);
    // Pre-select first project and expand first director
    setSelectedProject("ui");
    setExpandedDirectors(["dir1"]);
  };

  const handleProjectConfigSubmit = () => {
    setShowProjectConfigModal(false);
    setUnlocked(true);
    setActiveScreen("dashboard");
  };

  const toggleDirector = (dirId: string) => {
    setExpandedDirectors(prev =>
      prev.includes(dirId)
        ? prev.filter(id => id !== dirId)
        : [...prev, dirId]
    );
  };

  // Handle ticket click - opens interactive detail view
  const handleTicketClick = (ticket: typeof DEMO_TICKETS[0]) => {
    if (!settings.aiCodeGeneration) {
      // Show a message that AI is disabled
      alert("AI Code Generation is disabled. Enable it in Settings to see the AI-assisted development flow.");
      return;
    }

    setSelectedTicket(ticket);
    setShowTicketDetail(true);
    setTicketStage("analyzing");
    setAiConversation([]);
    setDevInput("");

    // Simulate analyzing phase (2 seconds), then show diff
    setTimeout(() => {
      setTicketStage("diff");
      // Add initial AI message
      setAiConversation([
        {
          role: "ai",
          message: `I've analyzed the codebase and prepared the implementation for "${ticket.title}". Here are the proposed changes. Please review and let me know if you'd like any modifications.`
        }
      ]);
    }, 2000);
  };

  // Handle dev message in conversation
  const handleDevMessage = () => {
    if (!devInput.trim()) return;

    // Add dev message
    setAiConversation(prev => [...prev, { role: "dev", message: devInput }]);
    const userMessage = devInput.toLowerCase();
    setDevInput("");

    // Simulate AI response based on dev input
    setTimeout(() => {
      let aiResponse = "";

      if (userMessage.includes("reuse") || userMessage.includes("existing")) {
        aiResponse = "Good catch! I found `src/utils/priceFormatter.ts` that already handles currency formatting. I'll refactor to use that instead. Updated diff below.";
      } else if (userMessage.includes("class") || userMessage.includes("double check")) {
        aiResponse = "You're right - I found `PriceRangeSelector` in `src/components/filters/`. I'll extend that instead of creating a new component. Let me update the implementation.";
      } else if (userMessage.includes("test") || userMessage.includes("unit")) {
        aiResponse = "I'll add comprehensive unit tests using Jest. Adding tests for edge cases: empty price range, negative values, and currency conversion.";
      } else if (userMessage.includes("approve") || userMessage.includes("looks good") || userMessage.includes("lgtm")) {
        aiResponse = "Great! I'll proceed with creating the PR. The changes will be submitted for TL review.";
        setTimeout(() => setTicketStage("approved"), 1000);
      } else {
        aiResponse = "I understand. Let me adjust the implementation based on your feedback. I'll also run the existing test suite to ensure compatibility.";
      }

      setAiConversation(prev => [...prev, { role: "ai", message: aiResponse }]);
    }, 1500);
  };

  // Mark notifications as read
  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  // Handle Meeting to Code demo
  const handleMeetingToCodeClick = () => {
    setShowNotifications(false);
    setShowMeetingToCode(true);
    setMeetingToCodeStage("email");
  };

  const advanceMeetingToCodeStage = () => {
    if (meetingToCodeStage === "email") setMeetingToCodeStage("jira");
    else if (meetingToCodeStage === "jira") setMeetingToCodeStage("code");
    else if (meetingToCodeStage === "code") setMeetingToCodeStage("complete");
    else setShowMeetingToCode(false);
  };

  return (
    <div className="text-white">
      {/* =====================================================
          INTERACTIVE TICKET DETAIL MODAL
          ===================================================== */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
            {/* Modal Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  selectedTicket.priority === "critical" ? "bg-red-500/20 text-red-400" :
                  selectedTicket.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                  "bg-blue-500/20 text-blue-400"
                }`}>
                  {selectedTicket.priority.toUpperCase()}
                </span>
                <div>
                  <h3 className="font-bold text-white">{selectedTicket.id}: {selectedTicket.title}</h3>
                  <p className="text-xs text-slate-400">
                    Stage: {selectedTicket.stage} • AI: {selectedTicket.aiModel}
                    {selectedTicket.timeSaved !== "—" && (
                      <span className="text-green-400 ml-2">⏱️ {selectedTicket.timeSaved} saved</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTicketDetail(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Analyzing Stage */}
              {ticketStage === "analyzing" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Codebase...</h3>
                  <p className="text-slate-400 text-center max-w-md">
                    QUAD AI is scanning your codebase, understanding patterns, and preparing optimal implementation.
                  </p>
                  <div className="mt-8 bg-slate-800/50 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-slate-300 italic">
                      💡 <span className="text-blue-400">Pro tip:</span> This is a great time for a coffee break. Health is important!
                    </p>
                  </div>
                </div>
              )}

              {/* Diff + Conversation Stage */}
              {(ticketStage === "diff" || ticketStage === "conversation") && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: GitHub-style Diff */}
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-700 px-4 py-2 flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-300">
                        src/components/filters/PriceFilter.tsx
                      </span>
                      <span className="text-xs text-green-400">+47 -3</span>
                    </div>
                    <div className="p-4 font-mono text-sm overflow-x-auto">
                      {/* Diff lines */}
                      <div className="space-y-1">
                        <div className="text-slate-500">@@ -12,6 +12,50 @@</div>
                        <div className="text-slate-400"> import {"{ useState }"} from &apos;react&apos;;</div>
                        <div className="text-slate-400"> import {"{ useProducts }"} from &apos;@/hooks&apos;;</div>
                        <div className="text-slate-400"> </div>
                        <div className="bg-green-500/10 text-green-400">+ interface PriceRange {"{"}</div>
                        <div className="bg-green-500/10 text-green-400">+   min: number;</div>
                        <div className="bg-green-500/10 text-green-400">+   max: number;</div>
                        <div className="bg-green-500/10 text-green-400">+ {"}"}</div>
                        <div className="bg-green-500/10 text-green-400">+ </div>
                        <div className="bg-green-500/10 text-green-400">+ const PRICE_RANGES: PriceRange[] = [</div>
                        <div className="bg-green-500/10 text-green-400">+   {"{ min: 0, max: 25 }"},</div>
                        <div className="bg-green-500/10 text-green-400">+   {"{ min: 25, max: 50 }"},</div>
                        <div className="bg-green-500/10 text-green-400">+   {"{ min: 50, max: 100 }"},</div>
                        <div className="bg-green-500/10 text-green-400">+   {"{ min: 100, max: Infinity }"},</div>
                        <div className="bg-green-500/10 text-green-400">+ ];</div>
                        <div className="text-slate-400"> </div>
                        <div className="bg-red-500/10 text-red-400">- export function ProductList() {"{"}</div>
                        <div className="bg-green-500/10 text-green-400">+ export function ProductList({"{ onPriceFilter }"}: Props) {"{"}</div>
                        <div className="bg-green-500/10 text-green-400">+   const [selectedRange, setSelectedRange] = useState&lt;PriceRange | null&gt;(null);</div>
                        <div className="bg-green-500/10 text-green-400">+   </div>
                        <div className="bg-green-500/10 text-green-400">+   const handleFilterChange = (range: PriceRange) =&gt; {"{"}</div>
                        <div className="bg-green-500/10 text-green-400">+     setSelectedRange(range);</div>
                        <div className="bg-green-500/10 text-green-400">+     onPriceFilter(range);</div>
                        <div className="bg-green-500/10 text-green-400">+   {"}"};</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Conversation */}
                  <div className="bg-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-slate-700 px-4 py-2 flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <span className="text-sm font-semibold text-slate-300">QUAD AI Assistant</span>
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                        {selectedTicket.aiModel}
                      </span>
                    </div>

                    {/* Conversation */}
                    <div className="flex-1 p-4 space-y-4 max-h-64 overflow-y-auto">
                      {aiConversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "dev" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            msg.role === "dev"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-200"
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={devInput}
                          onChange={(e) => setDevInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleDevMessage()}
                          placeholder="Type feedback... (try: 'can you reuse existing class?')"
                          className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleDevMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                        >
                          Send
                        </button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setDevInput("Looks good, approve it!");
                            setTimeout(handleDevMessage, 100);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => setDevInput("Can you reuse existing class? Double check the codebase.")}
                          className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all text-xs"
                        >
                          Request Changes
                        </button>
                        <button
                          onClick={() => setDevInput("I'll code this myself with my preferred code assistant.")}
                          className="px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-all text-xs"
                        >
                          I&apos;ll Code It
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Approved Stage */}
              {ticketStage === "approved" && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">Changes Approved!</h3>
                  <p className="text-slate-400 text-center max-w-md mb-6">
                    PR #{Math.floor(Math.random() * 900) + 100} created and submitted for TL review.
                  </p>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-400">Time saved on this task:</p>
                    <p className="text-3xl font-bold text-green-400">{selectedTicket.timeSaved}</p>
                  </div>
                  <button
                    onClick={() => setShowTicketDetail(false)}
                    className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MEETING TO CODE MODAL
          ===================================================== */}
      {showMeetingToCode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-bold text-white text-lg">Meeting → Code Demo</h3>
                  <p className="text-xs text-blue-100">
                    See how an email becomes working code in hours
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMeetingToCode(false)}
                className="text-white/70 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { id: "email", label: "Email Received", icon: "📧" },
                  { id: "jira", label: "Jira Created", icon: "🎫" },
                  { id: "code", label: "Code Generated", icon: "💻" },
                  { id: "complete", label: "PR Ready", icon: "✅" },
                ].map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex flex-col items-center ${
                      meetingToCodeStage === step.id ? "opacity-100" :
                      ["email", "jira", "code", "complete"].indexOf(meetingToCodeStage) > i ? "opacity-100" : "opacity-40"
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        meetingToCodeStage === step.id ? "bg-blue-600" :
                        ["email", "jira", "code", "complete"].indexOf(meetingToCodeStage) > i ? "bg-green-600" : "bg-slate-700"
                      }`}>
                        {["email", "jira", "code", "complete"].indexOf(meetingToCodeStage) > i ? "✓" : step.icon}
                      </div>
                      <span className="text-xs text-slate-400 mt-1">{step.label}</span>
                    </div>
                    {i < 3 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        ["email", "jira", "code", "complete"].indexOf(meetingToCodeStage) > i ? "bg-green-600" : "bg-slate-700"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Email Stage */}
              {meetingToCodeStage === "email" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">📧</span>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">From: {MEETING_TO_CODE_FLOW.email.from}</p>
                        <p className="text-xs text-slate-400">To: {MEETING_TO_CODE_FLOW.email.to}</p>
                      </div>
                      <span className="text-xs text-slate-500">{MEETING_TO_CODE_FLOW.email.time}</span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-white mb-3">{MEETING_TO_CODE_FLOW.email.subject}</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{MEETING_TO_CODE_FLOW.email.body}</p>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-4">
                      <span className="text-blue-400">QUAD Email Agent</span> detects the feature request and auto-creates a Jira ticket
                    </p>
                  </div>
                </div>
              )}

              {/* Jira Stage */}
              {meetingToCodeStage === "jira" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-blue-600/20 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-bold">
                          {MEETING_TO_CODE_FLOW.jiraTicket.priority}
                        </span>
                        <span className="text-white font-bold">{MEETING_TO_CODE_FLOW.jiraTicket.id}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {MEETING_TO_CODE_FLOW.jiraTicket.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-white text-lg mb-3">{MEETING_TO_CODE_FLOW.jiraTicket.title}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-500">Type:</span>
                          <span className="text-slate-300 ml-2">{MEETING_TO_CODE_FLOW.jiraTicket.type}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Sprint:</span>
                          <span className="text-slate-300 ml-2">{MEETING_TO_CODE_FLOW.jiraTicket.sprint}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Assignee:</span>
                          <span className="text-slate-300 ml-2">{MEETING_TO_CODE_FLOW.jiraTicket.assignee}</span>
                        </div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-slate-500 mb-1">User Story</p>
                        <p className="text-slate-300 text-sm">{MEETING_TO_CODE_FLOW.jiraTicket.story}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-2">Acceptance Criteria</p>
                        <ul className="space-y-1">
                          {MEETING_TO_CODE_FLOW.jiraTicket.acceptance.map((ac, i) => (
                            <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              {ac}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-4">
                      <span className="text-purple-400">QUAD AI Agent</span> analyzes requirements and generates implementation
                    </p>
                  </div>
                </div>
              )}

              {/* Code Stage */}
              {meetingToCodeStage === "code" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-300">AI Generated Code</span>
                      <span className="text-xs text-green-400">+{MEETING_TO_CODE_FLOW.aiGenerated.linesAdded} -{MEETING_TO_CODE_FLOW.aiGenerated.linesRemoved}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-500 mb-3">Files created/modified:</p>
                      <div className="space-y-2">
                        {MEETING_TO_CODE_FLOW.aiGenerated.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-green-400">+</span>
                            <span className="font-mono text-slate-300">{file}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg font-mono text-sm">
                        <div className="text-slate-500">// PriceFilter.tsx (preview)</div>
                        <div className="text-green-400">+ export function PriceFilter({"{ onFilter }"})</div>
                        <div className="text-green-400">+   const [selected, setSelected] = useState([])</div>
                        <div className="text-green-400">+   const ranges = [&quot;Under $25&quot;, &quot;$25-$50&quot;, ...]</div>
                        <div className="text-slate-500">+   // ... 144 more lines</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-4">
                      Developer reviews and approves the implementation
                    </p>
                  </div>
                </div>
              )}

              {/* Complete Stage */}
              {meetingToCodeStage === "complete" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">PR Ready for Review!</h3>
                  <p className="text-slate-400 text-center max-w-md mb-6">
                    From email to working code in less than 4 hours
                  </p>
                  <div className="grid grid-cols-3 gap-6 text-center mb-8">
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-blue-400">📧 → 🎫</p>
                      <p className="text-xs text-slate-400 mt-1">Auto-created Jira</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-purple-400">+147 lines</p>
                      <p className="text-xs text-slate-400 mt-1">AI-generated code</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-400">{MEETING_TO_CODE_FLOW.aiGenerated.timeSaved}</p>
                      <p className="text-xs text-slate-400 mt-1">Time saved</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 italic">
                    &quot;AI suggests, human decides&quot; - Developer approved the implementation
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <button
                onClick={() => setShowMeetingToCode(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-all"
              >
                Close
              </button>
              <button
                onClick={advanceMeetingToCodeStage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                {meetingToCodeStage === "complete" ? "Done" : "Next Step"}
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          NOTIFICATION PANEL
          ===================================================== */}
      {showNotifications && (
        <div className="fixed top-20 right-4 w-96 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl z-50 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <h3 className="font-bold text-white">Notifications</h3>
            <button
              onClick={() => { markNotificationsRead(); setShowNotifications(false); }}
              className="text-slate-400 hover:text-white text-sm"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications
              .filter(notif => {
                // Filter based on settings
                if (notif.type === "meeting_to_code" && !settings.meetingIntelligence) return false;
                if (notif.type === "allocation" && !settings.allocationAlerts) return false;
                if (notif.type === "reassign" && !settings.autoReassignment) return false;
                return true;
              })
              .map((notif) => (
              <div
                key={notif.id}
                onClick={() => notif.type === "meeting_to_code" && settings.meetingIntelligence && handleMeetingToCodeClick()}
                className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-all cursor-pointer ${
                  notif.isNew ? "bg-blue-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{notif.icon}</span>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      notif.severity === "red" ? "text-red-400" :
                      notif.severity === "yellow" ? "text-yellow-400" :
                      "text-white"
                    }`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400">{notif.subtitle}</p>
                    <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                  </div>
                  {notif.isNew && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </div>
            ))}
            {notifications.filter(n => {
              if (n.type === "meeting_to_code" && !settings.meetingIntelligence) return false;
              if (n.type === "allocation" && !settings.allocationAlerts) return false;
              if (n.type === "reassign" && !settings.autoReassignment) return false;
              return true;
            }).length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                <p>No notifications</p>
                <p className="text-xs mt-1">Some notifications are hidden by Settings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          SETTINGS PANEL
          ===================================================== */}
      {showSettings && (
        <div className="fixed top-20 right-4 w-96 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl z-50 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <h3 className="font-bold text-white">Feature Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <p className="text-xs text-slate-500 mb-4">
              Toggle features ON/OFF to see how the demo changes. This simulates the Settings page in QUAD Platform.
            </p>
            {[
              { key: "aiCodeGeneration" as const, label: "AI Code Generation", desc: "Generate code from tickets" },
              { key: "meetingIntelligence" as const, label: "Meeting Intelligence", desc: "Auto-MOM, action items" },
              { key: "allocationAlerts" as const, label: "Allocation Alerts", desc: "Yellow/red warnings" },
              { key: "autoReassignment" as const, label: "Auto-Reassignment", desc: "Reassign on PTO/leave" },
              { key: "priorityLearning" as const, label: "Priority Learning", desc: "AI learns from PM" },
              { key: "costOptimization" as const, label: "Cost Optimization", desc: "Infrastructure savings" },
              { key: "dataMasking" as const, label: "Data Masking", desc: "Mask PII in dev" },
              { key: "trivialErrorDetection" as const, label: "Trivial Error Detection", desc: "Auto-create BAU tickets" },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm text-white">{setting.label}</p>
                  <p className="text-xs text-slate-500">{setting.desc}</p>
                </div>
                <button
                  onClick={() => toggleSetting(setting.key)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings[setting.key] ? "bg-green-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      settings[setting.key] ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <p className="text-xs text-slate-400 text-center">
              Features are configurable per organization in the actual platform
            </p>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-center">🔐 Live Demo Access</h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              Enter password to access the interactive dashboard
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="Enter password"
              className={`w-full px-4 py-3 bg-slate-700 rounded-lg border ${
                passwordError ? "border-red-500" : "border-slate-600"
              } focus:border-blue-500 focus:outline-none mb-4`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm mb-4 text-center">
                Incorrect password. Please try again.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all"
              >
                Unlock Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Name Modal (after password) */}
      {showOrgNameModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-center">🏢 Enter Organization Name</h2>
            <p className="text-slate-400 text-sm text-center mb-2">
              Enter your organization name for the demo
            </p>
            <p className="text-slate-500 text-xs text-center mb-6 italic">
              This is for demo purposes only - no affiliation implied
            </p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOrgNameSubmit()}
              placeholder="e.g., Acme Corporation"
              className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none mb-4"
              autoFocus
            />
            <button
              onClick={handleOrgNameSubmit}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start Demo
            </button>
          </div>
        </div>
      )}

      {/* Project Configuration Modal (after org name) */}
      {showProjectConfigModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-5xl w-full mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">📂 Project Configuration</h2>
            <p className="text-slate-400 text-sm text-center mb-8">
              Select a project to view its technology stack configuration
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Director/Project Tree */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">📁 Project Structure</h3>
                <div className="space-y-2">
                  {DEMO_DIRECTORS.map((director) => (
                    <div key={director.id}>
                      {/* Director Row */}
                      <div
                        onClick={() => toggleDirector(director.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all"
                      >
                        <span className="text-slate-400">
                          {expandedDirectors.includes(director.id) ? "📂" : "📁"}
                        </span>
                        <span className="text-slate-300 font-medium">{director.name}</span>
                      </div>

                      {/* Projects under Director */}
                      {expandedDirectors.includes(director.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {director.projects.map((project) => (
                            <div
                              key={project.id}
                              onClick={() => setSelectedProject(project.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                selectedProject === project.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              }`}
                            >
                              <span>📂</span>
                              <span className="font-medium">{project.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Tech Stack Configuration */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">⚙️ Technology Stack</h3>
                {selectedProject ? (
                  <div className="space-y-6">
                    {DEMO_DIRECTORS.flatMap(d => d.projects).filter(p => p.id === selectedProject).map(project => (
                      <div key={project.id} className="space-y-6">
                        {/* Frontend */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-2">Frontend</h4>
                          <div className="space-y-2">
                            {project.frontendOptions.map(option => {
                              const isSelected = project.frontend.includes(option);
                              return (
                                <div
                                  key={option}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    isSelected
                                      ? "bg-green-600/20 border border-green-600"
                                      : "bg-slate-800 border border-slate-700 opacity-50"
                                  }`}
                                >
                                  <span className="text-lg">
                                    {isSelected ? "✅" : "❌"}
                                  </span>
                                  <span className={isSelected ? "text-green-300 font-medium" : "text-slate-500"}>
                                    {option}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Backend */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-2">Backend</h4>
                          <div className="space-y-2">
                            {project.backendOptions.map(option => {
                              const isSelected = project.backend.includes(option);
                              return (
                                <div
                                  key={option}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    isSelected
                                      ? "bg-green-600/20 border border-green-600"
                                      : "bg-slate-800 border border-slate-700 opacity-50"
                                  }`}
                                >
                                  <span className="text-lg">
                                    {isSelected ? "✅" : "❌"}
                                  </span>
                                  <span className={isSelected ? "text-green-300 font-medium" : "text-slate-500"}>
                                    {option}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Database */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-2">Database</h4>
                          <div className="space-y-2">
                            {project.databaseOptions.map(option => {
                              const isSelected = project.database.includes(option);
                              return (
                                <div
                                  key={option}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    isSelected
                                      ? "bg-green-600/20 border border-green-600"
                                      : "bg-slate-800 border border-slate-700 opacity-50"
                                  }`}
                                >
                                  <span className="text-lg">
                                    {isSelected ? "✅" : "❌"}
                                  </span>
                                  <span className={isSelected ? "text-green-300 font-medium" : "text-slate-500"}>
                                    {option}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Select a project from the tree to view its technology stack</p>
                  </div>
                )}
              </div>
            </div>

            {/* OK Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleProjectConfigSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                OK - Continue to Dashboard
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4 italic">
              This configuration is for demo purposes only
            </p>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* PLATFORM DEMO (Password Protected)       */}
      {/* ========================================= */}

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-6">
            Platform Demo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            See QUAD{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              In Action
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Experience the QUAD Platform with your organization&apos;s name and pre-configured demo data.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          {!unlocked && (
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Interactive Dashboard
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Unlock to explore the QUAD Platform with your organization&apos;s name and pre-configured demo data covering UI, Backend, and B2B Webservice projects.
              </p>
            </div>
          )}

          {/* Unlock Button (when locked) */}
          {!unlocked && (
            <div className="text-center mb-8">
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setPassword("");
                  setPasswordError(false);
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all text-lg"
              >
                🔐 Unlock Interactive Demo
              </button>
              <p className="text-slate-500 text-sm mt-3">
                Password required to view dashboard screens
              </p>
            </div>
          )}

          {/* Demo Content (when unlocked) - 3 Column Layout */}
          {unlocked && (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* LEFT: Role Selector */}
              <div className="xl:w-64 shrink-0">
                {/* Notification & Settings */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 mb-4 space-y-2">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔔</span>
                      <span className="font-medium text-sm text-white">Notifications</span>
                    </div>
                    {newNotificationCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {newNotificationCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚙️</span>
                      <span className="font-medium text-sm text-white">Settings</span>
                    </div>
                    <span className="text-xs text-slate-500">Demo</span>
                  </button>
                </div>

                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
                  <h3 className="font-bold text-white mb-4 text-sm">View As Role</h3>
                  <div className="space-y-2">
                    {DEMO_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                          selectedRole === role.id
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{role.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{role.title}</p>
                            <p className={`text-xs ${selectedRole === role.id ? "text-blue-200" : "text-slate-500"}`}>
                              {role.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Organization Info */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 mt-4">
                  <h3 className="font-bold text-white mb-3 text-sm">Organization</h3>
                  <p className="text-white font-bold">{orgName}</p>
                  <p className="text-xs text-slate-500 mt-1">Founder Account</p>
                </div>
              </div>

              {/* MIDDLE: Dashboard Content */}
              <div className="flex-1 min-w-0">
                {/* Dashboard Container */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{DEMO_ROLES.find(r => r.id === selectedRole)?.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{DEMO_ROLES.find(r => r.id === selectedRole)?.title} Dashboard</h3>
                        <p className="text-xs text-slate-400">
                          {orgName} • Single-scroll view
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      Live Demo
                    </div>
                  </div>

                  {/* Dashboard Content - Always shows role-based dashboard */}
                  <div className="p-6">
                    <DashboardScreen
                      role={selectedRole}
                      orgName={orgName}
                      onTicketClick={handleTicketClick}
                      teamAllocation={TEAM_ALLOCATION}
                      settings={settings}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Notifications Panel */}
              <div className="xl:w-80 shrink-0">
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden sticky top-4">
                  {/* Notifications Header */}
                  <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔔</span>
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                      </div>
                      {ROLE_NOTIFICATIONS[selectedRole]?.filter(n => n.isNew).length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {ROLE_NOTIFICATIONS[selectedRole]?.filter(n => n.isNew).length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                    {ROLE_NOTIFICATIONS[selectedRole]?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-slate-700 hover:bg-slate-700/30 transition-all cursor-pointer ${
                          notification.isNew ? "bg-blue-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{notification.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-white text-sm leading-tight">
                                {notification.title}
                              </h4>
                              {notification.isNew && (
                                <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {notification.subtitle}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-slate-500">{notification.time}</span>
                              {notification.severity && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    notification.severity === "red"
                                      ? "bg-red-500/20 text-red-300"
                                      : notification.severity === "yellow"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : "bg-blue-500/20 text-blue-300"
                                  }`}
                                >
                                  {notification.severity === "red"
                                    ? "Critical"
                                    : notification.severity === "yellow"
                                    ? "Warning"
                                    : "Info"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Footer */}
                  <div className="bg-slate-800 px-4 py-3 border-t border-slate-700">
                    <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      View All Notifications →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/customer/settings"
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all"
            >
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-bold text-white mb-1">Feature Settings</h3>
              <p className="text-sm text-slate-400">Configure which features to show</p>
            </Link>
            <Link
              href="/customer/roi"
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all"
            >
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-white mb-1">ROI Calculator</h3>
              <p className="text-sm text-slate-400">Calculate savings for your organization</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Next Step Navigation */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            Next Step
          </div>
          <h2 className="text-2xl font-bold mb-4">Calculate Your ROI</h2>
          <p className="text-slate-400 mb-6">
            See how much your organization could save with QUAD Platform.
          </p>
          <Link
            href="/customer/roi"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
          >
            View ROI Calculator
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// INLINE DEMO SCREEN COMPONENTS
// =====================================================

interface ScreenProps {
  role: string;
  orgName?: string;
  onTicketClick?: (ticket: typeof DEMO_TICKETS[0]) => void;
  teamAllocation?: typeof TEAM_ALLOCATION;
  settings?: {
    aiCodeGeneration: boolean;
    meetingIntelligence: boolean;
    allocationAlerts: boolean;
    autoReassignment: boolean;
    priorityLearning: boolean;
    costOptimization: boolean;
    dataMasking: boolean;
    trivialErrorDetection: boolean;
  };
}

function DashboardScreen({ role, orgName, onTicketClick, teamAllocation, settings }: ScreenProps) {
  // Role-specific stats
  const getStats = () => {
    switch (role) {
      case "senior_director":
        return [
          { label: "Active Projects", value: "3", change: "+1 this month", icon: "📁" },
          { label: "Total Budget", value: "$2.4M", change: "On track", icon: "💰" },
          { label: "Team Members", value: "45", change: "Across 3 domains", icon: "👥" },
          { label: "Org Velocity", value: "87%", change: "+12% vs Q3", icon: "📈" },
        ];
      case "director":
        return [
          { label: "Department Projects", value: "2", change: "Customer Portal, API", icon: "📁" },
          { label: "Team Size", value: "18", change: "6 devs, 4 QA", icon: "👥" },
          { label: "Active Flows", value: "24", change: "8 in Automate", icon: "🔄" },
          { label: "Dept Velocity", value: "92%", change: "+8% vs last cycle", icon: "📈" },
        ];
      case "tech_lead":
        return [
          { label: "My Project", value: "1", change: "Customer Portal", icon: "📁" },
          { label: "Team Members", value: "6", change: "4 devs, 2 QA", icon: "👥" },
          { label: "Open PRs", value: "8", change: "3 need review", icon: "🔀" },
          { label: "Sprint Progress", value: "75%", change: "Day 8 of 10", icon: "⏱️" },
        ];
      case "qa":
        return [
          { label: "Test Queue", value: "12", change: "3 high priority", icon: "📋" },
          { label: "Bugs Found", value: "5", change: "This sprint", icon: "🐛" },
          { label: "Pass Rate", value: "94%", change: "+2% vs last sprint", icon: "✅" },
          { label: "Coverage", value: "78%", change: "Target: 80%", icon: "📊" },
        ];
      case "developer":
        return [
          { label: "My Flows", value: "3", change: "1 in Automate", icon: "🔄" },
          { label: "PRs Open", value: "2", change: "1 approved", icon: "🔀" },
          { label: "Code Reviews", value: "3", change: "Pending", icon: "👁️" },
          { label: "Time Saved", value: "6h", change: "This week with AI", icon: "⏱️" },
        ];
      case "prod_support":
        return [
          { label: "Open Incidents", value: "3", change: "1 P1, 2 P2", icon: "🚨" },
          { label: "MTTR", value: "45m", change: "↓ 15% vs last week", icon: "⏱️" },
          { label: "On-Call", value: "Active", change: "Until 6 PM EST", icon: "📞" },
          { label: "SLA Compliance", value: "99.2%", change: "Target: 99%", icon: "📊" },
        ];
      case "infrastructure":
        return [
          { label: "Uptime", value: "99.97%", change: "Last 30 days", icon: "📡" },
          { label: "Deployments", value: "12", change: "This week", icon: "🚀" },
          { label: "Active Alerts", value: "2", change: "Non-critical", icon: "🔔" },
          { label: "Cost Savings", value: "$12K", change: "This month", icon: "💰" },
        ];
      default:
        return [];
    }
  };

  // Allocation warnings (for TL and above)
  const getAllocationWarnings = () => {
    if (!teamAllocation) return [];
    return teamAllocation.filter(m => m.warning);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getStats().map((stat, i) => (
          <div key={i} className="bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-green-400">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Developer: Clickable Ticket List */}
      {role === "developer" && (
        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <span>🎫</span> My Assigned Flows
            <span className="text-xs text-blue-400">(Click to work on)</span>
          </h4>
          <div className="space-y-2">
            {DEMO_TICKETS.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onTicketClick?.(ticket)}
                className="w-full text-left bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all border border-transparent hover:border-blue-500/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        ticket.priority === "critical" ? "bg-red-500/20 text-red-400" :
                        ticket.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">{ticket.id}</span>
                    </div>
                    <p className="font-medium text-white">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Stage: <span className="text-purple-400">{ticket.stage}</span>
                      {ticket.timeSaved !== "—" && (
                        <span className="text-green-400 ml-2">• {ticket.timeSaved} saved</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl">→</span>
                    <p className="text-xs text-slate-500">Start</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QA: Test Coverage Donut + Test Queue */}
      {role === "qa" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Coverage Donut */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Test Coverage by Type</h4>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#334155" strokeWidth="12" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="#22c55e" strokeWidth="12" fill="none"
                    strokeDasharray="352" strokeDashoffset="77" />
                  <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="12" fill="none"
                    strokeDasharray="352" strokeDashoffset="264" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">78%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-slate-400">Unit (45%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-slate-400">Integration (25%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-600 rounded-full" />
                  <span className="text-slate-400">E2E (8%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bug Severity */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Open Bugs by Severity</h4>
            <div className="space-y-3">
              {[
                { label: "Critical", count: 1, color: "bg-red-500", width: "20%" },
                { label: "High", count: 3, color: "bg-orange-500", width: "60%" },
                { label: "Medium", count: 2, color: "bg-yellow-500", width: "40%" },
                { label: "Low", count: 5, color: "bg-blue-500", width: "100%" },
              ].map((bug, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{bug.label}</span>
                    <span className="text-white font-bold">{bug.count}</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div className={`h-full ${bug.color} rounded-full`} style={{ width: bug.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tech Lead: Team Velocity + Allocation Warnings */}
      {role === "tech_lead" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sprint Burndown */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Sprint Burndown</h4>
            <div className="h-40 flex items-end justify-between gap-1 px-2">
              {[24, 22, 18, 15, 14, 12, 10, 8, 6, 3].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                    style={{ height: `${(val / 24) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500 mt-1">D{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">
              <span className="text-green-400">On track</span> • 3 story points remaining
            </div>
          </div>

          {/* Allocation Warnings */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              ⚠️ Allocation Alerts
              {settings && !settings.allocationAlerts && (
                <span className="text-xs bg-slate-600 text-slate-400 px-2 py-0.5 rounded">OFF</span>
              )}
            </h4>
            {!settings || settings.allocationAlerts ? (
              <div className="space-y-2">
                {getAllocationWarnings().map((member, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      member.warning === "red"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-yellow-500/10 border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium text-sm ${member.warning === "red" ? "text-red-400" : "text-yellow-400"}`}>
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {member.assigned}% assigned / {member.allocated}% allocated
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        member.warning === "red" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        +{member.assigned - member.allocated}% over
                      </span>
                    </div>
                  </div>
                ))}
                {getAllocationWarnings().length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No allocation issues</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                <p>Allocation alerts disabled</p>
                <p className="text-xs mt-1">Enable in Settings to see warnings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Director: Burndown + Resource Utilization Pie */}
      {role === "director" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Department Burndown */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Department Burndown</h4>
            <div className="h-40 flex items-end justify-between gap-1 px-2">
              {[100, 92, 85, 78, 70, 62].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                    style={{ height: `${val}%` }}
                  />
                  <span className="text-xs text-slate-500 mt-1">W{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">
              <span className="text-green-400">38% complete</span> • On schedule
            </div>
          </div>

          {/* Resource Utilization Pie */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Resource Utilization</h4>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#334155" strokeWidth="12" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="#22c55e" strokeWidth="12" fill="none"
                    strokeDasharray="352" strokeDashoffset="52" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">85%</span>
                  <span className="text-xs text-slate-400">utilized</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-slate-400">Productive (85%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-slate-400">Meetings (10%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-600 rounded-full" />
                  <span className="text-slate-400">Available (5%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Senior Director / Founder: Training vs Appreciation + Org Health */}
      {role === "senior_director" && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Training Investment */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-4">🎓 Training Investment</h4>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">$45K</p>
                <p className="text-xs text-slate-400 mt-1">This quarter</p>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "AI/ML Skills", value: "$18K" },
                  { label: "Leadership", value: "$12K" },
                  { label: "Technical Certs", value: "$15K" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Appreciation / Recognition */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-4">🏆 Recognition Program</h4>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">23</p>
                <p className="text-xs text-slate-400 mt-1">Awards this month</p>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Spot Bonuses", value: "12" },
                  { label: "Peer Recognition", value: "8" },
                  { label: "Promotions", value: "3" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Talent Retention */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-4">👥 Talent Retention</h4>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">94%</p>
                <p className="text-xs text-slate-400 mt-1">Retention rate (↑ 8%)</p>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Avg Tenure", value: "3.2 yrs" },
                  { label: "eNPS Score", value: "+42" },
                  { label: "Open Positions", value: "4" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk & Compliance + Monitoring */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Risk & Compliance */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                🛡️ Risk & Compliance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "SOC 2", status: "Compliant", icon: "✅", color: "text-green-400" },
                  { label: "HIPAA", status: "In Progress", icon: "🔄", color: "text-yellow-400" },
                  { label: "GDPR", status: "Compliant", icon: "✅", color: "text-green-400" },
                  { label: "Security Scan", status: "0 Critical", icon: "🔒", color: "text-green-400" },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-xs text-slate-400 mt-1">{item.label}</p>
                    <p className={`text-xs font-bold ${item.color}`}>{item.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure & App Monitoring */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                📡 System Monitoring
              </h4>
              <div className="space-y-3">
                {/* Infrastructure */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Infrastructure</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">All Systems Go</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-white font-bold">99.97%</p>
                      <p className="text-slate-500">Uptime</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">45ms</p>
                      <p className="text-slate-500">Latency</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">0</p>
                      <p className="text-slate-500">Alerts</p>
                    </div>
                  </div>
                </div>
                {/* Application */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Application</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Healthy</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-white font-bold">0.02%</p>
                      <p className="text-slate-500">Error Rate</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">1.2s</p>
                      <p className="text-slate-500">Avg Load</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">12K</p>
                      <p className="text-slate-500">Requests/min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Projects List (for Director and Tech Lead) */}
      {(role === "director" || role === "tech_lead") && (
        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-3">Active Projects</h4>
          <div className="space-y-2">
            {(role === "tech_lead" ? [
              { name: "Customer Portal", type: "Web UI", health: 87, stage: "Sprint 12", flows: 12 }
            ] : [
              { name: "Customer Portal", type: "Web UI", health: 87, stage: "Sprint 12", flows: 12 },
              { name: "Claims API", type: "Backend", health: 92, stage: "Sprint 8", flows: 8 },
            ]).map((project, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{project.name}</p>
                  <p className="text-xs text-slate-400">
                    <span className="text-blue-400 mr-2">[{project.type}]</span>
                    {project.stage} • {project.flows} active flows
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${project.health >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {project.health}%
                  </p>
                  <p className="text-xs text-slate-500">Health</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Support: Incident Dashboard */}
      {role === "prod_support" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Incidents */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              🚨 Active Incidents
            </h4>
            <div className="space-y-2">
              {[
                { id: "INC-001", title: "Payment gateway timeout", priority: "P1", status: "In Progress", age: "45m" },
                { id: "INC-002", title: "Slow API response (>3s)", priority: "P2", status: "Investigating", age: "2h" },
                { id: "INC-003", title: "Email delivery delays", priority: "P2", status: "Monitoring", age: "4h" },
              ].map((incident, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  incident.priority === "P1" ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${incident.priority === "P1" ? "text-red-400" : "text-yellow-400"}`}>
                      {incident.priority}
                    </span>
                    <span className="text-xs text-slate-500">{incident.age}</span>
                  </div>
                  <p className="text-sm text-white font-medium">{incident.title}</p>
                  <p className="text-xs text-slate-400">{incident.id} • {incident.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service Health */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              📡 Service Health
            </h4>
            <div className="space-y-3">
              {[
                { name: "Customer Portal", status: "Operational", uptime: "99.99%", color: "green" },
                { name: "Payment Gateway", status: "Degraded", uptime: "98.5%", color: "yellow" },
                { name: "Claims API", status: "Operational", uptime: "99.97%", color: "green" },
                { name: "Email Service", status: "Degraded", uptime: "97.2%", color: "yellow" },
                { name: "Database Cluster", status: "Operational", uptime: "100%", color: "green" },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      service.color === "green" ? "bg-green-500" : "bg-yellow-500"
                    }`} />
                    <span className="text-sm text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs ${
                      service.color === "green" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {service.status}
                    </span>
                    <span className="text-xs text-slate-400">{service.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents Timeline */}
          <div className="md:col-span-2 bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">📅 Incident Timeline (Last 7 Days)</h4>
            <div className="flex items-end justify-between gap-1 h-24">
              {[
                { day: "Mon", p1: 0, p2: 1 },
                { day: "Tue", p1: 1, p2: 2 },
                { day: "Wed", p1: 0, p2: 0 },
                { day: "Thu", p1: 0, p2: 1 },
                { day: "Fri", p1: 1, p2: 1 },
                { day: "Sat", p1: 0, p2: 0 },
                { day: "Sun", p1: 0, p2: 1 },
              ].map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-0.5">
                    {day.p1 > 0 && <div className="w-full h-4 bg-red-500 rounded-t" />}
                    {day.p2 > 0 && <div className="w-full h-3 bg-yellow-500 rounded-t" style={{ marginTop: day.p1 > 0 ? 0 : 'auto' }} />}
                    {day.p1 === 0 && day.p2 === 0 && <div className="w-full h-1 bg-green-500 rounded" />}
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-slate-400">P1 Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded" />
                <span className="text-slate-400">P2 Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-slate-400">Clear</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure: DevOps Dashboard */}
      {role === "infrastructure" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              📡 Infrastructure Health
            </h4>
            <div className="space-y-3">
              {[
                { name: "Kubernetes Cluster", status: "Healthy", cpu: "42%", memory: "68%" },
                { name: "PostgreSQL Primary", status: "Healthy", cpu: "35%", memory: "72%" },
                { name: "Redis Cache", status: "Healthy", cpu: "15%", memory: "45%" },
                { name: "CDN Edge Nodes", status: "Healthy", cpu: "—", memory: "—" },
              ].map((infra, i) => (
                <div key={i} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-white font-medium">{infra.name}</span>
                    </div>
                    <span className="text-xs text-green-400">{infra.status}</span>
                  </div>
                  {infra.cpu !== "—" && (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">CPU:</span>
                        <span className="text-slate-300 ml-1">{infra.cpu}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Memory:</span>
                        <span className="text-slate-300 ml-1">{infra.memory}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Deployments */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              🚀 Recent Deployments
            </h4>
            <div className="space-y-2">
              {[
                { service: "customer-portal", version: "v2.4.1", time: "2 hours ago", status: "success" },
                { service: "claims-api", version: "v1.8.3", time: "5 hours ago", status: "success" },
                { service: "payment-gateway", version: "v3.1.0", time: "1 day ago", status: "success" },
                { service: "auth-service", version: "v1.2.1", time: "2 days ago", status: "rollback" },
              ].map((deploy, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm text-white font-medium">{deploy.service}</p>
                    <p className="text-xs text-slate-400">{deploy.version} • {deploy.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    deploy.status === "success" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {deploy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CI/CD Pipeline */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              🔄 CI/CD Pipeline
            </h4>
            <div className="space-y-3">
              {[
                { stage: "Build", status: "passed", duration: "3m 42s" },
                { stage: "Unit Tests", status: "passed", duration: "5m 18s" },
                { stage: "Integration Tests", status: "passed", duration: "8m 55s" },
                { stage: "Security Scan", status: "passed", duration: "4m 12s" },
                { stage: "Deploy to Staging", status: "running", duration: "1m 30s" },
                { stage: "Deploy to Prod", status: "pending", duration: "—" },
              ].map((stage, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stage.status === "passed" && <span className="text-green-400">✓</span>}
                    {stage.status === "running" && <span className="text-blue-400 animate-pulse">●</span>}
                    {stage.status === "pending" && <span className="text-slate-500">○</span>}
                    <span className={`text-sm ${stage.status === "pending" ? "text-slate-500" : "text-white"}`}>
                      {stage.stage}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{stage.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Optimization */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              💰 Cloud Cost Optimization
              {settings && !settings.costOptimization && (
                <span className="text-xs bg-slate-600 text-slate-400 px-2 py-0.5 rounded">OFF</span>
              )}
            </h4>
            {!settings || settings.costOptimization ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-green-400">$12,450</p>
                  <p className="text-xs text-slate-400">Saved this month</p>
                </div>
                <div className="space-y-2">
                  {[
                    { action: "Right-sized EC2 instances", savings: "$4,200" },
                    { action: "Reserved instance coverage", savings: "$5,800" },
                    { action: "Spot instances for batch", savings: "$1,650" },
                    { action: "S3 lifecycle policies", savings: "$800" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-400">{item.action}</span>
                      <span className="text-green-400">{item.savings}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                <p>Cost optimization disabled</p>
                <p className="text-xs mt-1">Enable in Settings to see savings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentation View */}
      {role === "documentation" && (
        <>
          {/* Architecture Overview */}
          <div className="bg-slate-700/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🏗️</span> System Architecture
            </h4>
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-blue-400 mb-2">Frontend Layer</h5>
                <ul className="text-sm text-slate-300 space-y-1 ml-4 list-disc">
                  <li>Next.js 15 (App Router) - Server/Client components</li>
                  <li>TypeScript - Type-safe development</li>
                  <li>Tailwind CSS - Utility-first styling</li>
                  <li>React Context - State management</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-green-400 mb-2">Backend Layer</h5>
                <ul className="text-sm text-slate-300 space-y-1 ml-4 list-disc">
                  <li>Java Spring Boot 3.2.1 - REST API server</li>
                  <li>JPA/Hibernate - ORM for database access</li>
                  <li>Spring Security - JWT authentication</li>
                  <li>API Gateway - Rate limiting, auth middleware</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-purple-400 mb-2">Database Layer</h5>
                <ul className="text-sm text-slate-300 space-y-1 ml-4 list-disc">
                  <li>PostgreSQL 15 - Relational database</li>
                  <li>15 tables with QUAD_ prefix</li>
                  <li>UUID primary keys for distributed systems</li>
                  <li>Audit trail tables for compliance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Test Flow */}
          <div className="bg-slate-700/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🧪</span> Sample Test Flow: Price Filter Feature
            </h4>
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-xs text-blue-400 font-semibold mb-1">STEP 1: UI Interaction</p>
                <p className="text-sm text-slate-300">Navigate to /products page → Click "Filters" button → Enter min=$50, max=$200 → Click "Apply"</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-xs text-green-400 font-semibold mb-1">STEP 2: API Call</p>
                <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded mt-1">
                  GET /api/products?minPrice=50&maxPrice=200
                </code>
                <p className="text-xs text-slate-400 mt-1">Expected: 200 OK with filtered products array</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-purple-500">
                <p className="text-xs text-purple-400 font-semibold mb-1">STEP 3: Database Query</p>
                <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded mt-1 font-mono whitespace-pre">
                  {`SELECT * FROM products
WHERE price >= 50 AND price <= 200
AND is_active = true
ORDER BY created_at DESC;`}
                </code>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-yellow-500">
                <p className="text-xs text-yellow-400 font-semibold mb-1">STEP 4: UI Verification</p>
                <p className="text-sm text-slate-300">Verify: All products shown have price between $50-$200 → No products outside range → Loading state shown during fetch</p>
              </div>
            </div>
          </div>

          {/* API Endpoints Reference */}
          <div className="bg-slate-700/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🔌</span> API Endpoints
            </h4>
            <div className="space-y-2">
              {[
                { method: "POST", endpoint: "/api/auth/signup", desc: "Create organization + user", auth: "No" },
                { method: "POST", endpoint: "/api/auth/login", desc: "Email/password authentication", auth: "No" },
                { method: "GET", endpoint: "/api/users/email/{email}", desc: "User lookup (OAuth linking)", auth: "No" },
                { method: "GET", endpoint: "/api/domains", desc: "Get user's domains", auth: "JWT" },
                { method: "POST", endpoint: "/api/domains", desc: "Create new domain", auth: "JWT" },
                { method: "GET", endpoint: "/api/flows", desc: "Get work flows", auth: "JWT" },
                { method: "POST", endpoint: "/api/flows", desc: "Create new flow", auth: "JWT" },
              ].map((api, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    api.method === "POST" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {api.method}
                  </span>
                  <code className="text-sm text-slate-300 font-mono flex-1">{api.endpoint}</code>
                  <span className="text-xs text-slate-400">{api.desc}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    api.auth === "No" ? "bg-slate-600 text-slate-400" : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {api.auth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Schema & Test Queries */}
          <div className="bg-slate-700/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🗄️</span> Database Schema & QA Test Queries
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-semibold text-slate-300 mb-2">Core Tables</h5>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["QUAD_companies", "QUAD_users", "QUAD_domains", "QUAD_circles", "QUAD_flows", "QUAD_roles",
                    "QUAD_domain_members", "QUAD_circle_members", "QUAD_domain_blueprints"].map(table => (
                    <div key={table} className="bg-slate-800/50 rounded px-2 py-1 text-slate-300 font-mono">
                      {table}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-blue-400 mb-2">QA Test Queries (for Test Team)</h5>
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-semibold">Verify User Creation</p>
                    <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded font-mono whitespace-pre">
                      {`SELECT u.email, u.role, c.name as company_name, u.created_at
FROM QUAD_users u
JOIN QUAD_companies c ON u.company_id = c.id
WHERE u.email = 'test@example.com';`}
                    </code>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-semibold">Check Flow Stage Transitions</p>
                    <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded font-mono whitespace-pre">
                      {`SELECT f.title, f.current_stage, fsh.from_stage, fsh.to_stage, fsh.transitioned_at
FROM QUAD_flows f
LEFT JOIN QUAD_flow_stage_history fsh ON f.id = fsh.flow_id
WHERE f.id = 'flow-uuid-here'
ORDER BY fsh.transitioned_at DESC;`}
                    </code>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-semibold">Verify Team Allocation</p>
                    <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded font-mono whitespace-pre">
                      {`SELECT u.email, dm.allocation_percentage, d.name as domain_name
FROM QUAD_domain_members dm
JOIN QUAD_users u ON dm.user_id = u.id
JOIN QUAD_domains d ON dm.domain_id = d.id
WHERE u.id = 'user-uuid-here';`}
                    </code>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-semibold">Check Circle Membership</p>
                    <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded font-mono whitespace-pre">
                      {`SELECT c.name as circle_name, c.number, u.email, cm.joined_at
FROM QUAD_circle_members cm
JOIN QUAD_circles c ON cm.circle_id = c.id
JOIN QUAD_users u ON cm.user_id = u.id
WHERE c.domain_id = 'domain-uuid-here'
ORDER BY c.number, u.email;`}
                    </code>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1 font-semibold">Audit OAuth Sign-in</p>
                    <code className="text-xs text-slate-300 block bg-slate-900 p-2 rounded font-mono whitespace-pre">
                      {`SELECT email, oauth_provider, oauth_provider_id, last_login_at
FROM QUAD_users
WHERE oauth_provider IS NOT NULL
ORDER BY last_login_at DESC
LIMIT 10;`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Simulated Chat Window - All Roles */}
      <div>
        <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <span>💬</span> Ask AI Assistant
          <span className="text-xs text-slate-500">(Try: "budget", "velocity", "tickets", "team")</span>
        </h4>
        <SimulatedChatWindow role={role} />
      </div>
    </div>
  );
}

function DomainsScreen({ role, orgName }: ScreenProps) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            name: "Digital Experience",
            projects: ["Customer Portal", "Mobile App"],
            members: 8,
            tech: "Next.js, Spring Boot, PostgreSQL",
            health: 87,
          },
          {
            name: "Data Engineering",
            projects: ["Claims Pipeline", "API Gateway"],
            members: 4,
            tech: "Spring Batch, SageMaker, Redshift",
            health: 92,
          },
        ].map((domain, i) => (
          <div key={i} className="bg-slate-700/30 rounded-xl p-5 hover:bg-slate-700/50 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">{domain.name}</h4>
              <span className={`text-sm font-bold ${domain.health >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                {domain.health}%
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">
                <span className="text-slate-500">Projects:</span> {domain.projects.join(", ")}
              </p>
              <p className="text-slate-400">
                <span className="text-slate-500">Members:</span> {domain.members} people
              </p>
              <p className="text-slate-400">
                <span className="text-slate-500">Tech:</span> {domain.tech}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-organizations (visible to Director and above) */}
      {(role === "director" || role === "senior_director") && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">Sub-Organizations</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { name: `${orgName} - US East`, teams: 3, members: 25 },
              { name: `${orgName} - US West`, teams: 2, members: 15 },
              { name: `${orgName} - India`, teams: 4, members: 35 },
            ].map((subOrg, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                <p className="font-medium text-white text-sm">{subOrg.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {subOrg.teams} teams • {subOrg.members} members
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RolesScreen({ role, teamAllocation }: ScreenProps) {
  return (
    <div className="space-y-4">
      {/* Allocation Overview Pie (for TL and above) */}
      {(role === "tech_lead" || role === "director" || role === "senior_director") && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Team Allocation Pie */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Team Allocation Overview</h4>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#334155" strokeWidth="10" fill="none" />
                  <circle cx="56" cy="56" r="48" stroke="#22c55e" strokeWidth="10" fill="none"
                    strokeDasharray="301" strokeDashoffset="45" />
                  <circle cx="56" cy="56" r="48" stroke="#eab308" strokeWidth="10" fill="none"
                    strokeDasharray="301" strokeDashoffset="270" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">8</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-slate-400">Optimal (6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-slate-400">Over-allocated (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-slate-400">Critical (1)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Warnings */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">⚠️ Allocation Issues</h4>
            <div className="space-y-2">
              {teamAllocation?.filter(m => m.warning).map((member, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    member.warning === "red"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium text-sm ${member.warning === "red" ? "text-red-400" : "text-yellow-400"}`}>
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.assigned}% assigned / {member.allocated}% allocated
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      member.warning === "red" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      +{member.assigned - member.allocated}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-700">
            <th className="pb-2">Name</th>
            <th className="pb-2">Role</th>
            <th className="pb-2">Allocated</th>
            <th className="pb-2">Assigned</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {(teamAllocation || []).map((user, i) => (
            <tr key={i} className="border-b border-slate-700/50">
              <td className="py-3 text-white">{user.name}</td>
              <td className="py-3 text-slate-400">{user.role}</td>
              <td className="py-3 text-slate-400">{user.allocated}%</td>
              <td className="py-3 text-slate-400">{user.assigned}%</td>
              <td className="py-3">
                {user.warning === "red" ? (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Critical</span>
                ) : user.warning === "yellow" ? (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Over</span>
                ) : (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdoptionScreen({ role }: ScreenProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 mb-4">
        Track each team member&apos;s skill and trust levels with AI-assisted development.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Sarah Chen", skill: 4, trust: 5, badge: "Champion" },
          { name: "Mike Rodriguez", skill: 3, trust: 4, badge: "Adopter" },
          { name: "Priya Sharma", skill: 5, trust: 5, badge: "Champion" },
          { name: "James Wilson", skill: 2, trust: 3, badge: "Learner" },
          { name: "Emma Thompson", skill: 3, trust: 4, badge: "Adopter" },
          { name: "David Kim", skill: 4, trust: 4, badge: "Adopter" },
        ].map((user, i) => (
          <div key={i} className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-white">{user.name}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                user.badge === "Champion" ? "bg-purple-500/20 text-purple-400" :
                user.badge === "Adopter" ? "bg-blue-500/20 text-blue-400" :
                "bg-slate-500/20 text-slate-400"
              }`}>
                {user.badge}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Skill</span>
                <span className="text-slate-300">{"⭐".repeat(user.skill)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trust</span>
                <span className="text-slate-300">{"⭐".repeat(user.trust)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportingScreen({ role }: ScreenProps) {
  return (
    <div className="space-y-6">
      {/* Velocity Chart Placeholder */}
      <div>
        <h4 className="text-sm font-semibold text-slate-400 mb-3">Velocity Trend (Last 6 Cycles)</h4>
        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-end gap-2 h-32">
            {[65, 72, 68, 78, 82, 87].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t"
                  style={{ height: `${val}%` }}
                />
                <span className="text-xs text-slate-500">C{i + 7}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg Cycle Time", value: "4.2 days", trend: "↓ 18%" },
          { label: "First Pass Rate", value: "94%", trend: "↑ 8%" },
          { label: "AI Utilization", value: "78%", trend: "↑ 23%" },
        ].map((metric, i) => (
          <div key={i} className="bg-slate-700/30 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-xs">{metric.label}</p>
            <p className="text-xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-green-400">{metric.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
