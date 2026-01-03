"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SetupStatus {
  isComplete: boolean;
  completedSteps: string[];
  pendingSteps: string[];
  progress: number;
  details: {
    meetingProviderConfigured: boolean;
    calendarConnected: boolean;
    aiTierSelected: boolean;
    firstDomainCreated: boolean;
    firstCircleCreated: boolean;
  };
  nextStep: {
    step: string;
    label: string;
    url: string;
  } | null;
}

const setupSteps = [
  {
    id: "ai_tier",
    label: "Select AI Tier",
    description: "Choose your AI processing tier for requirement analysis",
    url: "/setup/ai-tier",
    icon: "🤖",
    required: true,
  },
  {
    id: "meeting_provider",
    label: "Connect Meeting Provider",
    description: "Link Google Calendar, Cal.com, or Outlook for meeting sync",
    url: "/setup/meetings",
    icon: "📅",
    required: true,
  },
  {
    id: "first_domain",
    label: "Create First Domain",
    description: "Set up your first project domain",
    url: "/domains/new",
    icon: "📁",
    required: false,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/setup/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);

        // If setup is complete, redirect to dashboard
        if (data.isComplete) {
          router.push("/dashboard");
          return;
        }

        // If there's a next step, redirect there
        if (data.nextStep?.url) {
          router.push(data.nextStep.url);
        }
      }
    } catch (error) {
      console.error("Failed to fetch setup status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId: string): "completed" | "current" | "pending" => {
    if (!status) return "pending";

    const details = status.details;

    if (stepId === "ai_tier" && details.aiTierSelected) return "completed";
    if (stepId === "meeting_provider" && details.meetingProviderConfigured) return "completed";
    if (stepId === "first_domain" && details.firstDomainCreated) return "completed";

    // Check if this is the next step
    if (status.nextStep?.url?.includes(stepId.replace("_", "-"))) {
      return "current";
    }

    // First incomplete step is current
    if (stepId === "ai_tier" && !details.aiTierSelected) return "current";
    if (stepId === "meeting_provider" && details.aiTierSelected && !details.meetingProviderConfigured) {
      return "current";
    }

    return "pending";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to QUAD Framework</h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s get your organization set up in a few quick steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Setup Progress</span>
            <span>{status?.progress || 0}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${status?.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {setupSteps.map((step, index) => {
            const stepStatus = getStepStatus(step.id);

            return (
              <Link
                key={step.id}
                href={step.url}
                className={`flex items-center p-6 border-b border-gray-100 last:border-b-0 transition-colors ${
                  stepStatus === "current"
                    ? "bg-blue-50 hover:bg-blue-100"
                    : stepStatus === "completed"
                    ? "bg-green-50 hover:bg-green-100"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Step Number / Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    stepStatus === "completed"
                      ? "bg-green-500 text-white"
                      : stepStatus === "current"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepStatus === "completed" ? "✓" : step.icon}
                </div>

                {/* Step Info */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <h3
                      className={`font-semibold ${
                        stepStatus === "completed"
                          ? "text-green-700"
                          : stepStatus === "current"
                          ? "text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      {step.label}
                    </h3>
                    {step.required && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                </div>

                {/* Arrow */}
                <div
                  className={`text-2xl ${
                    stepStatus === "current" ? "text-blue-600" : "text-gray-300"
                  }`}
                >
                  →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Skip for Now */}
        {status && !status.isComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip setup for now (some features will be limited)
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Check out our{" "}
            <Link href="/docs" className="text-blue-600 hover:underline">
              documentation
            </Link>{" "}
            or{" "}
            <Link href="/support" className="text-blue-600 hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
