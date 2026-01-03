"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ProviderStatus {
  isConfigured: boolean;
  isEnabled: boolean;
  accountEmail: string | null;
  syncStatus: string | null;
  lastSyncAt: string | null;
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  authType: "oauth" | "api_key";
  status: ProviderStatus;
}

interface ProvidersResponse {
  providers: Provider[];
  recommendedProvider: string;
  hasConfiguredProvider: boolean;
}

const providerIcons: Record<string, string> = {
  google: "🔵",
  calendar: "📅",
  microsoft: "🟦",
  video: "📹",
};

export default function MeetingsSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for OAuth callback results
  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const emailParam = searchParams.get("email");
    const providerParam = searchParams.get("provider");

    if (successParam === "true") {
      setSuccess(
        `Successfully connected ${providerParam || "provider"}${
          emailParam ? ` (${emailParam})` : ""
        }`
      );
      // Clear URL params
      router.replace("/setup/meetings");
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
      router.replace("/setup/meetings");
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/integrations/meeting/providers");
      if (res.ok) {
        const data: ProvidersResponse = await res.json();
        setProviders(data.providers);
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
      setError("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: Provider) => {
    setError(null);

    if (provider.authType === "api_key") {
      setShowApiKeyModal(provider.id);
      return;
    }

    // OAuth flow
    setConnecting(provider.id);

    try {
      const res = await fetch(`/api/integrations/meeting/${provider.id}/connect`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError("Failed to initiate connection");
    } finally {
      setConnecting(null);
    }
  };

  const handleApiKeyConnect = async () => {
    if (!showApiKeyModal || !apiKeyInput.trim()) return;

    setConnecting(showApiKeyModal);
    setError(null);

    try {
      const res = await fetch(`/api/integrations/meeting/${showApiKeyModal}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Connected ${data.account?.email || showApiKeyModal}`);
        setShowApiKeyModal(null);
        setApiKeyInput("");
        fetchProviders(); // Refresh providers
      } else {
        setError(data.error || "Failed to connect");
      }
    } catch (err) {
      console.error("API key connect error:", err);
      setError("Failed to connect with API key");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;

    try {
      const res = await fetch(`/api/integrations/meeting/${providerId}/disconnect`, {
        method: "POST",
      });

      if (res.ok) {
        setSuccess("Integration disconnected");
        fetchProviders();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      setError("Failed to disconnect");
    }
  };

  const handleContinue = () => {
    const hasConfigured = providers.some((p) => p.status.isConfigured);
    if (hasConfigured) {
      router.push("/setup/complete");
    } else {
      setError("Please connect at least one meeting provider to continue");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/setup"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to Setup
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Connect Meeting Provider</h1>
          <p className="mt-2 text-gray-600">
            Connect your calendar to sync meetings and auto-create Flows from action items
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {/* Provider Cards */}
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                provider.status.isConfigured
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                  {providerIcons[provider.icon] || "📅"}
                </div>

                {/* Info */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    {provider.status.isConfigured && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                    {provider.id === "google_calendar" && !provider.status.isConfigured && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{provider.description}</p>

                  {/* Connected Account */}
                  {provider.status.accountEmail && (
                    <p className="text-sm text-green-600 mt-2">
                      📧 {provider.status.accountEmail}
                    </p>
                  )}

                  {/* Features */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="ml-4">
                  {provider.status.isConfigured ? (
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider)}
                      disabled={connecting === provider.id}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        provider.id === "google_calendar"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {connecting === provider.id ? "Connecting..." : "Connect"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/setup"
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>

          <button
            onClick={handleContinue}
            disabled={!providers.some((p) => p.status.isConfigured)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Dashboard →
          </button>
        </div>

        {/* API Key Modal */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Enter API Key
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your Cal.com API key to connect. You can find this in your
                Cal.com settings under &quot;API Keys&quot;.
              </p>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="cal_live_xxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApiKeyModal(null);
                    setApiKeyInput("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApiKeyConnect}
                  disabled={!apiKeyInput.trim() || connecting !== null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
