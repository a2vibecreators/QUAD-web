'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Domain {
  id: string;
  name: string;
  domain_type: string;
  path: string;
  created_at: string;
  roles: string[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateDomain, setShowCreateDomain] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [domainType, setDomainType] = useState('project');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load domains
  useEffect(() => {
    if (session) {
      loadDomains();
    }
  }, [session]);

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/domains/list');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async () => {
    if (!domainName.trim()) {
      alert('Please enter a domain name');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/domains/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: domainName.trim(),
          domainType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Domain "${data.domain.name}" created successfully as DOMAIN_ADMIN!`);
        setShowCreateDomain(false);
        setDomainName('');
        setDomainType('project');
        loadDomains(); // Reload domains list
      } else {
        const error = await response.json();
        alert(`Failed to create domain: ${error.error}`);
      }
    } catch (error) {
      console.error('Create domain error:', error);
      alert('Failed to create domain');
    } finally {
      setCreating(false);
    }
  };

  const handleStartBlueprintAgent = (domainId: string, domainName: string) => {
    // Navigate to blueprint agent page
    router.push(`/blueprint-agent?domainId=${domainId}&domainName=${encodeURIComponent(domainName)}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 mt-1">Welcome back, {session.user?.name}!</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Domains</p>
                <p className="text-3xl font-bold text-gray-900">{domains.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Resources</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">1</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Domains List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">My Domains</h2>
                <button
                  onClick={() => setShowCreateDomain(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Create Domain</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {domains.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📁</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first domain to organize your projects and resources
                  </p>
                  <button
                    onClick={() => setShowCreateDomain(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Your First Domain
                  </button>
                </div>
              ) : (
                /* Domains List */
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div key={domain.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{domain.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: <span className="font-medium text-gray-900">{domain.domain_type}</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {domain.roles.map((role) => (
                              <span
                                key={role}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {new Date(domain.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartBlueprintAgent(domain.id, domain.name)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          🤖 Start Blueprint Agent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href="/reporting"
                className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <p className="font-semibold text-blue-900">📊 View Reports</p>
                <p className="text-sm text-blue-700">Charts, burndown & velocity</p>
              </Link>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-semibold text-green-900">👥 Invite Team</p>
                <p className="text-sm text-green-700">Collaborate together</p>
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <p className="font-semibold text-purple-900">⚙️ Settings</p>
                <p className="text-sm text-purple-700">Manage preferences</p>
              </button>
              <Link
                href="/docs"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <p className="font-semibold text-gray-900">📚 Documentation</p>
                <p className="text-sm text-gray-700">Learn QUAD Framework</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Create Domain Modal */}
      {showCreateDomain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create New Domain</h3>
                <button
                  onClick={() => {
                    setShowCreateDomain(false);
                    setDomainName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={creating}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g., My Project"
                  disabled={creating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Type
                </label>
                <select
                  value={domainType}
                  onChange={(e) => setDomainType(e.target.value)}
                  disabled={creating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900"
                >
                  <option value="project">Project</option>
                  <option value="department">Department</option>
                  <option value="team">Team</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> You will be assigned the DOMAIN_ADMIN role (100% allocation).
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  This gives you full management access to this domain. You can manually add Circle 1-4 roles later for testing different agent personas.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateDomain(false);
                    setDomainName('');
                  }}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDomain}
                  disabled={creating || !domainName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{creating ? 'Creating...' : 'Create Domain'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
