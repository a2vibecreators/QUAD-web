'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  type: string;
  url: string | null;
  sourceBranch: string;
  isActive: boolean;
  createdAt: string;
  repository: {
    id: string;
    repo_name: string;
    repo_full_name: string;
    repo_url: string | null;
  };
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string | null;
  state: string;
  isDraft: boolean;
  isMerged: boolean;
  headBranch: string;
  baseBranch: string;
  createdAt: string;
}

interface GitActionsPanelProps {
  flowId: string;
  flowTitle: string;
  onBranchCreated?: (branch: Branch) => void;
  onPRCreated?: (pr: PullRequest) => void;
}

export default function GitActionsPanel({
  flowId,
  flowTitle,
  onBranchCreated,
  onPRCreated,
}: GitActionsPanelProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<'branch' | 'pr' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gitConnected, setGitConnected] = useState(true);

  useEffect(() => {
    fetchGitData();
  }, [flowId]);

  const fetchGitData = async () => {
    setLoading(true);
    try {
      const [branchRes, prRes] = await Promise.all([
        fetch(`/api/flows/${flowId}/branch`),
        fetch(`/api/flows/${flowId}/pull-request`),
      ]);

      if (branchRes.ok) {
        const branchData = await branchRes.json();
        setBranches(branchData.branches || []);
      }

      if (prRes.ok) {
        const prData = await prRes.json();
        setPullRequests(prData.pullRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch git data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    setCreating('branch');
    setError(null);

    try {
      const res = await fetch(`/api/flows/${flowId}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchType: 'feature' }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GIT_NOT_CONNECTED') {
          setGitConnected(false);
          return;
        }
        throw new Error(data.error || 'Failed to create branch');
      }

      if (data.branch) {
        const newBranch: Branch = {
          id: data.branch.id,
          name: data.branch.name,
          type: 'feature',
          url: data.branch.url,
          sourceBranch: 'main',
          isActive: true,
          createdAt: new Date().toISOString(),
          repository: data.repository,
        };
        setBranches([newBranch, ...branches]);
        onBranchCreated?.(newBranch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setCreating(null);
    }
  };

  const handleCreatePR = async () => {
    setCreating('pr');
    setError(null);

    try {
      const res = await fetch(`/api/flows/${flowId}/pull-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NO_BRANCH') {
          setError('Create a branch first before creating a PR');
          return;
        }
        throw new Error(data.error || 'Failed to create PR');
      }

      if (data.pullRequest) {
        const newPR: PullRequest = {
          id: data.pullRequest.id,
          number: data.pullRequest.number,
          title: data.pullRequest.title,
          url: data.pullRequest.url,
          state: data.pullRequest.state,
          isDraft: data.pullRequest.isDraft,
          isMerged: false,
          headBranch: data.pullRequest.headBranch,
          baseBranch: data.pullRequest.baseBranch,
          createdAt: new Date().toISOString(),
        };
        setPullRequests([newPR, ...pullRequests]);
        onPRCreated?.(newPR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PR');
    } finally {
      setCreating(null);
    }
  };

  if (!gitConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-yellow-800">GitHub not connected</p>
            <p className="text-sm text-yellow-700 mt-1">
              Connect your GitHub account to create branches and PRs.
            </p>
            <Link
              href="/configure/integrations/git"
              className="inline-block mt-2 text-sm text-yellow-800 underline hover:no-underline"
            >
              Connect GitHub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const activeBranch = branches.find((b) => b.isActive);
  const openPR = pullRequests.find((pr) => pr.state === 'open');

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Git Actions
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Branch Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Branch</span>
            {!activeBranch && (
              <button
                onClick={handleCreateBranch}
                disabled={creating === 'branch'}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {creating === 'branch' ? 'Creating...' : '+ Create Branch'}
              </button>
            )}
          </div>

          {activeBranch ? (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <code className="text-sm text-gray-800 flex-1 truncate">{activeBranch.name}</code>
              {activeBranch.url && (
                <a
                  href={activeBranch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No branch created yet</p>
          )}
        </div>

        {/* PR Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pull Request</span>
            {activeBranch && !openPR && (
              <button
                onClick={handleCreatePR}
                disabled={creating === 'pr'}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {creating === 'pr' ? 'Creating...' : '+ Create PR'}
              </button>
            )}
          </div>

          {openPR ? (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                openPR.state === 'open'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                #{openPR.number}
              </span>
              <span className="text-sm text-gray-800 flex-1 truncate">{openPR.title}</span>
              {openPR.url && (
                <a
                  href={openPR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ) : activeBranch ? (
            <p className="text-sm text-gray-500 italic">No PR created yet</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Create a branch first</p>
          )}
        </div>
      </div>

      {/* Footer */}
      {(branches.length > 1 || pullRequests.length > 1) && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <Link
            href={`/flows/${flowId}/git`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all Git activity
          </Link>
        </div>
      )}
    </div>
  );
}
