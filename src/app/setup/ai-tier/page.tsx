"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// AI Tier definitions matching the existing config
const aiTiers = [
  {
    id: "turbo",
    name: "Turbo",
    description: "Fast responses, basic analysis",
    model: "Claude 3 Haiku",
    price: "$0.25 / 1M tokens",
    features: [
      "Quick requirement parsing",
      "Basic flow generation",
      "Standard confidence scoring",
    ],
    recommended: false,
    color: "gray",
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Good balance of speed and quality",
    model: "Claude 3.5 Sonnet",
    price: "$3.00 / 1M tokens",
    features: [
      "Deep requirement analysis",
      "Smart flow generation",
      "Enhanced confidence scoring",
      "Code review suggestions",
    ],
    recommended: true,
    color: "blue",
  },
  {
    id: "quality",
    name: "Quality",
    description: "Best analysis, complex reasoning",
    model: "Claude 3 Opus",
    price: "$15.00 / 1M tokens",
    features: [
      "Expert-level analysis",
      "Complex requirement parsing",
      "Detailed recommendations",
      "Advanced code review",
      "Architecture suggestions",
    ],
    recommended: false,
    color: "purple",
  },
  {
    id: "byok",
    name: "Bring Your Own Key",
    description: "Use your own Anthropic API key",
    model: "Your choice",
    price: "Pay Anthropic directly",
    features: [
      "Full control over billing",
      "Choose any model",
      "No usage limits from QUAD",
      "Enterprise compliance",
    ],
    recommended: false,
    color: "green",
  },
];

export default function AITierSetupPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [byokApiKey, setByokApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentTier();
  }, []);

  const fetchCurrentTier = async () => {
    try {
      const res = await fetch("/api/ai/config");
      if (res.ok) {
        const data = await res.json();
        if (data.tier) {
          setCurrentTier(data.tier);
          setSelectedTier(data.tier);
        }
      }
    } catch (err) {
      console.error("Failed to fetch AI config:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedTier) return;

    if (selectedTier === "byok" && !byokApiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          apiKey: selectedTier === "byok" ? byokApiKey : undefined,
        }),
      });

      if (res.ok) {
        // Mark AI tier as selected in setup status
        await fetch("/api/setup/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "ai_tier_selected" }),
        });

        router.push("/setup/meetings");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save AI configuration");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/setup"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to Setup
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Select AI Tier</h1>
          <p className="mt-2 text-gray-600">
            Choose how QUAD processes your requirements and generates insights
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {aiTiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
                selectedTier === tier.id
                  ? tier.color === "blue"
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : tier.color === "purple"
                    ? "border-purple-500 ring-2 ring-purple-200"
                    : tier.color === "green"
                    ? "border-green-500 ring-2 ring-green-200"
                    : "border-gray-500 ring-2 ring-gray-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Recommended
                </div>
              )}

              {/* Current Badge */}
              {currentTier === tier.id && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                  Current
                </div>
              )}

              {/* Tier Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-sm text-gray-500">{tier.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedTier === tier.id
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedTier === tier.id && (
                    <span className="text-white text-sm">✓</span>
                  )}
                </div>
              </div>

              {/* Model & Price */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium text-gray-900">{tier.model}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Pricing</span>
                  <span className="font-medium text-gray-900">{tier.price}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BYOK API Key Input */}
        {selectedTier === "byok" && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Enter Your Anthropic API Key
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
            <input
              type="password"
              value={byokApiKey}
              onChange={(e) => setByokApiKey(e.target.value)}
              placeholder="sk-ant-api03-xxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Your API key is encrypted and stored securely. QUAD never sees your usage.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/setup" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>

          <button
            onClick={handleSave}
            disabled={!selectedTier || saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
