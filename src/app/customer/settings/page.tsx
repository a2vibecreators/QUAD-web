"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CUSTOMER_FEATURES,
  getDefaultEnabledState,
  type Part,
  type Category,
  type Feature,
} from "@/config/customer-features";

// Preset definitions - QUAD math terminology with collaborative subtitles
const PRESETS = {
  all: {
    name: "FULL MATRIX",
    subtitle: "Σ All Features",
    description: "Complete demonstration of our platform capabilities",
    icon: "📐",
  },
  mustHave: {
    name: "PILOT VECTOR",
    subtitle: "→ 4-Week Start",
    description: "Core features for our initial pilot together",
    icon: "🎯",
  },
  goodToHave: {
    name: "GROWTH PLANE",
    subtitle: "□ Phase 2",
    description: "Extended features for full rollout after pilot",
    icon: "📊",
  },
  custom: {
    name: "CUSTOM PATH",
    subtitle: "• Your Selection",
    description: "Build your own feature set - you decide",
    icon: "⚙️",
  },
};

// Must-have features for pilot (core demo features)
const MUST_HAVE_KEYS = [
  // Part 1: Pain
  "problemStatement",
  "agilePainPoints",
  "traditionalWorkflow",
  // Part 2: Solution
  "quadModel",
  "quadQuery",
  "quadUnderstand",
  "quadAct",
  "quadDeploy",
  "cycleTime",
  "humanGates",
  // Part 3: How
  "documentFirst",
  "aiReadsDoc",
  "agentFlow",
  "agentBA",
  "agentDev",
  "agentQA",
  "agentDevOps",
  // Part 4: Proof (Killer Demo)
  "docRenderer",
  "docRAG",
  "testJourneys",
  "apiTableMapping",
  "sampleQueries",
  "qaOnboarding",
  // Part 5: Enterprise
  "auditTrail",
  "jiraIntegration",
  "githubIntegration",
  "ssoIntegration",
  "vscodePlugin",
  // Part 6: ROI
  "dashboards",
  "flowAnalytics",
  "costAnalytics",
  "talentRetention",
  // QUAD FLUX (AI Strategy)
  "multiAiRouting",
  "providerAgnostic",
  "tokenOptimization",
  "aiFailover",
  // Cloud Strategy (for Customer)
  "cloudAgnostic",
  "multiCloudSupport",
  "awsIntegration",
  "cloudCostOptimization",
];

// Good to have (extended features)
const GOOD_TO_HAVE_KEYS = [
  ...MUST_HAVE_KEYS,
  // Additional features
  "waterfallVsAgile",
  "documentationProblem",
  "fourCircles",
  "autoSpecs",
  "livingDocs",
  "reducesTribalKnowledge",
  "agentCollaboration",
  "agentCustomization",
  "docAST",
  "multiPathTests",
  "webTesting",
  "mobileTesting",
  "performanceMonitoring",
  "incidentResponse",
  "owaspCompliance",
  "gdprCcpa",
  "disasterRecovery",
  "dataResidency",
  "slackIntegration",
  "docLookup",
  "engDashboard",
  "agentAnalytics",
  "reduceDependency",
  // Extended QUAD FLUX
  "costMatrix",
  "futureProviders",
  "byokSupport",
  "aiUsageDashboard",
  // Extended Cloud Strategy
  "hybridCloud",
  "gcpIntegration",
  "azureIntegration",
  "dataSovereignty",
];

type PresetKey = keyof typeof PRESETS;

// Demo access password
const DEMO_PASSWORD = "Ashrith";

export default function CustomerSettings() {
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({});
  const [currentPreset, setCurrentPreset] = useState<PresetKey>("all");
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Handle demo access
  const handleLaunchDemo = () => {
    setShowPasswordModal(true);
    setPassword("");
    setPasswordError(false);
  };

  const handlePasswordSubmit = () => {
    if (password.toLowerCase() === DEMO_PASSWORD.toLowerCase()) {
      // Password correct - redirect to demo
      window.location.href = "/dashboard";
    } else {
      setPasswordError(true);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("customer-features");
    const savedPreset = localStorage.getItem("customer-preset");

    if (saved) {
      setEnabledFeatures(JSON.parse(saved));
    } else {
      setEnabledFeatures(getDefaultEnabledState());
    }

    if (savedPreset) {
      setCurrentPreset(savedPreset as PresetKey);
    }

    // Expand first part by default
    const firstPart = CUSTOMER_FEATURES.parts[0];
    if (firstPart) {
      setExpandedParts({ [firstPart.key]: true });
    }
  }, []);

  // Save to localStorage when features change
  useEffect(() => {
    if (Object.keys(enabledFeatures).length > 0) {
      localStorage.setItem("customer-features", JSON.stringify(enabledFeatures));
      localStorage.setItem("customer-preset", currentPreset);
    }
  }, [enabledFeatures, currentPreset]);

  // Apply preset
  const applyPreset = (preset: PresetKey) => {
    setCurrentPreset(preset);

    const newState: Record<string, boolean> = {};

    CUSTOMER_FEATURES.parts.forEach((part) => {
      part.categories.forEach((category) => {
        category.features.forEach((feature) => {
          switch (preset) {
            case "all":
              newState[feature.key] = true;
              break;
            case "mustHave":
              newState[feature.key] = MUST_HAVE_KEYS.includes(feature.key);
              break;
            case "goodToHave":
              newState[feature.key] = GOOD_TO_HAVE_KEYS.includes(feature.key);
              break;
            case "custom":
              // Keep current state
              newState[feature.key] = enabledFeatures[feature.key] ?? true;
              break;
          }
        });
      });
    });

    setEnabledFeatures(newState);
  };

  // Toggle individual feature
  const toggleFeature = (key: string) => {
    setCurrentPreset("custom");
    setEnabledFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle entire category
  const toggleCategory = (category: Category) => {
    setCurrentPreset("custom");
    const allEnabled = category.features.every((f) => enabledFeatures[f.key]);
    const newState = { ...enabledFeatures };
    category.features.forEach((f) => {
      newState[f.key] = !allEnabled;
    });
    setEnabledFeatures(newState);
  };

  // Toggle entire part
  const togglePart = (part: Part) => {
    setCurrentPreset("custom");
    const allEnabled = part.categories.every((cat) =>
      cat.features.every((f) => enabledFeatures[f.key])
    );
    const newState = { ...enabledFeatures };
    part.categories.forEach((cat) => {
      cat.features.forEach((f) => {
        newState[f.key] = !allEnabled;
      });
    });
    setEnabledFeatures(newState);
  };

  // Count enabled features
  const getEnabledCount = () => {
    return Object.values(enabledFeatures).filter(Boolean).length;
  };

  const getTotalCount = () => {
    let count = 0;
    CUSTOMER_FEATURES.parts.forEach((part) => {
      part.categories.forEach((cat) => {
        count += cat.features.length;
      });
    });
    return count;
  };

  // Check if category is fully/partially enabled
  const getCategoryState = (category: Category): "all" | "some" | "none" => {
    const enabled = category.features.filter((f) => enabledFeatures[f.key]).length;
    if (enabled === 0) return "none";
    if (enabled === category.features.length) return "all";
    return "some";
  };

  // Check if part is fully/partially enabled
  const getPartState = (part: Part): "all" | "some" | "none" => {
    let enabled = 0;
    let total = 0;
    part.categories.forEach((cat) => {
      cat.features.forEach((f) => {
        total++;
        if (enabledFeatures[f.key]) enabled++;
      });
    });
    if (enabled === 0) return "none";
    if (enabled === total) return "all";
    return "some";
  };

  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-center">🔐 Demo Access</h2>
              <p className="text-slate-400 text-sm text-center mb-6">
                Enter password to access the live demo
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Launch Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Demo Settings
          </div>
          <h1 className="text-3xl font-bold mb-2">Feature Configuration</h1>
          <p className="text-slate-400">
            Select which features to show in the Customer demo
          </p>
        </div>

        {/* Launch Demo Button */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/30 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-300">Ready to see QUAD in action?</h2>
              <p className="text-slate-400 text-sm">
                Launch the live demo to experience the platform firsthand
              </p>
            </div>
            <button
              onClick={handleLaunchDemo}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              🚀 Launch Demo
            </button>
          </div>
        </div>

        {/* QUAD Meaning */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-400">Q</span>
              <div className="text-slate-400">Query</div>
              <div className="text-xs text-slate-500">Requirements</div>
            </div>
            <span className="text-slate-600">→</span>
            <div className="text-center">
              <span className="text-2xl font-bold text-green-400">U</span>
              <div className="text-slate-400">Understand</div>
              <div className="text-xs text-slate-500">Features</div>
            </div>
            <span className="text-slate-600">→</span>
            <div className="text-center">
              <span className="text-2xl font-bold text-yellow-400">A</span>
              <div className="text-slate-400">Act</div>
              <div className="text-xs text-slate-500">Implement</div>
            </div>
            <span className="text-slate-600">→</span>
            <div className="text-center">
              <span className="text-2xl font-bold text-purple-400">D</span>
              <div className="text-slate-400">Deploy</div>
              <div className="text-xs text-slate-500">Release</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-blue-400">{getEnabledCount()}</span>
            <span className="text-slate-400"> / {getTotalCount()} features enabled</span>
          </div>
          <div className="text-sm text-slate-500">
            Preset: <span className="text-purple-400">{PRESETS[currentPreset].name}</span>
          </div>
        </div>

        {/* Preset Selection */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-bold mb-4">Quick Presets</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
              const preset = PRESETS[key];
              const isActive = currentPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    isActive
                      ? "bg-purple-500/20 border-purple-500 text-white"
                      : "bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-sm">{preset.name}</div>
                  <div className="text-xs text-blue-400">{preset.subtitle}</div>
                  <div className="text-xs text-slate-400 mt-1">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Tree */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-bold mb-4">Feature Tree</h2>

          <div className="space-y-2">
            {CUSTOMER_FEATURES.parts.map((part) => {
              const partState = getPartState(part);
              const isExpanded = expandedParts[part.key];

              return (
                <div key={part.key} className="border border-slate-700 rounded-xl overflow-hidden">
                  {/* Part Header */}
                  <div
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 ${
                      isExpanded ? "bg-slate-700/20" : ""
                    }`}
                    onClick={() =>
                      setExpandedParts((prev) => ({ ...prev, [part.key]: !prev[part.key] }))
                    }
                  >
                    {/* Expand/Collapse */}
                    <span className="text-slate-500 w-6">
                      {isExpanded ? "▼" : "▶"}
                    </span>

                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePart(part);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        partState === "all"
                          ? "bg-blue-500 border-blue-500"
                          : partState === "some"
                          ? "bg-blue-500/50 border-blue-500"
                          : "border-slate-500"
                      }`}
                    >
                      {partState === "all" && <span className="text-white text-xs">✓</span>}
                      {partState === "some" && <span className="text-white text-xs">−</span>}
                    </button>

                    {/* Part Name */}
                    <div className="flex-1">
                      <div className="font-bold text-white">{part.name}</div>
                      <div className="text-xs text-slate-400">{part.tagline}</div>
                    </div>

                    {/* Count Badge */}
                    <div className="text-xs bg-slate-700 px-2 py-1 rounded">
                      {part.categories.reduce(
                        (acc, cat) => acc + cat.features.filter((f) => enabledFeatures[f.key]).length,
                        0
                      )}
                      /{part.categories.reduce((acc, cat) => acc + cat.features.length, 0)}
                    </div>
                  </div>

                  {/* Categories */}
                  {isExpanded && (
                    <div className="border-t border-slate-700">
                      {part.categories.map((category) => {
                        const catState = getCategoryState(category);
                        const isCatExpanded = expandedCategories[category.key];

                        return (
                          <div key={category.key} className="border-b border-slate-700/50 last:border-b-0">
                            {/* Category Header */}
                            <div
                              className={`flex items-center gap-3 p-3 pl-10 cursor-pointer hover:bg-slate-700/20 ${
                                isCatExpanded ? "bg-slate-700/10" : ""
                              }`}
                              onClick={() =>
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [category.key]: !prev[category.key],
                                }))
                              }
                            >
                              {/* Expand/Collapse */}
                              <span className="text-slate-500 w-5 text-sm">
                                {isCatExpanded ? "▼" : "▶"}
                              </span>

                              {/* Checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(category);
                                }}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  catState === "all"
                                    ? "bg-green-500 border-green-500"
                                    : catState === "some"
                                    ? "bg-green-500/50 border-green-500"
                                    : "border-slate-500"
                                }`}
                              >
                                {catState === "all" && <span className="text-white text-xs">✓</span>}
                                {catState === "some" && <span className="text-white text-xs">−</span>}
                              </button>

                              {/* Category Name */}
                              <div className="flex-1">
                                <div className="font-medium text-slate-200">{category.name}</div>
                              </div>

                              {/* Count Badge */}
                              <div className="text-xs bg-slate-600/50 px-2 py-0.5 rounded">
                                {category.features.filter((f) => enabledFeatures[f.key]).length}/
                                {category.features.length}
                              </div>
                            </div>

                            {/* Features */}
                            {isCatExpanded && (
                              <div className="bg-slate-800/30 py-2">
                                {category.features.map((feature) => (
                                  <div
                                    key={feature.key}
                                    className="flex items-center gap-3 py-2 px-4 pl-20 hover:bg-slate-700/20 cursor-pointer"
                                    onClick={() => toggleFeature(feature.key)}
                                  >
                                    {/* Checkbox */}
                                    <button
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        enabledFeatures[feature.key]
                                          ? "bg-purple-500 border-purple-500"
                                          : "border-slate-500"
                                      }`}
                                    >
                                      {enabledFeatures[feature.key] && (
                                        <span className="text-white text-xs">✓</span>
                                      )}
                                    </button>

                                    {/* Feature Info */}
                                    <div className="flex-1">
                                      <div className={`text-sm ${
                                        enabledFeatures[feature.key] ? "text-slate-200" : "text-slate-500"
                                      }`}>
                                        {feature.name}
                                      </div>
                                      <div className="text-xs text-slate-500">{feature.description}</div>
                                    </div>

                                    {/* Demo Badge */}
                                    {feature.isDemo && (
                                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                        DEMO
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/customer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Overview
          </Link>

          <div className="flex gap-3">
            <button
              onClick={() => applyPreset("all")}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
            >
              Reset to All
            </button>
            <button
              onClick={() => {
                localStorage.setItem("customer-features", JSON.stringify(enabledFeatures));
                alert("Settings saved!");
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
