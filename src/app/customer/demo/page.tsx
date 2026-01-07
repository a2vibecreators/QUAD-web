"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Customer Demo Page
 *
 * Part 1: QUAD Concept (no password) - The problem and solution
 * Part 2: Interactive Demo (password) - Dashboard screens shown inline
 */

// Demo password
const DEMO_PASSWORD = "Ashrith";

// Demo screen data
const DEMO_SCREENS = [
  {
    id: "dashboard",
    icon: "🏠",
    title: "Executive Dashboard",
    desc: "High-level view of all projects, velocity metrics, and team performance",
  },
  {
    id: "domains",
    icon: "📁",
    title: "Domains & Projects",
    desc: "Mobile App, API Gateway, Customer Portal - all configured",
  },
  {
    id: "roles",
    icon: "👥",
    title: "Teams & Roles",
    desc: "See how developers are allocated across multiple projects with percentages",
  },
  {
    id: "adoption",
    icon: "🎯",
    title: "Adoption Matrix",
    desc: "Track skill and trust levels for each team member",
  },
  {
    id: "reporting",
    icon: "📊",
    title: "Reporting",
    desc: "Velocity, burndown, and productivity metrics",
  },
];

export default function CustomerDemo() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  const handlePasswordSubmit = () => {
    if (password.toLowerCase() === DEMO_PASSWORD.toLowerCase()) {
      setUnlocked(true);
      setShowPasswordModal(false);
      setActiveScreen("dashboard"); // Show first screen after unlock
    } else {
      setPasswordError(true);
    }
  };

  const handleScreenClick = (screenId: string) => {
    if (unlocked) {
      setActiveScreen(screenId);
    } else {
      setShowPasswordModal(true);
      setPassword("");
      setPasswordError(false);
    }
  };

  return (
    <div className="text-white">
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

      {/* ========================================= */}
      {/* PART 1: QUAD CONCEPT (No Password)       */}
      {/* ========================================= */}

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-6">
            Part 1: Understanding QUAD
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            First, Let&apos;s Understand{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              The Problem
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Before we show you the platform, let&apos;s make sure we&apos;re solving the right problem.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-12 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="text-red-400">The Problem:</span> Why 1 Paragraph Takes 6 Weeks
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: "📝",
                title: "The Telephone Game",
                problem: "Business → BA → PM → TL → Dev",
                result: "30-40% rework because requirements get lost in translation",
              },
              {
                icon: "📅",
                title: "Ceremony Overload",
                problem: "Sprint planning, standups, retros, refinement...",
                result: "20% of time talking about work instead of doing it",
              },
              {
                icon: "🤖",
                title: "AI Without Strategy",
                problem: "Everyone uses different AI tools with no governance",
                result: "Can&apos;t measure ROI or ensure code quality",
              },
              {
                icon: "😓",
                title: "Developer Burnout",
                problem: "Weekend deployments, crunch time, firefighting",
                result: "Best engineers leave for better work-life balance",
              },
            ].map((item, i) => (
              <div key={i} className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-red-400 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm mb-2">{item.problem}</p>
                <p className="text-slate-300 text-sm font-medium">{item.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The QUAD Solution */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="text-green-400">The Solution:</span> QUAD Methodology
          </h2>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 mb-12">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                { letter: "Q", name: "Question", time: "10 min", desc: "BA describes need in plain English" },
                { letter: "U", name: "Understand", time: "30 min", desc: "AI expands to detailed spec" },
                { letter: "A", name: "Automate", time: "2-4 hrs", desc: "AI generates production code" },
                { letter: "D", name: "Deliver", time: "1-2 hrs", desc: "Human validates and deploys" },
              ].map((step, i) => (
                <div key={i}>
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-3">
                    {step.letter}
                  </div>
                  <h3 className="font-bold text-white">{step.name}</h3>
                  <p className="text-green-400 text-sm font-bold">{step.time}</p>
                  <p className="text-slate-400 text-xs mt-1">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 pt-6 border-t border-blue-500/20">
              <p className="text-lg">
                Total time: <span className="text-red-400 line-through">6-9 weeks</span> →{" "}
                <span className="text-green-400 font-bold">3-7 hours</span>
              </p>
            </div>
          </div>

          {/* Channelized AI Energy */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-8 border border-yellow-500/20">
            <h3 className="text-xl font-bold text-center mb-4">Channelized AI Energy</h3>
            <p className="text-center text-slate-400 mb-6">
              Think of AI like <span className="text-yellow-400 font-bold">electricity</span> -
              raw electricity is dangerous. Through proper wiring, it powers your home safely.
            </p>
            <p className="text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              QUAD is the wiring.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="py-8 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6"></div>
          <p className="text-slate-500">Now that you understand the concept...</p>
        </div>
      </div>

      {/* ========================================= */}
      {/* PART 2: INTERACTIVE DEMO (Password)      */}
      {/* ========================================= */}

      <section className="py-12 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
              Part 2: Interactive Demo
            </div>
            <h2 className="text-3xl font-bold mb-4">
              See QUAD In Action
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We&apos;ve pre-configured a Customer organization. You&apos;ll log in as{" "}
              <code className="bg-slate-700 px-2 py-1 rounded text-green-400">admin@customer.demo</code>{" "}
              and explore the platform.
            </p>
          </div>

          {/* Demo Environment Info */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
            <h3 className="font-bold text-white mb-4">Demo Environment Setup</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400">Organization</p>
                <p className="text-white font-bold">Customer Organization</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400">Logged in as</p>
                <p className="text-white font-bold">admin@customer.demo</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400">Role</p>
                <p className="text-white font-bold">Admin (Senior Director)</p>
              </div>
            </div>
          </div>

          {/* Screen Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {DEMO_SCREENS.map((screen) => (
              <button
                key={screen.id}
                onClick={() => handleScreenClick(screen.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeScreen === screen.id
                    ? "bg-blue-600 text-white"
                    : unlocked
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                <span>{screen.icon}</span>
                <span>{screen.title}</span>
                {!unlocked && <span>🔐</span>}
              </button>
            ))}
          </div>

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

          {/* Demo Screen Content (when unlocked) */}
          {unlocked && activeScreen && (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              {/* Screen Header */}
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{DEMO_SCREENS.find(s => s.id === activeScreen)?.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{DEMO_SCREENS.find(s => s.id === activeScreen)?.title}</h3>
                    <p className="text-xs text-slate-400">admin@customer.demo • Senior Director</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                  Live Demo
                </div>
              </div>

              {/* Screen Content */}
              <div className="p-6">
                {activeScreen === "dashboard" && <DashboardScreen />}
                {activeScreen === "domains" && <DomainsScreen />}
                {activeScreen === "roles" && <RolesScreen />}
                {activeScreen === "adoption" && <AdoptionScreen />}
                {activeScreen === "reporting" && <ReportingScreen />}
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
            Step 3 of 5
          </div>
          <h2 className="text-2xl font-bold mb-4">Next: Calculate Your ROI</h2>
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

function DashboardScreen() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: "3", change: "+1 this month" },
          { label: "Team Members", value: "12", change: "Across 2 domains" },
          { label: "Active Flows", value: "24", change: "8 in Automate" },
          { label: "Velocity", value: "87%", change: "+12% vs last cycle" },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-700/50 rounded-xl p-4">
            <p className="text-slate-400 text-xs">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-green-400">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Projects List */}
      <div>
        <h4 className="text-sm font-semibold text-slate-400 mb-3">Active Projects</h4>
        <div className="space-y-2">
          {[
            { name: "Customer Portal", health: 87, stage: "Sprint 12", flows: 12 },
            { name: "Mobile App", health: 92, stage: "Sprint 8", flows: 8 },
            { name: "API Gateway", health: 78, stage: "Sprint 5", flows: 4 },
          ].map((project, i) => (
            <div key={i} className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{project.name}</p>
                <p className="text-xs text-slate-400">{project.stage} • {project.flows} active flows</p>
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
    </div>
  );
}

function DomainsScreen() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            name: "Digital Experience",
            projects: ["Customer Portal", "Mobile App"],
            members: 8,
            tech: "Next.js, Spring Boot, PostgreSQL",
          },
          {
            name: "Data Engineering",
            projects: ["Claims Pipeline", "API Gateway"],
            members: 4,
            tech: "Spring Batch, SageMaker, Redshift",
          },
        ].map((domain, i) => (
          <div key={i} className="bg-slate-700/30 rounded-xl p-5">
            <h4 className="font-bold text-white mb-2">{domain.name}</h4>
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
    </div>
  );
}

function RolesScreen() {
  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-700">
            <th className="pb-2">Name</th>
            <th className="pb-2">Role</th>
            <th className="pb-2">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Sarah Chen", role: "Senior Director", alloc: "40% CP + 40% CLM" },
            { name: "Mike Rodriguez", role: "Team Lead", alloc: "80% CP + 20% CLM" },
            { name: "Priya Sharma", role: "Principal Engineer", alloc: "70% CLM + 30% CP" },
            { name: "James Wilson", role: "Senior Developer", alloc: "100% CP" },
            { name: "Emma Thompson", role: "QA Lead", alloc: "60% CP + 40% CLM" },
            { name: "David Kim", role: "Platform Engineer", alloc: "50% CP + 50% CLM" },
          ].map((user, i) => (
            <tr key={i} className="border-b border-slate-700/50">
              <td className="py-3 text-white">{user.name}</td>
              <td className="py-3 text-slate-400">{user.role}</td>
              <td className="py-3 text-slate-400">{user.alloc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdoptionScreen() {
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

function ReportingScreen() {
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
