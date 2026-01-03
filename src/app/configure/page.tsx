"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

// Company size presets
const companySizes = [
  { id: "startup", name: "Startup", devs: "5-15", directors: 1, projects: 2 },
  { id: "medium", name: "Medium", devs: "15-50", directors: 2, projects: 6 },
  { id: "enterprise", name: "Enterprise", devs: "50-200+", directors: 4, projects: 12 },
];

// Integration definitions
const integrations = {
  projectManagement: [
    { id: "jira", name: "Jira", icon: "📋", auth: "OAuth 2.0" },
    { id: "azure", name: "Azure DevOps", icon: "🔷", auth: "PAT" },
    { id: "linear", name: "Linear", icon: "⚡", auth: "API Key" },
  ],
  sourceControl: [
    { id: "github", name: "GitHub", icon: "🐙", auth: "GitHub App" },
    { id: "gitlab", name: "GitLab", icon: "🦊", auth: "OAuth + Token" },
    { id: "bitbucket", name: "Bitbucket", icon: "🪣", auth: "App Password" },
  ],
  communication: [
    { id: "slack", name: "Slack", icon: "💬", auth: "Slack App" },
    { id: "teams", name: "MS Teams", icon: "👥", auth: "Graph API" },
    { id: "discord", name: "Discord", icon: "🎮", auth: "Bot Token" },
  ],
};

// Preset definitions
const adoptionLevels = [
  { id: "origin", name: "Origin", symbol: "0D", timeline: "12 months", desc: "Documentation-first, no agents" },
  { id: "vector", name: "Vector", symbol: "1D", timeline: "9 months", desc: "AI agents (sequential)" },
  { id: "plane", name: "Plane", symbol: "2D", timeline: "6 months", desc: "Parallel execution" },
  { id: "space", name: "Space", symbol: "3D", timeline: "4 months", desc: "End-to-end pipelines" },
  { id: "hyperspace", name: "Hyperspace", symbol: "4D", timeline: "2 months", desc: "Guardrails + self-improving" },
];

const estimationPresets = {
  platonic: { name: "Platonic Solids", values: ["D4", "D6", "D8", "D12", "D20"], labels: ["Tetrahedron", "Hexahedron", "Octahedron", "Dodecahedron", "Icosahedron"] },
  dice: { name: "Dice Notation", values: ["d4", "d6", "d8", "d12", "d20"], labels: ["d4", "d6", "d8", "d12", "d20"] },
  tshirt: { name: "T-Shirt Sizes", values: ["XS", "S", "M", "L", "XL"], labels: ["Extra Small", "Small", "Medium", "Large", "Extra Large"] },
  fibonacci: { name: "Fibonacci", values: ["1", "2", "3", "5", "8", "13"], labels: ["1", "2", "3", "5", "8", "13"] },
  powers: { name: "Powers of 2", values: ["1", "2", "4", "8", "16"], labels: ["2^0", "2^1", "2^2", "2^3", "2^4"] },
};

const typePresets = {
  short: { name: "Short", values: ["FEAT", "BUG", "SEC", "DEBT", "INFRA", "DOC", "SPIKE"] },
  long: { name: "Long", values: ["FEATURE", "BUGFIX", "SECURITY", "TECHDEBT", "INFRASTRUCTURE", "DOCUMENTATION", "RESEARCH"] },
  emoji: { name: "Emoji", values: ["✨", "🐛", "🔒", "🔧", "🏗️", "📝", "🔬"] },
};

const formatPresets = {
  mathematical: { name: "Mathematical", format: "{circle}-{estimate}-{type}", example: "C2-D8-FEAT" },
  descriptive: { name: "Descriptive", format: "{circle_name}/{type}/{priority}", example: "DEV/FEATURE/P2" },
  simple: { name: "Simple", format: "{type}-{estimate}", example: "FEAT-8" },
  github: { name: "GitHub Style", format: "{type}: {priority}", example: "feat: P2" },
  jira: { name: "Jira Style", format: "[{circle}] {type}", example: "[DEV] Feature" },
};

export default function ConfigurePage() {
  // Configuration Tab
  const [activeTab, setActiveTab] = useState<"config" | "company" | "integrations">("config");

  // Ticket Configuration State
  const [adoptionLevel, setAdoptionLevel] = useState(4); // Default: Hyperspace
  const [estimation, setEstimation] = useState<keyof typeof estimationPresets>("platonic");
  const [typeAbbrev, setTypeAbbrev] = useState<keyof typeof typePresets>("short");
  const [labelFormat, setLabelFormat] = useState<keyof typeof formatPresets>("mathematical");
  const [copied, setCopied] = useState(false);

  // Company Setup State
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState<string>("medium");
  const [adminEmail, setAdminEmail] = useState("");
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Integration State
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>({
    jira: true,
    github: true,
    slack: true,
  });

  // Team Structure State
  const [directors, setDirectors] = useState(2);
  const [projectsPerDirector, setProjectsPerDirector] = useState(3);
  const [enabledCircles, setEnabledCircles] = useState({
    management: true,
    development: true,
    qa: true,
    infrastructure: true,
  });

  // Generate mock API keys (in real app, these would come from backend)
  const generateOrgId = () => companyName ? `org_${companyName.toLowerCase().replace(/\s+/g, "_").slice(0, 10)}_${Math.random().toString(36).slice(2, 6)}` : "org_xxxxx";
  const apiKey = companyName ? `qk_live_${Math.random().toString(36).slice(2, 18)}` : "qk_live_xxxxxxxxxx";
  const apiSecret = "qs_" + "x".repeat(32);

  const toggleIntegration = (id: string) => {
    setEnabledIntegrations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCircle = (circle: keyof typeof enabledCircles) => {
    setEnabledCircles(prev => ({ ...prev, [circle]: !prev[circle] }));
  };

  // Generate sample labels based on current config
  const generateSampleLabels = () => {
    const est = estimationPresets[estimation].values;
    const types = typePresets[typeAbbrev].values;
    return [
      { circle: "C1", estimate: est[0], type: types[5], desc: "Circle 1 + " + estimationPresets[estimation].labels[0] + " + Documentation" },
      { circle: "C2", estimate: est[2], type: types[0], desc: "Circle 2 + " + estimationPresets[estimation].labels[2] + " + Feature" },
      { circle: "C3", estimate: est[1], type: types[1], desc: "Circle 3 + " + estimationPresets[estimation].labels[1] + " + Bug" },
      { circle: "C4", estimate: est[3], type: types[2], desc: "Circle 4 + " + estimationPresets[estimation].labels[3] + " + Security" },
    ];
  };

  // Generate YAML config
  const generateYaml = () => {
    const level = adoptionLevels[adoptionLevel];
    const enabledIntegrationsList = Object.entries(enabledIntegrations)
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);

    return `# QUAD Configuration
# Generated by QUAD Configurator
# Organization: ${companyName || "Your Company"}

version: "1.0"

# Organization
organization:
  id: "${generateOrgId()}"
  name: "${companyName || "Your Company"}"
  admin_email: "${adminEmail || "admin@yourcompany.com"}"
  plan: "${companySize}"

# API Keys (reference to vault or env vars)
credentials:
  quad_api_key: \${QUAD_API_KEY}  # from environment
  quad_org_id: \${QUAD_ORG_ID}
  ${enabledIntegrations.jira ? 'jira_oauth: ${JIRA_OAUTH_TOKEN}' : '# jira: disabled'}
  ${enabledIntegrations.github ? 'github_app_id: ${GITHUB_APP_ID}' : '# github: disabled'}
  ${enabledIntegrations.slack ? 'slack_bot_token: ${SLACK_BOT_TOKEN}' : '# slack: disabled'}

# Adoption Level
adoption:
  level: "${level.id}"
  name: "${level.name}"
  dimension: "${level.symbol}"
  timeline: "${level.timeline}"

# Integrations
integrations:
  enabled: [${enabledIntegrationsList.map(i => `"${i}"`).join(", ")}]
  ${enabledIntegrations.jira ? `
  jira:
    instance: "${companyName?.toLowerCase().replace(/\\s+/g, "") || "yourcompany"}.atlassian.net"
    project_key: "QUAD"` : ''}
  ${enabledIntegrations.github ? `
  github:
    org: "${companyName?.toLowerCase().replace(/\\s+/g, "-") || "yourcompany"}"
    default_branch: "main"` : ''}
  ${enabledIntegrations.slack ? `
  slack:
    workspace: "${companyName?.toLowerCase().replace(/\\s+/g, "") || "yourcompany"}"
    channels:
      alerts: "#quad-alerts"
      updates: "#project-updates"` : ''}

# Team Structure
team:
  directors: ${directors}
  projects_per_director: ${projectsPerDirector}
  total_projects: ${directors * projectsPerDirector}

# Circles
circles:
  ${enabledCircles.management ? '- { id: "C1", name: "Management", focus: "B80/T20", enabled: true }' : '# management: disabled'}
  ${enabledCircles.development ? '- { id: "C2", name: "Development", focus: "B30/T70", enabled: true }' : '# development: disabled'}
  ${enabledCircles.qa ? '- { id: "C3", name: "QA", focus: "B30/T70", enabled: true }' : '# qa: disabled'}
  ${enabledCircles.infrastructure ? '- { id: "C4", name: "Infrastructure", focus: "B20/T80", enabled: true }' : '# infrastructure: disabled'}

# Ticket Labels
ticket_labels:
  format: "${formatPresets[labelFormat].format}"

  estimation:
    preset: "${estimation}"
    values: [${estimationPresets[estimation].values.map(v => `"${v}"`).join(", ")}]

  types:
    preset: "${typeAbbrev}"
    values: [${typePresets[typeAbbrev].values.map(v => `"${v}"`).join(", ")}]

# Webhooks (auto-configured by QUAD Platform)
webhooks:
  jira: "https://quad.platform/hooks/jira/\${ORG_ID}"
  github: "https://quad.platform/hooks/github/\${ORG_ID}"
  slack: "https://quad.platform/hooks/slack/\${ORG_ID}"

# Agent Configuration
agents:
  enabled:
    - story-agent
    - dev-agent-ui
    - dev-agent-api
    - test-agent
    - review-agent
    - deploy-agent-dev
  requires_approval:
    - deploy-agent-prod
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateYaml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadYaml = () => {
    const blob = new Blob([generateYaml()], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quad.config.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleLabels = generateSampleLabels();

  return (
    <div className="min-h-screen text-white">
      <PageNavigation />

      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚙️</span>
            <h1 className="text-4xl font-bold">QUAD Configurator</h1>
          </div>
          <p className="text-slate-400">
            Set up your organization, connect integrations, and configure ticket labels. Export as quad.config.yaml.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-slate-700 pb-4">
          {[
            { id: "company", label: "1. Company Setup", icon: "🏢" },
            { id: "integrations", label: "2. Integrations", icon: "🔗" },
            { id: "config", label: "3. Configuration", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "company" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <div className="space-y-6">
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-blue-300">Company Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@acmecorp.com"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-3">Company Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {companySizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => {
                            setCompanySize(size.id);
                            setDirectors(size.directors);
                            setProjectsPerDirector(size.projects / size.directors);
                          }}
                          className={`p-4 rounded-lg border transition-all text-center ${
                            companySize === size.id
                              ? "bg-blue-500/20 border-blue-500 text-blue-300"
                              : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          <div className="font-bold text-lg">{size.name}</div>
                          <div className="text-xs opacity-70">{size.devs} devs</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Team Structure */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-green-300">Team Structure</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Directors</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={directors}
                        onChange={(e) => setDirectors(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Projects per Director</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={projectsPerDirector}
                        onChange={(e) => setProjectsPerDirector(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Projects:</span>
                      <span className="text-green-400 font-bold">{directors * projectsPerDirector}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-slate-400">Estimated Team Size:</span>
                      <span className="text-green-400 font-bold">{directors * projectsPerDirector * 8} - {directors * projectsPerDirector * 12} people</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-3">Enabled Circles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(enabledCircles).map(([circle, enabled]) => (
                        <label
                          key={circle}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            enabled ? "bg-green-500/20 border border-green-500/50" : "bg-slate-700/30 border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleCircle(circle as keyof typeof enabledCircles)}
                            className="accent-green-500"
                          />
                          <span className="capitalize">{circle}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* API Keys & Preview */}
            <div className="space-y-6">
              {/* API Keys */}
              <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-purple-300">Your API Keys</h2>
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    {showApiKeys ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">QUAD_ORG_ID</div>
                    <code className="text-sm text-purple-300 font-mono">{generateOrgId()}</code>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">QUAD_API_KEY</div>
                    <code className="text-sm text-purple-300 font-mono">
                      {showApiKeys ? apiKey : "qk_live_••••••••••••••••••"}
                    </code>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">QUAD_SECRET (shown once!)</div>
                    <code className="text-sm text-red-300 font-mono">
                      {showApiKeys ? apiSecret : "qs_••••••••••••••••••••••••••••••••"}
                    </code>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Store these securely. The secret is only shown once during setup.
                </p>
              </section>

              {/* Key Hierarchy Diagram */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="font-bold mb-4 text-slate-300">Key Hierarchy</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">ORG_KEY</span>
                    <span className="text-slate-600">─</span>
                    <span className="text-slate-500">Top level (your organization)</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-blue-400">└─ PROJECT_KEY</span>
                    <span className="text-slate-600">─</span>
                    <span className="text-slate-500">Per project</span>
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <span className="text-green-400">└─ AGENT_KEY</span>
                    <span className="text-slate-600">─</span>
                    <span className="text-slate-500">Per agent</span>
                  </div>
                  <div className="flex items-center gap-2 ml-12">
                    <span className="text-yellow-400">└─ SESSION_TOKEN</span>
                    <span className="text-slate-600">─</span>
                    <span className="text-slate-500">24hr TTL</span>
                  </div>
                </div>
              </section>

              {/* Next Step CTA */}
              <button
                onClick={() => setActiveTab("integrations")}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Continue to Integrations →
              </button>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Integration Selection */}
            <div className="space-y-6">
              {/* Project Management */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-blue-300">Project Management</h2>
                <div className="grid grid-cols-3 gap-3">
                  {integrations.projectManagement.map((int) => (
                    <button
                      key={int.id}
                      onClick={() => toggleIntegration(int.id)}
                      className={`p-4 rounded-lg border transition-all text-center ${
                        enabledIntegrations[int.id]
                          ? "bg-blue-500/20 border-blue-500 text-white"
                          : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className="text-2xl mb-2">{int.icon}</div>
                      <div className="font-medium text-sm">{int.name}</div>
                      <div className="text-xs opacity-60 mt-1">{int.auth}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Source Control */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-green-300">Source Control</h2>
                <div className="grid grid-cols-3 gap-3">
                  {integrations.sourceControl.map((int) => (
                    <button
                      key={int.id}
                      onClick={() => toggleIntegration(int.id)}
                      className={`p-4 rounded-lg border transition-all text-center ${
                        enabledIntegrations[int.id]
                          ? "bg-green-500/20 border-green-500 text-white"
                          : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className="text-2xl mb-2">{int.icon}</div>
                      <div className="font-medium text-sm">{int.name}</div>
                      <div className="text-xs opacity-60 mt-1">{int.auth}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Communication */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-yellow-300">Communication</h2>
                <div className="grid grid-cols-3 gap-3">
                  {integrations.communication.map((int) => (
                    <button
                      key={int.id}
                      onClick={() => toggleIntegration(int.id)}
                      className={`p-4 rounded-lg border transition-all text-center ${
                        enabledIntegrations[int.id]
                          ? "bg-yellow-500/20 border-yellow-500 text-white"
                          : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className="text-2xl mb-2">{int.icon}</div>
                      <div className="font-medium text-sm">{int.name}</div>
                      <div className="text-xs opacity-60 mt-1">{int.auth}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Webhook URLs & Connection Status */}
            <div className="space-y-6">
              {/* Connection Status */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-purple-300">Connection Status</h2>
                <div className="space-y-3">
                  {Object.entries(enabledIntegrations).filter(([, enabled]) => enabled).map(([id]) => {
                    const allIntegrations = [...integrations.projectManagement, ...integrations.sourceControl, ...integrations.communication];
                    const int = allIntegrations.find(i => i.id === id);
                    if (!int) return null;
                    return (
                      <div key={id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{int.icon}</span>
                          <span className="font-medium">{int.name}</span>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                          Pending Setup
                        </span>
                      </div>
                    );
                  })}
                  {Object.values(enabledIntegrations).filter(Boolean).length === 0 && (
                    <p className="text-slate-500 text-center py-4">No integrations selected</p>
                  )}
                </div>
              </section>

              {/* Webhook URLs */}
              <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-cyan-300">Webhook URLs</h2>
                <p className="text-sm text-slate-400 mb-4">Configure these in your integration settings:</p>
                <div className="space-y-3">
                  {enabledIntegrations.jira && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Jira Webhook</div>
                      <code className="text-xs text-cyan-300 font-mono break-all">
                        https://quad.platform/hooks/jira/{generateOrgId()}
                      </code>
                    </div>
                  )}
                  {enabledIntegrations.github && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">GitHub Webhook</div>
                      <code className="text-xs text-cyan-300 font-mono break-all">
                        https://quad.platform/hooks/github/{generateOrgId()}
                      </code>
                    </div>
                  )}
                  {enabledIntegrations.slack && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Slack Events URL</div>
                      <code className="text-xs text-cyan-300 font-mono break-all">
                        https://quad.platform/hooks/slack/{generateOrgId()}
                      </code>
                    </div>
                  )}
                </div>
              </section>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("company")}
                  className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
                >
                  ← Back to Company
                </button>
                <button
                  onClick={() => setActiveTab("config")}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                >
                  Continue to Config →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-8">
            {/* 1. Adoption Level Slider */}
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-blue-300">1. Adoption Level</h2>
              <p className="text-sm text-slate-400 mb-4">Choose how fast you want to transform</p>

              {/* Slider */}
              <div className="mb-6">
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={adoptionLevel}
                  onChange={(e) => setAdoptionLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  {adoptionLevels.map((level, i) => (
                    <span key={level.id} className={i === adoptionLevel ? "text-blue-400 font-bold" : ""}>
                      {level.symbol}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected Level Display */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-blue-400">{adoptionLevels[adoptionLevel].name}</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {adoptionLevels[adoptionLevel].timeline}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{adoptionLevels[adoptionLevel].desc}</p>
              </div>

              {/* Timeline Comparison */}
              <div className="mt-4 grid grid-cols-5 gap-1">
                {adoptionLevels.map((level, i) => (
                  <div
                    key={level.id}
                    className={`p-2 rounded text-center text-xs cursor-pointer transition-all ${
                      i === adoptionLevel
                        ? "bg-blue-500/30 border border-blue-500 text-white"
                        : "bg-slate-700/30 text-slate-500 hover:bg-slate-700/50"
                    }`}
                    onClick={() => setAdoptionLevel(i)}
                  >
                    <div className="font-bold">{level.symbol}</div>
                    <div className="text-[10px]">{level.timeline}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Estimation Scheme */}
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-green-300">2. Estimation Scheme</h2>
              <div className="space-y-2">
                {Object.entries(estimationPresets).map(([key, preset]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      estimation === key
                        ? "bg-green-500/20 border border-green-500/50"
                        : "bg-slate-700/30 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="estimation"
                        checked={estimation === key}
                        onChange={() => setEstimation(key as keyof typeof estimationPresets)}
                        className="accent-green-500"
                      />
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{preset.values.join(", ")}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 3. Type Abbreviation */}
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-yellow-300">3. Type Abbreviation</h2>
              <div className="space-y-2">
                {Object.entries(typePresets).map(([key, preset]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      typeAbbrev === key
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : "bg-slate-700/30 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="typeAbbrev"
                        checked={typeAbbrev === key}
                        onChange={() => setTypeAbbrev(key as keyof typeof typePresets)}
                        className="accent-yellow-500"
                      />
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{preset.values.slice(0, 4).join(", ")}...</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 4. Label Format */}
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-purple-300">4. Label Format</h2>
              <div className="space-y-2">
                {Object.entries(formatPresets).map(([key, preset]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      labelFormat === key
                        ? "bg-purple-500/20 border border-purple-500/50"
                        : "bg-slate-700/30 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="labelFormat"
                        checked={labelFormat === key}
                        onChange={() => setLabelFormat(key as keyof typeof formatPresets)}
                        className="accent-purple-500"
                      />
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <code className="text-xs bg-slate-900 px-2 py-1 rounded text-purple-300">{preset.example}</code>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Preview & Export */}
          <div className="space-y-8">
            {/* Live Preview */}
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 sticky top-20">
              <h2 className="text-xl font-bold mb-4 text-cyan-300">Live Preview</h2>

              {/* Sample Labels */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400 mb-4">Your ticket labels will look like:</p>
                <div className="grid grid-cols-2 gap-3">
                  {sampleLabels.map((label, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                      <div className="font-mono text-lg text-white mb-1">
                        {label.circle}-{label.estimate}-{label.type}
                      </div>
                      <div className="text-xs text-slate-500">{label.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Config Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3 text-slate-300">Configuration Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Adoption Level:</span>
                    <span className="text-blue-300">{adoptionLevels[adoptionLevel].name} ({adoptionLevels[adoptionLevel].symbol})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimation:</span>
                    <span className="text-green-300">{estimationPresets[estimation].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type Style:</span>
                    <span className="text-yellow-300">{typePresets[typeAbbrev].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Label Format:</span>
                    <span className="text-purple-300">{formatPresets[labelFormat].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timeline:</span>
                    <span className="text-cyan-300">{adoptionLevels[adoptionLevel].timeline}</span>
                  </div>
                </div>
              </div>

              {/* YAML Preview */}
              <div className="bg-slate-900 rounded-lg p-4 mb-6 max-h-64 overflow-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre">{generateYaml()}</pre>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={downloadYaml}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Download YAML
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>
            </section>

            {/* Documentation Links */}
            <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <h3 className="font-bold mb-4">Related Documentation</h3>
              <div className="space-y-2">
                <Link href="/docs/quad-workflow/QUAD_ADOPTION_LEVELS" className="block text-blue-300 hover:text-blue-200 text-sm">
                  Adoption Levels (0D-4D) →
                </Link>
                <Link href="/docs/quad-workflow/QUAD_STORY_LABELS" className="block text-blue-300 hover:text-blue-200 text-sm">
                  Story Labels System →
                </Link>
                <Link href="/docs/QUAD_JARGONS" className="block text-blue-300 hover:text-blue-200 text-sm">
                  QUAD Terminology →
                </Link>
              </div>
            </section>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("integrations")}
                className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              >
                ← Back to Integrations
              </button>
              <Link
                href="/demo"
                className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all text-center"
              >
                View Demo Dashboard →
              </Link>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
