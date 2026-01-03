"use client";

import { useState, useEffect } from "react";
import PageNavigation from "@/components/PageNavigation";

export default function QUADFlow() {
  // Animation state for the SVG flow
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance animation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 7);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Toggle states for trigger sources
  const [triggers, setTriggers] = useState({
    jira: true,
    slack: true,
    email: false,
    github: true,
    teams: false,
    cron: false,
  });

  const toggleTrigger = (key: string) => {
    setTriggers((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const flowSteps = [
    { id: 0, label: "Requirement", icon: "📋", desc: "Single source of truth", color: "blue" },
    { id: 1, label: "Story Agent", icon: "🤖", desc: "AI enhances requirement", color: "purple" },
    { id: 2, label: "Story", icon: "📝", desc: "Expanded with specs", color: "green" },
    { id: 3, label: "Sub-Tasks", icon: "📦", desc: "Broken into work items", color: "yellow" },
    { id: 4, label: "Assignment", icon: "🎯", desc: "AI assigns to circles", color: "orange" },
    { id: 5, label: "Circles", icon: "⭕", desc: "Teams execute work", color: "pink" },
    { id: 6, label: "Delivery", icon: "🚀", desc: "Feature complete", color: "cyan" },
  ];

  const sections = [
    { id: "flow-animation", title: "Flow Animation" },
    { id: "trigger-panel", title: "Trigger Control" },
    { id: "journey", title: "8-Step Journey" },
    { id: "assignment", title: "Assignment Agent" },
  ];

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔄</span>
            <h1 className="text-4xl font-bold">Source of Truth Flow</h1>
          </div>
          <p className="text-slate-400">
            Watch how a requirement flows through QUAD - from idea to delivery
          </p>
        </div>

        {/* Animated Flow SVG */}
        <section id="flow-animation" className="mb-16 scroll-mt-32">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-300">Live Flow Animation</h2>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isPlaying
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-green-500/20 text-green-300 border border-green-500/30"
                }`}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>

            {/* SVG Flow Diagram */}
            <div className="relative">
              <svg viewBox="0 0 1000 300" className="w-full h-auto">
                {/* Background gradient */}
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Flow path */}
                <path
                  d="M 50 150 L 950 150"
                  stroke="url(#flowGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="8,4"
                />

                {/* Animated pulse on path */}
                <circle r="8" fill="#60A5FA" filter="url(#glow)">
                  <animateMotion dur="14s" repeatCount="indefinite">
                    <mpath href="#flowPath" />
                  </animateMotion>
                </circle>
                <path id="flowPath" d="M 50 150 L 950 150" fill="none" />

                {/* Flow nodes */}
                {flowSteps.map((step, i) => {
                  const x = 80 + i * 130;
                  const isActive = activeStep === i;
                  const colors: Record<string, string> = {
                    blue: "#3B82F6",
                    purple: "#8B5CF6",
                    green: "#10B981",
                    yellow: "#F59E0B",
                    orange: "#F97316",
                    pink: "#EC4899",
                    cyan: "#06B6D4",
                  };
                  const color = colors[step.color];

                  return (
                    <g key={step.id} onClick={() => setActiveStep(i)} style={{ cursor: "pointer" }}>
                      {/* Glow effect when active */}
                      {isActive && (
                        <circle
                          cx={x}
                          cy={150}
                          r={45}
                          fill={color}
                          opacity={0.3}
                          filter="url(#glow)"
                        >
                          <animate
                            attributeName="r"
                            values="40;50;40"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Node circle */}
                      <circle
                        cx={x}
                        cy={150}
                        r={isActive ? 38 : 32}
                        fill={isActive ? color : "#1E293B"}
                        stroke={color}
                        strokeWidth={isActive ? 3 : 2}
                        style={{ transition: "all 0.3s ease" }}
                      />

                      {/* Icon */}
                      <text
                        x={x}
                        y={155}
                        textAnchor="middle"
                        fontSize={isActive ? 28 : 24}
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {step.icon}
                      </text>

                      {/* Label */}
                      <text
                        x={x}
                        y={210}
                        textAnchor="middle"
                        fill={isActive ? "#FFFFFF" : "#94A3B8"}
                        fontSize={12}
                        fontWeight={isActive ? "bold" : "normal"}
                      >
                        {step.label}
                      </text>

                      {/* Description (only show when active) */}
                      {isActive && (
                        <text
                          x={x}
                          y={230}
                          textAnchor="middle"
                          fill="#64748B"
                          fontSize={10}
                        >
                          {step.desc}
                        </text>
                      )}

                      {/* Step number */}
                      <circle
                        cx={x + 25}
                        cy={120}
                        r={12}
                        fill={isActive ? color : "#334155"}
                      />
                      <text
                        x={x + 25}
                        y={124}
                        textAnchor="middle"
                        fill="white"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        {i + 1}
                      </text>

                      {/* Arrow to next (except last) */}
                      {i < flowSteps.length - 1 && (
                        <path
                          d={`M ${x + 40} 150 L ${x + 90} 150`}
                          stroke={activeStep > i ? color : "#475569"}
                          strokeWidth={2}
                          markerEnd="url(#arrowhead)"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                  </marker>
                </defs>
              </svg>
            </div>

            {/* Step details card */}
            <div className="mt-6 bg-slate-900/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{flowSteps[activeStep].icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Step {activeStep + 1}: {flowSteps[activeStep].label}
                  </h3>
                  <p className="text-slate-400">{flowSteps[activeStep].desc}</p>
                </div>
              </div>

              {/* Step-specific content */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                {activeStep === 0 && (
                  <>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-blue-300 font-semibold mb-1">Input Sources</div>
                      <div className="text-slate-400">Jira, Slack, Email, GitHub</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-blue-300 font-semibold mb-1">Format</div>
                      <div className="text-slate-400">Brief, 1-2 sentences</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-blue-300 font-semibold mb-1">Owner</div>
                      <div className="text-slate-400">Product Manager / BA</div>
                    </div>
                  </>
                )}
                {activeStep === 1 && (
                  <>
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                      <div className="text-purple-300 font-semibold mb-1">AI Model</div>
                      <div className="text-slate-400">Claude / GPT-4 / Gemini</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                      <div className="text-purple-300 font-semibold mb-1">Actions</div>
                      <div className="text-slate-400">Expand, clarify, add specs</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                      <div className="text-purple-300 font-semibold mb-1">Output</div>
                      <div className="text-slate-400">Acceptance criteria, edge cases</div>
                    </div>
                  </>
                )}
                {activeStep === 2 && (
                  <>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="text-green-300 font-semibold mb-1">Contains</div>
                      <div className="text-slate-400">User story, AC, tech notes</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="text-green-300 font-semibold mb-1">Estimation</div>
                      <div className="text-slate-400">Polyhedral complexity score</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="text-green-300 font-semibold mb-1">Status</div>
                      <div className="text-slate-400">Ready for breakdown</div>
                    </div>
                  </>
                )}
                {activeStep === 3 && (
                  <>
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                      <div className="text-yellow-300 font-semibold mb-1">Task Types</div>
                      <div className="text-slate-400">UI, API, DB, Test, Deploy</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                      <div className="text-yellow-300 font-semibold mb-1">Dependencies</div>
                      <div className="text-slate-400">Auto-detected by AI</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                      <div className="text-yellow-300 font-semibold mb-1">Parallelism</div>
                      <div className="text-slate-400">UI + API can run together</div>
                    </div>
                  </>
                )}
                {activeStep === 4 && (
                  <>
                    <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                      <div className="text-orange-300 font-semibold mb-1">Detection</div>
                      <div className="text-slate-400">AI-based or rule-based</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                      <div className="text-orange-300 font-semibold mb-1">Within Circle</div>
                      <div className="text-slate-400">Round-robin + skills + learning</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                      <div className="text-orange-300 font-semibold mb-1">Human Approval</div>
                      <div className="text-slate-400">HYBRID mode (recommended)</div>
                    </div>
                  </>
                )}
                {activeStep === 5 && (
                  <>
                    <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                      <div className="text-pink-300 font-semibold mb-1">Circle 1</div>
                      <div className="text-slate-400">Management (BA, PM)</div>
                    </div>
                    <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                      <div className="text-pink-300 font-semibold mb-1">Circle 2 &amp; 3</div>
                      <div className="text-slate-400">Dev + QA (parallel)</div>
                    </div>
                    <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                      <div className="text-pink-300 font-semibold mb-1">Circle 4</div>
                      <div className="text-slate-400">Infrastructure (DevOps)</div>
                    </div>
                  </>
                )}
                {activeStep === 6 && (
                  <>
                    <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                      <div className="text-cyan-300 font-semibold mb-1">Deployed To</div>
                      <div className="text-slate-400">DEV → QA → PROD</div>
                    </div>
                    <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                      <div className="text-cyan-300 font-semibold mb-1">Verification</div>
                      <div className="text-slate-400">All tests passed</div>
                    </div>
                    <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                      <div className="text-cyan-300 font-semibold mb-1">Feedback Loop</div>
                      <div className="text-slate-400">Back to Source of Truth</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trigger Control Panel */}
        <section id="trigger-panel" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Trigger Control Panel</h2>
          <p className="text-slate-400 mb-6">
            Toggle trigger sources on/off. Requirements can come from any enabled source.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "jira", name: "Jira", icon: "🎫", desc: "Issue created/updated webhooks", example: "PROJECT-123 created" },
              { key: "slack", name: "Slack", icon: "💬", desc: "Channel, DM, mention, emoji reactions", example: "#requirements or @story-agent" },
              { key: "email", name: "Email", icon: "📧", desc: "Watch inbox, specific senders/domains", example: "pm@company.com → inbox" },
              { key: "github", name: "GitHub", icon: "🐙", desc: "Issues, PRs, discussions, comments", example: "Issue #42 opened" },
              { key: "teams", name: "MS Teams", icon: "👥", desc: "Channel messages, @mentions", example: "General channel post" },
              { key: "cron", name: "Scheduled", icon: "⏰", desc: "Time-based triggers (daily, weekly)", example: "Every Monday 9 AM" },
            ].map((trigger) => (
              <div
                key={trigger.key}
                className={`relative rounded-xl p-5 border transition-all cursor-pointer ${
                  triggers[trigger.key as keyof typeof triggers]
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-800/30 border-slate-700 opacity-60"
                }`}
                onClick={() => toggleTrigger(trigger.key)}
              >
                {/* Toggle Switch */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      triggers[trigger.key as keyof typeof triggers] ? "bg-green-500" : "bg-slate-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        triggers[trigger.key as keyof typeof triggers] ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{trigger.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{trigger.name}</h3>
                    <p className="text-xs text-slate-400">{trigger.desc}</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-500">Example: </span>
                  <span className="text-slate-300">{trigger.example}</span>
                </div>

                {triggers[trigger.key as keyof typeof triggers] && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Active triggers summary */}
          <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Active Sources:</span>
              <div className="flex gap-2">
                {Object.entries(triggers)
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <span key={k} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                      {k}
                    </span>
                  ))}
                {Object.values(triggers).every((v) => !v) && (
                  <span className="text-slate-500">None (enable at least one)</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 8-Step Adoption Journey (2×QUAD) */}
        <section id="journey" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">8-Step Adoption Journey (2×QUAD)</h2>
          <p className="text-slate-400 mb-8">
            QUAD adoption happens in two phases: <strong className="text-white">First QUAD</strong> (Foundation)
            and <strong className="text-white">Second QUAD</strong> (Acceleration).
          </p>

          {/* First QUAD */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">First QUAD</span>
              <span className="text-slate-400 text-sm">Foundation Phase</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: 1, name: "DEFINE", letter: "D", desc: "Define circles, map existing roles", icon: "📋", color: "blue" },
                { step: 2, name: "DEVELOP", letter: "E", desc: "Establish docs-first workflow", icon: "📝", color: "green" },
                { step: 3, name: "DELIVER", letter: "V", desc: "Verify with pilot project", icon: "✅", color: "yellow" },
                { step: 4, name: "DEPLOY", letter: "E", desc: "Deploy to full team", icon: "🚀", color: "purple" },
              ].map((item) => (
                <div key={item.step} className={`bg-${item.color}-500/10 rounded-xl p-5 border border-${item.color}-500/20`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full bg-${item.color}-500/30 flex items-center justify-center text-${item.color}-300 font-bold`}>
                      {item.step}
                    </span>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm">Foundation Complete → Begin Acceleration</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Second QUAD */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">Second QUAD</span>
              <span className="text-slate-400 text-sm">Acceleration Phase</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: 5, name: "PIPELINE", letter: "P", desc: "Add AI agent pipelines", icon: "🤖", color: "pink" },
                { step: 6, name: "PARALLEL", letter: "A", desc: "Enable parallel execution", icon: "⚡", color: "orange" },
                { step: 7, name: "GUARDRAILS", letter: "R", desc: "Refine permissions & safety", icon: "🛡️", color: "red" },
                { step: 8, name: "FEEDBACK", letter: "A", desc: "Activate learning loops", icon: "🔄", color: "cyan" },
              ].map((item) => (
                <div key={item.step} className={`bg-${item.color}-500/10 rounded-xl p-5 border border-${item.color}-500/20`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full bg-${item.color}-500/30 flex items-center justify-center text-${item.color}-300 font-bold`}>
                      {item.step}
                    </span>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assignment Agent with Learning */}
        <section id="assignment" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Assignment Agent with Learning</h2>
          <p className="text-slate-400 mb-6">
            The Assignment Agent suggests who should work on each sub-task. It learns from reassignments.
          </p>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            {/* Mode Selection */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-slate-400">Mode:</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                HYBRID (Recommended)
              </span>
              <span className="text-xs text-slate-500">AI suggests → Human approves</span>
            </div>

            {/* Learning Flow */}
            <div className="grid md:grid-cols-6 gap-4 mb-6">
              {[
                { step: 1, icon: "📊", name: "Collect", desc: "Record all assignments" },
                { step: 2, icon: "🔍", name: "Extract", desc: "Task features (type, skills)" },
                { step: 3, icon: "📈", name: "Score", desc: "Build affinity scores" },
                { step: 4, icon: "🔄", name: "Update", desc: "Learn from reassignments" },
                { step: 5, icon: "🧠", name: "Infer", desc: "Predict best assignee" },
                { step: 6, icon: "✅", name: "Verify", desc: "Human confirms or overrides" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-2xl mb-2">
                    {item.icon}
                  </div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Example Scenario */}
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
              <h4 className="font-semibold text-white mb-4">Example: Learning from Reassignment</h4>

              <div className="space-y-4">
                {/* Step 1: Initial Assignment */}
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 text-sm">1</span>
                  <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-300">🎫</span>
                      <span className="text-white font-medium">UI-123: Payment Form</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-sm">Assigned: Alice</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Based on: round-robin + React skill match</div>
                  </div>
                </div>

                {/* Step 2: Reassignment */}
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center text-yellow-300 text-sm">2</span>
                  <div className="flex-1 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-300">⚠️</span>
                      <span className="text-white">PM reassigns ticket</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-sm line-through">Alice</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-sm">Bob</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Reason: Bob has payment gateway experience</div>
                  </div>
                </div>

                {/* Step 3: Learning */}
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center text-green-300 text-sm">3</span>
                  <div className="flex-1 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="text-white font-medium mb-2">🧠 Agent Learns:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/50 rounded px-2 py-1">
                        <span className="text-red-300">Alice:</span> payment_form affinity -0.1
                      </div>
                      <div className="bg-slate-900/50 rounded px-2 py-1">
                        <span className="text-green-300">Bob:</span> payment_form affinity +0.2
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Future */}
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-sm">4</span>
                  <div className="flex-1 bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300">🔮</span>
                      <span className="text-white">Next payment-related task</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-sm">Suggests: Bob</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Agent remembers Bob is better for payment features</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <section>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/20">
            <h2 className="text-2xl font-bold mb-6 text-center">Key Concepts Summary</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: "📋", title: "Source of Truth", desc: "One requirement → one flow → many tasks" },
                { icon: "🔌", title: "Pluggable Triggers", desc: "Any source: Jira, Slack, Email, GitHub" },
                { icon: "8️⃣", title: "2×QUAD Journey", desc: "8 steps: Foundation + Acceleration" },
                { icon: "🧠", title: "Learning Agent", desc: "Improves from every reassignment" },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
