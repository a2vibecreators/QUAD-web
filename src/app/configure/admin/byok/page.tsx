'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BYOKField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  helpText?: string;
}

interface BYOKProvider {
  id: string;
  name: string;
  supportsByok: boolean;
  authType: 'oauth' | 'api_key' | 'both';
  hasByok: boolean;
  isConnected: boolean;
  requiredFields?: BYOKField[];
  optionalFields?: BYOKField[];
  setupUrl?: string;
  setupInstructions?: string;
}

interface BYOKCategory {
  id: string;
  name: string;
  description: string;
  byokEnabled: boolean;
  providers: BYOKProvider[];
}

interface BYOKData {
  categories: BYOKCategory[];
  summary: {
    totalProviders: number;
    byokConfigured: number;
    connected: number;
  };
}

export default function BYOKAdminPage() {
  const [data, setData] = useState<BYOKData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<{
    category: string;
    provider: BYOKProvider;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBYOKData();
  }, []);

  const fetchBYOKData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/byok');
      if (!res.ok) throw new Error('Failed to fetch BYOK data');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BYOK settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async (categoryId: string, providerId: string) => {
    try {
      const res = await fetch(`/api/admin/byok/${categoryId}/${providerId}`);
      if (!res.ok) throw new Error('Failed to fetch provider details');
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleEditProvider = async (category: BYOKCategory, provider: BYOKProvider) => {
    const details = await fetchProviderDetails(category.id, provider.id);
    if (details) {
      setEditingProvider({
        category: category.id,
        provider: { ...provider, ...details.provider },
      });
      setFormData({});
    }
  };

  const handleSaveCredentials = async () => {
    if (!editingProvider) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/byok/${editingProvider.category}/${editingProvider.provider.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save credentials');
      }

      setEditingProvider(null);
      setFormData({});
      fetchBYOKData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableBYOK = async (categoryId: string, providerId: string) => {
    if (!confirm('Disable BYOK and revert to QUAD Platform credentials?')) return;

    try {
      const res = await fetch(`/api/admin/byok/${categoryId}/${providerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to disable BYOK');

      fetchBYOKData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable BYOK');
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      git: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
      calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
      ai: 'M21 10.5c.75 0 1.5.75 1.5 1.5s-.75 1.5-1.5 1.5-1.5-.75-1.5-1.5.75-1.5 1.5-1.5zM21 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c-.75 0-1.5-.75-1.5-1.5S7.25 9 8 9s1.5.75 1.5 1.5S8.75 12 8 12zm8 0c-.75 0-1.5-.75-1.5-1.5S15.25 9 16 9s1.5.75 1.5 1.5-.75 1.5-1.5 1.5z',
      communication: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
    };
    return icons[categoryId] || icons.git;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
            <button
              onClick={() => {
                setError(null);
                fetchBYOKData();
              }}
              className="ml-4 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/configure" className="hover:text-gray-700">
              Configure
            </Link>
            <span>/</span>
            <Link href="/configure/admin" className="hover:text-gray-700">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-900">BYOK Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bring Your Own Key (BYOK)</h1>
          <p className="text-gray-600 mt-1">
            Use your own OAuth Apps and API keys for integrations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-3xl font-bold text-gray-900">
                {data.summary.totalProviders}
              </div>
              <div className="text-sm text-gray-500">Total Providers</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-3xl font-bold text-blue-600">
                {data.summary.byokConfigured}
              </div>
              <div className="text-sm text-gray-500">BYOK Configured</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-3xl font-bold text-green-600">
                {data.summary.connected}
              </div>
              <div className="text-sm text-gray-500">Connected</div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {data.categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d={getCategoryIcon(category.id)} />
                    </svg>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {category.providers.filter((p) => p.hasByok).length}/
                      {category.providers.length} BYOK
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedCategory === category.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Providers List */}
                {expandedCategory === category.id && (
                  <div className="border-t border-gray-200">
                    {category.providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="px-4 py-3 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              provider.hasByok
                                ? 'bg-blue-500'
                                : provider.isConnected
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
                            }`}
                          />
                          <div>
                            <span className="font-medium text-gray-900">
                              {provider.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {provider.authType === 'oauth'
                                ? 'OAuth'
                                : provider.authType === 'api_key'
                                  ? 'API Key'
                                  : 'OAuth/API Key'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {provider.hasByok && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              BYOK
                            </span>
                          )}
                          {provider.isConnected && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              Connected
                            </span>
                          )}
                          {provider.supportsByok && (
                            <>
                              <button
                                onClick={() => handleEditProvider(category, provider)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                {provider.hasByok ? 'Edit' : 'Configure'}
                              </button>
                              {provider.hasByok && (
                                <button
                                  onClick={() =>
                                    handleDisableBYOK(category.id, provider.id)
                                  }
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  Disable
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                Configure BYOK: {editingProvider.provider.name}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {editingProvider.provider.setupUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {editingProvider.provider.setupInstructions}
                  </p>
                  <a
                    href={editingProvider.provider.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline mt-1 inline-block"
                  >
                    Open {editingProvider.provider.name} Developer Console
                  </a>
                </div>
              )}

              {/* Required Fields */}
              {editingProvider.provider.requiredFields?.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} *
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}

              {/* Optional Fields */}
              {editingProvider.provider.optionalFields?.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingProvider(null);
                  setFormData({});
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
