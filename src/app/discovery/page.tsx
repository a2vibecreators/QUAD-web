"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";
import { useDomain } from "@/contexts/DomainContext";

// Adoption level recommendations
const adoptionLevels = [
  { level: "0D", name: "Origin", minScore: 0, maxScore: 5, description: "Start with documentation basics", color: "slate" },
  { level: "1D", name: "Vector", minScore: 6, maxScore: 12, description: "Add 4 Circles structure", color: "blue" },
  { level: "2D", name: "Plane", minScore: 13, maxScore: 18, description: "Integrate manual AI tools", color: "green" },
  { level: "3D", name: "Space", minScore: 19, maxScore: 24, description: "Deploy specialized AI agents", color: "purple" },
  { level: "4D", name: "Hyperspace", minScore: 25, maxScore: 100, description: "Full autonomous pipeline", color: "orange" },
];

type Step = "intro" | "symptoms" | "readiness" | "diagnosis" | "recommendation";

export default function DiscoveryPage() {
  const { config } = useDomain();
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [readinessAnswers, setReadinessAnswers] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Get domain-specific data
  const painCategories = config.painCategories;
  const readinessQuestions = config.readinessQuestions;

  // Calculate pain score
  const calculatePainScore = () => {
    let score = 0;
    painCategories.forEach((category) => {
      category.symptoms.forEach((symptom) => {
        if (selectedSymptoms.has(symptom.id)) {
          score += symptom.weight;
        }
      });
    });
    return score;
  };

  // Calculate readiness score
  const calculateReadinessScore = () => {
    let score = 0;
    let criticalMet = true;
    readinessQuestions.forEach((q) => {
      if (readinessAnswers[q.id]) {
        score += q.critical ? 3 : 1;
      } else if (q.critical) {
        criticalMet = false;
      }
    });
    return { score, criticalMet };
  };

  // Get affected categories
  const getAffectedCategories = () => {
    return painCategories.filter((category) =>
      category.symptoms.some((s) => selectedSymptoms.has(s.id))
    );
  };

  // Get recommended adoption level
  const getRecommendedLevel = () => {
    const painScore = calculatePainScore();
    const { score: readinessScore, criticalMet } = calculateReadinessScore();

    if (!criticalMet) {
      return adoptionLevels[0]; // Can't proceed without critical requirements
    }

    const combinedScore = Math.min(painScore, readinessScore * 2); // Cap by readiness
    return adoptionLevels.find(
      (l) => combinedScore >= l.minScore && combinedScore <= l.maxScore
    ) || adoptionLevels[0];
  };

  const toggleSymptom = (id: string) => {
    const newSet = new Set(selectedSymptoms);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSymptoms(newSet);
  };

  const toggleReadiness = (id: string) => {
    setReadinessAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Progress indicator
  const steps: Step[] = ["intro", "symptoms", "readiness", "diagnosis", "recommendation"];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i <= currentIndex
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 ${
                      i < currentIndex ? "bg-blue-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Start</span>
            <span>Symptoms</span>
            <span>Readiness</span>
            <span>Diagnosis</span>
            <span>Plan</span>
          </div>
        </div>

        {/* Step 1: Introduction */}
        {currentStep === "intro" && (
          <div className="text-center">
            {/* Domain Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full mb-6">
              <span className="text-xl">{config.icon}</span>
              <span className="text-sm text-slate-300">{config.name}</span>
              <span className="text-xs text-slate-500">• Change in header ↑</span>
            </div>

            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-4xl font-bold mb-4">QUAD Discovery</h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Not sure if QUAD is right for you? Let&apos;s find out together.
              <br />
              <span className="text-slate-400 text-base">
                {config.description}
              </span>
            </p>

            {/* Adoption Levels Preview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8 max-w-3xl mx-auto">
              <h3 className="font-bold mb-4 text-left">Based on your pain + readiness, we&apos;ll recommend one of:</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {adoptionLevels.map((level) => {
                  const colorMap: Record<string, string> = {
                    slate: "from-slate-500 to-slate-600",
                    blue: "from-blue-500 to-blue-600",
                    green: "from-green-500 to-green-600",
                    purple: "from-purple-500 to-purple-600",
                    orange: "from-orange-500 to-orange-600",
                  };
                  return (
                    <div
                      key={level.level}
                      className={`bg-gradient-to-b ${colorMap[level.color]} rounded-lg p-3 text-center`}
                    >
                      <div className="text-xl font-bold">{level.level}</div>
                      <div className="text-xs font-medium">{level.name}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs text-slate-400">
                <div>Docs First</div>
                <div>4 Circles</div>
                <div>Manual Tools</div>
                <div>AI Agents</div>
                <div>Full Auto</div>
              </div>
              <div className="flex items-center justify-center mt-4 text-sm text-slate-500">
                <span className="mr-2">←</span>
                <span>Less AI</span>
                <div className="w-24 h-1 mx-4 bg-gradient-to-r from-slate-500 via-blue-500 to-orange-500 rounded"></div>
                <span>More AI</span>
                <span className="ml-2">→</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">🩺</div>
                <h3 className="font-bold mb-2">Diagnose</h3>
                <p className="text-sm text-slate-400">
                  Identify your pain points and their root causes
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold mb-2">Assess</h3>
                <p className="text-sm text-slate-400">
                  Check your readiness for QUAD adoption
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold mb-2">Recommend</h3>
                <p className="text-sm text-slate-400">
                  Get a personalized adoption path
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("symptoms")}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            >
              Start Discovery →
            </button>
          </div>
        )}

        {/* Step 2: Symptom Selection */}
        {currentStep === "symptoms" && (
          <div>
            <h2 className="text-2xl font-bold mb-2">What challenges are you facing?</h2>
            <p className="text-slate-400 mb-6">
              Select all that apply. Be honest - this helps us diagnose accurately.
            </p>

            <div className="space-y-6">
              {painCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg font-bold">{category.title}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {category.symptoms.map((symptom) => (
                      <button
                        key={symptom.id}
                        onClick={() => toggleSymptom(symptom.id)}
                        className={`p-3 rounded-lg text-left text-sm transition-all ${
                          selectedSymptoms.has(symptom.id)
                            ? "bg-blue-500/30 border-blue-500 border text-white"
                            : "bg-slate-700/50 border border-slate-600 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <span className="mr-2">
                          {selectedSymptoms.has(symptom.id) ? "✓" : "○"}
                        </span>
                        {symptom.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep("intro")}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep("readiness")}
                disabled={selectedSymptoms.size === 0}
                className={`px-6 py-3 rounded-xl transition-all ${
                  selectedSymptoms.size > 0
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                Next: Readiness Check →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Readiness Check */}
        {currentStep === "readiness" && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Readiness Check</h2>
            <p className="text-slate-400 mb-6">
              Let&apos;s see if your organization is ready for QUAD adoption.
            </p>

            {/* Required Questions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                REQUIRED - Must have these to start
              </h3>
              <div className="space-y-3">
                {readinessQuestions.filter(q => q.critical).map((question) => (
                  <button
                    key={question.id}
                    onClick={() => toggleReadiness(question.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                      readinessAnswers[question.id]
                        ? "bg-green-500/20 border-green-500 border"
                        : "bg-slate-800/50 border border-red-500/30 hover:border-red-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          readinessAnswers[question.id]
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-red-400"
                        }`}
                      >
                        {readinessAnswers[question.id] && "✓"}
                      </span>
                      <span>{question.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Questions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                OPTIONAL - Nice to have
              </h3>
              <div className="space-y-3">
                {readinessQuestions.filter(q => !q.critical).map((question) => (
                  <button
                    key={question.id}
                    onClick={() => toggleReadiness(question.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                      readinessAnswers[question.id]
                        ? "bg-green-500/20 border-green-500 border"
                        : "bg-slate-800/50 border border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          readinessAnswers[question.id]
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-slate-500"
                        }`}
                      >
                        {readinessAnswers[question.id] && "✓"}
                      </span>
                      <span>{question.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep("symptoms")}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep("diagnosis")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
              >
                See Diagnosis →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Diagnosis */}
        {currentStep === "diagnosis" && (
          <div>
            <h2 className="text-2xl font-bold mb-2">🩺 Your Diagnosis</h2>
            <p className="text-slate-400 mb-6">
              Based on your symptoms, here&apos;s what we found:
            </p>

            {/* Pain Score */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Pain Level</span>
                <span className="text-3xl font-bold text-orange-400">
                  {calculatePainScore()} points
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (calculatePainScore() / 30) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Critical</span>
              </div>
            </div>

            {/* Affected Areas */}
            <h3 className="font-bold mb-4">Affected Areas & Root Causes</h3>
            <div className="space-y-4 mb-8">
              {getAffectedCategories().map((category) => (
                <div
                  key={category.id}
                  className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setShowDetails(showDetails === category.id ? null : category.id)
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-semibold">{category.title}</span>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">
                        {category.symptoms.filter((s) => selectedSymptoms.has(s.id)).length}{" "}
                        symptoms
                      </span>
                    </div>
                    <span className="text-slate-400">
                      {showDetails === category.id ? "▲" : "▼"}
                    </span>
                  </button>

                  {showDetails === category.id && (
                    <div className="p-4 pt-0 border-t border-slate-700">
                      <div className="mb-4">
                        <div className="text-sm text-slate-500 mb-2">Root Causes:</div>
                        <ul className="space-y-1">
                          {category.rootCauses.map((cause, i) => (
                            <li key={i} className="text-sm text-red-300 flex items-center gap-2">
                              <span>⚠️</span> {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-2">QUAD Solution:</div>
                        <p className="text-sm text-green-300 bg-green-500/10 p-3 rounded-lg">
                          ✅ {category.quadSolution}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Readiness Summary */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
              <h3 className="font-bold mb-4">Readiness Summary</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {readinessQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 text-sm ${
                      readinessAnswers[q.id] ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    <span>{readinessAnswers[q.id] ? "✅" : "❌"}</span>
                    {q.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep("readiness")}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep("recommendation")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
              >
                Get Recommendation →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Recommendation */}
        {currentStep === "recommendation" && (
          <div className="text-center">
            {(() => {
              const level = getRecommendedLevel();
              const { criticalMet } = calculateReadinessScore();
              const affected = getAffectedCategories();

              if (!criticalMet) {
                return (
                  <div>
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-3xl font-bold mb-4">Prerequisites Missing</h2>
                    <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                      Before adopting QUAD, you need to address these critical requirements:
                    </p>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
                      {readinessQuestions
                        .filter((q) => q.critical && !readinessAnswers[q.id])
                        .map((q) => (
                          <div key={q.id} className="flex items-center gap-2 text-red-300 mb-2">
                            <span>❌</span> {q.text}
                          </div>
                        ))}
                    </div>
                    <p className="text-slate-400 mb-8">
                      Once these are in place, come back and we&apos;ll help you get started with QUAD!
                    </p>
                  </div>
                );
              }

              const colorMap: Record<string, string> = {
                slate: "from-slate-500 to-slate-600",
                blue: "from-blue-500 to-blue-600",
                green: "from-green-500 to-green-600",
                purple: "from-purple-500 to-purple-600",
                orange: "from-orange-500 to-orange-600",
              };

              return (
                <div>
                  <div className="text-6xl mb-6">🎯</div>
                  <h2 className="text-3xl font-bold mb-4">Your Recommended Path</h2>

                  {/* Recommended Level Card */}
                  <div
                    className={`bg-gradient-to-r ${colorMap[level.color]} rounded-2xl p-8 mb-8 max-w-md mx-auto`}
                  >
                    <div className="text-6xl font-bold mb-2">{level.level}</div>
                    <div className="text-2xl font-semibold mb-2">{level.name}</div>
                    <div className="text-white/80">{level.description}</div>
                  </div>

                  {/* Why this level */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8 text-left max-w-2xl mx-auto">
                    <h3 className="font-bold mb-4">Why {level.level} ({level.name})?</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400">📊</span>
                        <span>
                          <strong>Pain Level:</strong> {calculatePainScore()} points across{" "}
                          {affected.length} areas
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✅</span>
                        <span>
                          <strong>Readiness:</strong>{" "}
                          {Object.values(readinessAnswers).filter(Boolean).length}/
                          {readinessQuestions.length} criteria met
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">🎯</span>
                        <span>
                          <strong>Focus Areas:</strong>{" "}
                          {affected.map((a) => a.title).join(", ") || "General improvement"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8 text-left max-w-2xl mx-auto">
                    <h3 className="font-bold mb-4">Recommended Next Steps</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                        <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </span>
                        <span>
                          <Link href="/configure" className="text-blue-400 hover:underline">
                            Configure QUAD
                          </Link>{" "}
                          for your team
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <span className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        <span>
                          Review the{" "}
                          <Link href="/docs" className="text-blue-400 hover:underline">
                            Documentation
                          </Link>{" "}
                          for {level.level} adoption
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <span className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </span>
                        <span>
                          Try the{" "}
                          <Link href="/demo" className="text-blue-400 hover:underline">
                            Dashboard Demo
                          </Link>{" "}
                          to see what you&apos;ll get
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/configure"
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-all hover:scale-105"
                    >
                      ⚙️ Configure QUAD
                    </Link>
                    <Link
                      href="/platform"
                      className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-lg font-semibold transition-all"
                    >
                      📋 View Platform Details
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Restart */}
            <button
              onClick={() => {
                setCurrentStep("intro");
                setSelectedSymptoms(new Set());
                setReadinessAnswers({});
              }}
              className="mt-8 text-slate-500 hover:text-white transition-all"
            >
              ↺ Start Over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
