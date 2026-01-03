"use client";

import { useState, useMemo } from "react";
import PageNavigation from "@/components/PageNavigation";
import { useMethodology } from "@/context/MethodologyContext";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Time Units
  {
    id: 1,
    question: "How long is a QUAD Cycle?",
    options: ["2 weeks", "4 weeks", "6 weeks", "Variable"],
    correctIndex: 1,
    explanation: "A QUAD Cycle is exactly 4 weeks. This provides predictability while allowing enough time for meaningful deliverables. Each Cycle contains 4 Pulses (1 week each).",
    category: "Time Units",
  },
  {
    id: 2,
    question: "What is a Pulse in QUAD?",
    options: ["A daily standup", "A 1-week unit within a Cycle", "A heartbeat monitor", "A deployment window"],
    correctIndex: 1,
    explanation: "A Pulse is a 1-week unit within a Cycle. 4 Pulses = 1 Cycle. Each Pulse can have minor deliverables, while the full Cycle delivers major features.",
    category: "Time Units",
  },
  {
    id: 3,
    question: "What replaces the daily standup meeting in QUAD?",
    options: ["Weekly meetings", "AI-generated Checkpoints", "Email updates", "Slack messages"],
    correctIndex: 1,
    explanation: "Checkpoints are AI-generated daily status updates. Humans review them asynchronously instead of attending 15-minute daily meetings.",
    category: "Time Units",
  },
  // Circles
  {
    id: 4,
    question: "How many Circles are in QUAD?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    explanation: "QUAD has 4 Circles: Management (C1), Development (C2), QA (C3), and Infrastructure (C4). This is the 'QUAD' in the name.",
    category: "Circles",
  },
  {
    id: 5,
    question: "Which Circle is responsible for writing specifications and managing the backlog?",
    options: ["Circle 2: Development", "Circle 1: Management", "Circle 3: QA", "Circle 4: Infrastructure"],
    correctIndex: 1,
    explanation: "Circle 1 (Management) includes BA, PM, and Tech Lead. They are 80% business-focused and handle specs, backlog, and stakeholder communication.",
    category: "Circles",
  },
  {
    id: 6,
    question: "Circle 4 (Infrastructure) is typically:",
    options: ["Dedicated per project", "Shared across all projects", "Optional", "Only for enterprise"],
    correctIndex: 1,
    explanation: "Circle 4 (Infrastructure) with DevOps, SRE, Cloud, and DBA roles is always SHARED across projects. They handle deployment, monitoring, and platform concerns.",
    category: "Circles",
  },
  // AI Adoption Levels
  {
    id: 7,
    question: "What does '0D Origin' mean in QUAD adoption levels?",
    options: ["Zero documentation", "Zero defects", "No AI agents", "No deadlines"],
    correctIndex: 2,
    explanation: "0D Origin means no AI agents - pure human QUAD. Great for learning the methodology before adding AI automation. The 'D' stands for Dimension.",
    category: "AI Adoption",
  },
  {
    id: 8,
    question: "Which adoption level is recommended for most teams starting with QUAD?",
    options: ["0D Origin", "1D Vector", "2D Plane", "4D Hyperspace"],
    correctIndex: 2,
    explanation: "2D Plane is recommended. It allows parallel AI agents within phases (UI + API work together) while maintaining human gates between phases.",
    category: "AI Adoption",
  },
  {
    id: 9,
    question: "In 4D Hyperspace, what is the human's primary role?",
    options: ["Writing all code", "Approving every step", "Handling exceptions only", "No human involvement"],
    correctIndex: 2,
    explanation: "In 4D Hyperspace, AI agents are self-improving and handle most work. Humans only handle exceptions and strategic decisions.",
    category: "AI Adoption",
  },
  // Artifacts
  {
    id: 10,
    question: "What is a Flow Document in QUAD?",
    options: ["A workflow diagram", "A living spec that travels with a feature", "A deployment log", "A meeting agenda"],
    correctIndex: 1,
    explanation: "A Flow Document is a living specification that travels with a feature through its entire lifecycle: requirements → design → tests → deployment.",
    category: "Artifacts",
  },
  {
    id: 11,
    question: "What is a Human Gate?",
    options: ["A physical security checkpoint", "An approval checkpoint where humans review AI output", "A login screen", "A firewall rule"],
    correctIndex: 1,
    explanation: "Human Gates are approval checkpoints where humans review AI-generated output before proceeding. This prevents runaway automation and ensures quality.",
    category: "Artifacts",
  },
  // Estimation
  {
    id: 12,
    question: "QUAD uses Platonic Solids for estimation. What does a Dodecahedron (12) represent?",
    options: ["Simple task (1-2 days)", "Medium task (3-5 days)", "Large task (2-3 weeks)", "Too large to estimate"],
    correctIndex: 2,
    explanation: "Dodecahedron (12 faces) = Extra large complexity, 2-3 week effort. Consider breaking it down. The sequence is: Tetrahedron(4), Cube(6), Octahedron(8), Dodecahedron(12), Icosahedron(20).",
    category: "Estimation",
  },
  // Principles
  {
    id: 13,
    question: "What does 'Docs-First' mean in QUAD?",
    options: ["Write documentation after coding", "Write specs before code, AI reads docs to generate code", "Only document bugs", "Use Google Docs"],
    correctIndex: 1,
    explanation: "Docs-First means writing specifications before code. AI agents read these docs to generate code. Docs stay current because they ARE the source of truth.",
    category: "Principles",
  },
  // AI Agents
  {
    id: 14,
    question: "Which agent is responsible for expanding user stories with acceptance criteria?",
    options: ["Dev Agent", "Story Agent", "Test Agent", "Deploy Agent"],
    correctIndex: 1,
    explanation: "The Story Agent expands user stories with acceptance criteria, edge cases, and technical considerations. It's used by Circle 1 (Management).",
    category: "AI Agents",
  },
  {
    id: 15,
    question: "What is the role of the Monitor Agent?",
    options: ["Monitor developer productivity", "Watch production systems and detect anomalies", "Monitor meeting attendance", "Track time spent on tasks"],
    correctIndex: 1,
    explanation: "The Monitor Agent watches production systems, detects anomalies, and either alerts humans or auto-heals issues depending on the adoption level.",
    category: "AI Agents",
  },
];

export default function QuizPage() {
  const { methodologyInfo } = useMethodology();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [quizComplete, setQuizComplete] = useState(false);

  // Shuffle questions on first render
  const shuffledQuestions = useMemo(() => {
    return [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  }, []);

  const question = shuffledQuestions[currentQuestion];

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return; // Already answered
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowExplanation(true);
    if (selectedAnswer === question.correctIndex) {
      setScore(score + 1);
    }
    setAnsweredQuestions(new Set([...answeredQuestions, question.id]));
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
    setQuizComplete(false);
  };

  // Calculate grade
  const getGrade = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { grade: "A", color: "text-green-400", message: "QUAD Master!" };
    if (percentage >= 80) return { grade: "B", color: "text-blue-400", message: "Great understanding!" };
    if (percentage >= 70) return { grade: "C", color: "text-yellow-400", message: "Good progress!" };
    if (percentage >= 60) return { grade: "D", color: "text-orange-400", message: "Keep learning!" };
    return { grade: "F", color: "text-red-400", message: "Review the concepts!" };
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <PageNavigation />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">QUAD Knowledge Quiz</h1>
          <p className="text-slate-400">
            Test your understanding of QUAD methodology concepts
          </p>
          <div className="mt-2 text-sm text-slate-500">
            Viewing as: <span className="font-medium">{methodologyInfo.icon} {methodologyInfo.name}</span>
          </div>
        </div>

        {!quizComplete ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">
                  Question {currentQuestion + 1} of {shuffledQuestions.length}
                </span>
                <span className="text-sm text-slate-400">
                  Score: {score}/{answeredQuestions.size}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              {/* Category Tag */}
              <div className="px-6 py-3 border-b border-slate-700 bg-slate-700/30">
                <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">
                  {question.category}
                </span>
              </div>

              {/* Question */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  {question.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === question.correctIndex;
                    const showResult = showExplanation;

                    let buttonClass = "w-full text-left p-4 rounded-xl border transition-all ";

                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "bg-green-500/20 border-green-500/50 text-green-300";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "bg-red-500/20 border-red-500/50 text-red-300";
                      } else {
                        buttonClass += "bg-slate-800/50 border-slate-700 text-slate-500";
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += "bg-blue-500/20 border-blue-500/50 text-blue-300";
                      } else {
                        buttonClass += "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showExplanation}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            showResult
                              ? isCorrect
                                ? "bg-green-500/30"
                                : isSelected
                                ? "bg-red-500/30"
                                : "bg-slate-700"
                              : isSelected
                              ? "bg-blue-500/30"
                              : "bg-slate-700"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                          {showResult && isCorrect && <span className="ml-auto">✓</span>}
                          {showResult && isSelected && !isCorrect && <span className="ml-auto">✗</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 mb-2">Explanation</h3>
                    <p className="text-slate-300">{question.explanation}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  {!showExplanation ? (
                    <button
                      onClick={handleSubmit}
                      disabled={selectedAnswer === null}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        selectedAnswer === null
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-all"
                    >
                      {currentQuestion < shuffledQuestions.length - 1 ? "Next Question →" : "See Results"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Results Screen */
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">
              {score === shuffledQuestions.length ? "🏆" : score >= shuffledQuestions.length * 0.7 ? "🎉" : "📚"}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>

            <div className="my-6">
              <div className={`text-6xl font-bold ${getGrade(score, shuffledQuestions.length).color}`}>
                {getGrade(score, shuffledQuestions.length).grade}
              </div>
              <div className="text-slate-400 mt-2">
                {getGrade(score, shuffledQuestions.length).message}
              </div>
            </div>

            <div className="text-3xl font-bold text-white mb-2">
              {score} / {shuffledQuestions.length}
            </div>
            <div className="text-slate-400 mb-6">
              {Math.round((score / shuffledQuestions.length) * 100)}% correct
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Try Again
              </button>
              <a
                href="/cheatsheet"
                className="px-6 py-3 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-600 transition-all"
              >
                Review Cheat Sheet
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
