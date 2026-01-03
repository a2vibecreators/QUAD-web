"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Simple CSS-based celebration effect (no external dependency)

interface SetupStatus {
  isComplete: boolean;
  progress: number;
  details: {
    meetingProviderConfigured: boolean;
    calendarConnected: boolean;
    aiTierSelected: boolean;
    firstDomainCreated: boolean;
    firstCircleCreated: boolean;
  };
}

export default function SetupCompletePage() {
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

        // If setup is complete, trigger confetti!
        if (data.isComplete || data.progress >= 100) {
          triggerConfetti();
        }
      }
    } catch (error) {
      console.error("Failed to fetch setup status:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    // Simple celebration - just log for now
    // Could add CSS animation or install canvas-confetti later
    console.log('Setup complete! 🎉');
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🎉</span>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Setup Complete!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your QUAD Framework is ready to use. Let&apos;s start managing your projects!
        </p>

        {/* Completion Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">What&apos;s Ready</h2>

          <div className="space-y-3">
            <div className="flex items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status?.details.aiTierSelected ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {status?.details.aiTierSelected ? "✓" : "○"}
              </span>
              <span className="text-gray-700">AI Tier Configured</span>
            </div>

            <div className="flex items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status?.details.meetingProviderConfigured ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {status?.details.meetingProviderConfigured ? "✓" : "○"}
              </span>
              <span className="text-gray-700">Meeting Provider Connected</span>
            </div>

            <div className="flex items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                status?.details.calendarConnected ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {status?.details.calendarConnected ? "✓" : "○"}
              </span>
              <span className="text-gray-700">Calendar Synced</span>
            </div>
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/domains/new"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">📁</div>
            <h3 className="font-semibold text-gray-900">Create Domain</h3>
            <p className="text-sm text-gray-500 mt-1">
              Start your first project domain
            </p>
          </Link>

          <Link
            href="/configure/integrations"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-semibold text-gray-900">Add Integrations</h3>
            <p className="text-sm text-gray-500 mt-1">
              Connect GitHub, Slack, and more
            </p>
          </Link>

          <Link
            href="/docs"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-900">Read Documentation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Learn the Q-U-A-D methodology
            </p>
          </Link>

          <Link
            href="/demo"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🎮</div>
            <h3 className="font-semibold text-gray-900">Try Demo Mode</h3>
            <p className="text-sm text-gray-500 mt-1">
              Explore with sample data
            </p>
          </Link>
        </div>

        {/* Main CTA */}
        <button
          onClick={handleGoToDashboard}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
        >
          Go to Dashboard →
        </button>

        {/* Help Link */}
        <p className="mt-6 text-sm text-gray-500">
          Need help?{" "}
          <Link href="/support" className="text-blue-600 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
