'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface GitProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  connected: boolean;
  account: string | null;
  comingSoon: boolean;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  htmlUrl: string;
  connected: boolean;
  connectedToDomainId: string | null;
  isPrimary: boolean;
}

export default function GitIntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<GitProvider[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showRepos, setShowRepos] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/error from OAuth callback
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'git_connected') {
      setSuccessMessage('GitHub connected successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setTimeout(() => setErrorMessage(null), 5000);
    }

    fetchStatus();
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/git/status');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);

        // If GitHub is connected, fetch repositories
        const github = data.providers.find((p: GitProvider) => p.id === 'github');
        if (github?.connected) {
          setShowRepos(true);
          fetchRepositories();
        }
      }
    } catch (error) {
      console.error('Failed to fetch Git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const res = await fetch('/api/integrations/git/repositories');
      if (res.ok) {
        const data = await res.json();
        setRepositories(data.repositories);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    try {
      const res = await fetch(`/api/integrations/git/${providerId}/connect`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        const error = await res.json();
        setErrorMessage(error.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Connect error:', error);
      setErrorMessage('Failed to initiate connection');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/git/${providerId}/disconnect`, {
        method: 'POST',
      });

      if (res.ok) {
        setSuccessMessage('Integration disconnected');
        fetchStatus();
        setShowRepos(false);
        setRepositories([]);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const getProviderIcon = (icon: string) => {
    switch (icon) {
      case 'github':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      case 'gitlab':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Git Integrations</h1>
              <p className="text-gray-600 mt-1">
                Connect your Git provider to create branches and PRs from Flows
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Provider Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                provider.comingSoon ? 'opacity-60' : ''
              } ${provider.connected ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${provider.connected ? 'text-green-600' : 'text-gray-700'}`}>
                  {getProviderIcon(provider.icon)}
                </div>
                {provider.connected && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Connected
                  </span>
                )}
                {provider.comingSoon && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{provider.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

              {provider.connected && provider.account && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Connected as</p>
                  <p className="font-medium text-gray-900">@{provider.account}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Features</p>
                <ul className="space-y-1">
                  {provider.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {!provider.comingSoon && (
                <div className="flex gap-2">
                  {provider.connected ? (
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {connecting === provider.id ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Repository List */}
        {showRepos && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Repositories</h2>
                <p className="text-sm text-gray-600">Connect repositories to your domains</p>
              </div>
              <button
                onClick={fetchRepositories}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>

            {repositories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p>No repositories found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {repositories.slice(0, 10).map((repo) => (
                  <div key={repo.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {repo.private ? (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{repo.fullName}</p>
                        <p className="text-sm text-gray-500">{repo.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {repo.connected ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          Connected
                        </span>
                      ) : (
                        <Link
                          href={`/domains?connect_repo=${repo.id}`}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Connect to Domain
                        </Link>
                      )}
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {repositories.length > 10 && (
              <div className="px-6 py-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Showing 10 of {repositories.length} repositories
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
