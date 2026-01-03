'use client';

import { useState } from 'react';

interface IntegrationMethod {
  id: 'webhooks' | 'ssh' | 'mcp';
  name: string;
  description: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
  complexity: 'Easy' | 'Medium' | 'Advanced';
  setupTime: string;
  latency: string;
  requiresFirewallConfig: boolean;
  requiresPublicUrl: boolean;
  requiresClaudeDesktop: boolean;
}

const integrationMethods: IntegrationMethod[] = [
  {
    id: 'webhooks',
    name: 'Webhooks (Real-time)',
    description: 'GitHub/GitLab/Bitbucket sends instant notifications to QUAD Platform',
    bestFor: ['Cloud-hosted deployments', 'Real-time updates required', 'Public-facing servers'],
    pros: [
      'Real-time updates (instant)',
      'No polling overhead',
      'Lower server load',
      'Industry standard',
      'Auto-setup available (via GitHub token)',
    ],
    cons: [
      'Requires public URL or firewall config',
      'May need reverse proxy for self-hosted',
      'Webhook endpoint must be accessible',
    ],
    complexity: 'Easy',
    setupTime: '2-5 minutes (auto-setup) or 10-15 minutes (manual)',
    latency: '<1 second',
    requiresFirewallConfig: true,
    requiresPublicUrl: true,
    requiresClaudeDesktop: false,
  },
  {
    id: 'ssh',
    name: 'SSH Polling',
    description: 'QUAD Platform connects via SSH to check for updates every 30 seconds',
    bestFor: ['Self-hosted behind firewall', 'No public URL available', 'Small teams'],
    pros: [
      'No firewall configuration needed',
      'No public URL required',
      'Simple SSH key setup',
      'Works behind corporate firewall',
    ],
    cons: [
      '30-second delay (not real-time)',
      'Higher server load (polling)',
      'Requires SSH access to git server',
      'May hit rate limits with many repos',
    ],
    complexity: 'Medium',
    setupTime: '5-10 minutes',
    latency: '~30 seconds',
    requiresFirewallConfig: false,
    requiresPublicUrl: false,
    requiresClaudeDesktop: false,
  },
  {
    id: 'mcp',
    name: 'MCP Agents (AI-Powered)',
    description: 'Claude Desktop or compatible AI agents run locally and sync with QUAD Platform',
    bestFor: ['Enterprise self-hosted', 'Multi-AI platform support', 'Maximum flexibility'],
    pros: [
      'No firewall configuration needed',
      'Real-time updates',
      'Supports Claude Desktop, Cursor, Continue, Copilot',
      'Agent runs on developer machine',
      'No server polling overhead',
    ],
    cons: [
      'Requires Claude Desktop or compatible AI',
      'Each developer needs agent setup',
      'More complex initial configuration',
    ],
    complexity: 'Advanced',
    setupTime: '15-20 minutes per developer',
    latency: '<5 seconds',
    requiresFirewallConfig: false,
    requiresPublicUrl: false,
    requiresClaudeDesktop: true,
  },
];

interface IntegrationMethodSelectorProps {
  onSelect: (method: 'webhooks' | 'ssh' | 'mcp') => void;
  selectedMethod?: 'webhooks' | 'ssh' | 'mcp';
  deploymentType?: 'cloud' | 'self-hosted';
}

export default function IntegrationMethodSelector({
  onSelect,
  selectedMethod,
  deploymentType = 'self-hosted',
}: IntegrationMethodSelectorProps) {
  const [selected, setSelected] = useState<'webhooks' | 'ssh' | 'mcp' | null>(
    selectedMethod || null
  );

  const handleSelect = (methodId: 'webhooks' | 'ssh' | 'mcp') => {
    setSelected(methodId);
    onSelect(methodId);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendedBadge = (methodId: string) => {
    if (deploymentType === 'cloud' && methodId === 'webhooks') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ⭐ Recommended for Cloud
        </span>
      );
    }
    if (deploymentType === 'self-hosted' && methodId === 'mcp') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          ⭐ Recommended for Enterprise
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Integration Method
        </h2>
        <p className="text-gray-600">
          Choose how QUAD Platform will connect to your Git repositories and ITSM tools.
          You can change this later if needed.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Webhooks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SSH Polling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MCP Agents
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Latency
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  &lt;1 second
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                  ~30 seconds
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  &lt;5 seconds
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Setup Time
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  2-15 minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  5-10 minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  15-20 minutes
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Firewall Config
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  Required
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Not needed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Not needed
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Public URL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  Required
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Not needed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Not needed
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  AI Platform Support
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  N/A
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  N/A
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Multi-AI
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Server Load
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Low
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                  Medium
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  Low
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Method Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {integrationMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleSelect(method.id)}
            className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
              selected === method.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {method.name}
                </h3>
                {selected === method.id && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {method.description}
              </p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(method.complexity)}`}>
                  {method.complexity}
                </span>
                {getRecommendedBadge(method.id)}
              </div>
            </div>

            {/* Best For */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Best For:</h4>
              <ul className="space-y-1">
                {method.bestFor.map((item, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pros */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Pros:</h4>
              <ul className="space-y-1">
                {method.pros.map((pro, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Cons:</h4>
              <ul className="space-y-1">
                {method.cons.map((con, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">✗</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Prerequisites Checklist - Show when method is selected */}
      {selected && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Required Before Development</h3>
              <p className="text-sm text-gray-600 mt-1">
                Before QUAD agents can start building, please provide these materials:
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. UI Blueprint - Required */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    !
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      1. UI Blueprint / Design Mockup
                    </h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      Required
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    We need a visual design before development begins. This ensures the final product matches your expectations.
                  </p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Accepted formats:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-green-500">✓</span>
                        <span>Figma/Sketch designs</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-green-500">✓</span>
                        <span>Adobe XD mockups</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-green-500">✓</span>
                        <span>Hand-drawn wireframes</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-green-500">✓</span>
                        <span>Competitor website reference</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-900 mb-1">
                      🤖 Don't have a blueprint?
                    </p>
                    <p className="text-xs text-purple-800">
                      Our <strong>Blueprint Agent AI</strong> will interview you, ask questions about your requirements,
                      and generate a mockup website using your existing GitHub code (if available).
                      Preview and approve before development begins.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sample Git Repo - Optional */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                    i
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      2. Sample Git Repository / Reference Project
                    </h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Share your existing codebase or a similar project. This helps QUAD agents match your coding style and reuse components.
                  </p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">What you can share:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-blue-500">•</span>
                        <span>GitHub/GitLab repo URL</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-blue-500">•</span>
                        <span>Zip file of codebase</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-blue-500">•</span>
                        <span>Link to similar open-source project</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-blue-500">•</span>
                        <span>Existing component library</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Benefits:</strong> QUAD agents will match your React patterns, folder structure,
                      naming conventions, and integrate seamlessly with your existing APIs/databases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learn More Link */}
          <div className="mt-4 text-center">
            <a
              href="/documentation/QUAD_DEVELOPMENT_MODEL.md#prerequisites-blueprint--reference-materials-before-development"
              target="_blank"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
            >
              <span>Learn more about prerequisites</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Need Help Choosing?</h4>
            <p className="text-sm text-blue-800">
              <strong>Cloud-hosted:</strong> Use Webhooks for best performance.<br />
              <strong>Self-hosted (firewall):</strong> Use MCP Agents for enterprise or SSH Polling for simplicity.<br />
              <strong>Not sure:</strong> Start with SSH Polling (easiest) and switch to Webhooks/MCP later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
