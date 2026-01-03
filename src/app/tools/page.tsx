'use client';

import { useState } from 'react';

type ToolStatus = 'implemented' | 'coming-soon' | 'planned';

interface Tool {
  name: string;
  description: string;
  status: ToolStatus;
  setupGuide?: string;
  category: string;
  logo?: string;
}

const tools: Tool[] = [
  // Version Control
  {
    name: 'GitHub',
    description: 'Git repository hosting, pull requests, code review',
    status: 'implemented',
    setupGuide: '/docs/integrations/github',
    category: 'Version Control',
  },
  {
    name: 'GitLab',
    description: 'DevOps platform with Git repository management',
    status: 'coming-soon',
    category: 'Version Control',
  },
  {
    name: 'Bitbucket',
    description: 'Git repository hosting by Atlassian',
    status: 'coming-soon',
    category: 'Version Control',
  },

  // Project Management / ITSM
  {
    name: 'Jira Service Management',
    description: 'IT Service Management with incident, change, and problem management',
    status: 'implemented',
    setupGuide: '/docs/integrations/jira-service-management',
    category: 'ITSM / Project Management',
  },
  {
    name: 'ServiceNow',
    description: 'Enterprise IT Service Management platform',
    status: 'implemented',
    setupGuide: '/docs/integrations/servicenow',
    category: 'ITSM / Project Management',
  },
  {
    name: 'Jira Software',
    description: 'Agile project management and issue tracking',
    status: 'implemented',
    setupGuide: '/docs/integrations/jira',
    category: 'ITSM / Project Management',
  },
  {
    name: 'Linear',
    description: 'Modern issue tracking for software teams',
    status: 'coming-soon',
    category: 'ITSM / Project Management',
  },
  {
    name: 'Zendesk',
    description: 'Customer service and IT ticketing platform',
    status: 'planned',
    category: 'ITSM / Project Management',
  },
  {
    name: 'Freshservice',
    description: 'Cloud-based IT service management',
    status: 'planned',
    category: 'ITSM / Project Management',
  },

  // SSO / Identity Providers
  {
    name: 'Okta',
    description: 'Enterprise SSO and identity management',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#okta',
    category: 'SSO / Authentication',
  },
  {
    name: 'Azure AD / Entra ID',
    description: 'Microsoft identity platform',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#azure-ad',
    category: 'SSO / Authentication',
  },
  {
    name: 'Google Workspace',
    description: 'Google SSO for organizations',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#google',
    category: 'SSO / Authentication',
  },
  {
    name: 'GitHub SSO',
    description: 'Sign in with GitHub',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#github',
    category: 'SSO / Authentication',
  },
  {
    name: 'Auth0',
    description: 'Flexible authentication and authorization platform',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#auth0',
    category: 'SSO / Authentication',
  },
  {
    name: 'Generic OIDC',
    description: 'OpenID Connect compatible providers (OneLogin, Ping Identity, etc.)',
    status: 'implemented',
    setupGuide: '/docs/integrations/sso#oidc',
    category: 'SSO / Authentication',
  },

  // CI/CD
  {
    name: 'GitHub Actions',
    description: 'Automated workflows and CI/CD pipelines',
    status: 'coming-soon',
    category: 'CI/CD',
  },
  {
    name: 'Jenkins',
    description: 'Open-source automation server',
    status: 'coming-soon',
    category: 'CI/CD',
  },
  {
    name: 'GitLab CI/CD',
    description: 'Built-in CI/CD pipelines',
    status: 'planned',
    category: 'CI/CD',
  },

  // Cloud Providers
  {
    name: 'AWS',
    description: 'Amazon Web Services (EC2, ECS, Lambda, etc.)',
    status: 'coming-soon',
    category: 'Cloud Infrastructure',
  },
  {
    name: 'Google Cloud Platform',
    description: 'GCP services (Compute Engine, Cloud Run, etc.)',
    status: 'coming-soon',
    category: 'Cloud Infrastructure',
  },
  {
    name: 'Azure',
    description: 'Microsoft Azure cloud services',
    status: 'coming-soon',
    category: 'Cloud Infrastructure',
  },

  // Monitoring & Observability
  {
    name: 'Datadog',
    description: 'Infrastructure and application monitoring',
    status: 'planned',
    category: 'Monitoring',
  },
  {
    name: 'New Relic',
    description: 'Application performance monitoring',
    status: 'planned',
    category: 'Monitoring',
  },
  {
    name: 'Sentry',
    description: 'Error tracking and performance monitoring',
    status: 'planned',
    category: 'Monitoring',
  },

  // Databases
  {
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    status: 'implemented',
    category: 'Databases',
  },
  {
    name: 'MS SQL Server',
    description: 'Microsoft SQL Server database',
    status: 'coming-soon',
    category: 'Databases',
  },
  {
    name: 'MySQL',
    description: 'Popular open-source relational database',
    status: 'coming-soon',
    category: 'Databases',
  },
  {
    name: 'MongoDB',
    description: 'NoSQL document database',
    status: 'planned',
    category: 'Databases',
  },

  // Communication
  {
    name: 'Slack',
    description: 'Team collaboration and messaging',
    status: 'planned',
    category: 'Communication',
  },
  {
    name: 'Microsoft Teams',
    description: 'Workspace chat and collaboration',
    status: 'planned',
    category: 'Communication',
  },

  // Secret Management
  {
    name: 'Vaultwarden',
    description: 'Bitwarden-compatible secret storage',
    status: 'implemented',
    category: 'Secret Management',
  },
  {
    name: 'HashiCorp Vault',
    description: 'Enterprise secret management',
    status: 'planned',
    category: 'Secret Management',
  },

  // User Provisioning
  {
    name: 'SCIM 2.0',
    description: 'Automatic user provisioning from identity providers',
    status: 'implemented',
    category: 'User Provisioning',
  },
];

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(tools.map((t) => t.category))];

  const filteredTools =
    selectedCategory === 'all'
      ? tools
      : tools.filter((t) => t.category === selectedCategory);

  const getStatusBadge = (status: ToolStatus) => {
    switch (status) {
      case 'implemented':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Implemented
          </span>
        );
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🔜 Coming Soon
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            📋 Planned
          </span>
        );
    }
  };

  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Supported Tools & Integrations
              </h1>
              <p className="text-gray-600 mt-2">
                QUAD Platform integrates with industry-standard tools to streamline your development workflow
              </p>
            </div>
            <a
              href="/tools/request"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request Integration
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Tools' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-8">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tool.name}
                      </h3>
                      {getStatusBadge(tool.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {tool.description}
                    </p>
                    {tool.setupGuide && (
                      <a
                        href={tool.setupGuide}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Setup Guide →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Implemented
              </span>
              <span className="text-sm text-gray-600">
                Ready to use now. Configuration guide available.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔜 Coming Soon
              </span>
              <span className="text-sm text-gray-600">
                In active development. Expected in next release.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                📋 Planned
              </span>
              <span className="text-sm text-gray-600">
                On our roadmap. Request to prioritize.
              </span>
            </div>
          </div>
        </div>

        {/* Integration Strategy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Our Integration Philosophy
          </h3>
          <p className="text-sm text-blue-800">
            QUAD Platform focuses on the <strong>top 3 tools per category</strong> to cover 90% of industry usage.
            Don't see your tool? <a href="/tools/request" className="underline font-medium">Request an integration</a> and
            we'll prioritize based on customer demand.
          </p>
        </div>
      </main>
    </div>
  );
}
