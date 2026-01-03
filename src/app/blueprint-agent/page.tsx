'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface InterviewSession {
  sessionId: string;
  currentQuestion: string | null;
  isComplete: boolean;
  blueprint: any | null;
}

function BlueprintAgentContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainId = searchParams.get('domainId');
  const domainName = searchParams.get('domainName');

  const [projectDescription, setProjectDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Validate domain parameters
  useEffect(() => {
    if (!domainId || !domainName) {
      router.push('/dashboard');
    }
  }, [domainId, domainName, router]);

  const handleStartInterview = async () => {
    if (!projectDescription.trim()) {
      alert('Please describe your project first');
      return;
    }

    setLoading(true);
    setInterviewStarted(true);

    // Add user's initial description to messages
    const initialMessage: Message = {
      role: 'user',
      content: projectDescription,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);

    try {
      // Call API to start interview
      const response = await fetch('/api/blueprint-agent/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId,
          projectDescription: projectDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewSession(data.session);

        // Add agent's first question to messages
        if (data.session.currentQuestion) {
          const agentMessage: Message = {
            role: 'agent',
            content: data.session.currentQuestion,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      } else {
        const error = await response.json();
        alert(`Failed to start interview: ${error.error}`);
        setInterviewStarted(false);
      }
    } catch (error) {
      console.error('Start interview error:', error);
      alert('Failed to start interview');
      setInterviewStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !interviewSession) {
      return;
    }

    setLoading(true);

    // Add user's answer to messages
    const userMessage: Message = {
      role: 'user',
      content: currentAnswer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentAnswer('');

    try {
      // Call API to submit answer and get next question
      const response = await fetch('/api/blueprint-agent/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: interviewSession.sessionId,
          answer: currentAnswer.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInterviewSession(data.session);

        // Add agent's next question or completion message to messages
        if (data.session.isComplete) {
          const completionMessage: Message = {
            role: 'agent',
            content: '✅ Great! I have all the information I need. Your QUAD blueprint is being generated...',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, completionMessage]);

          // Show blueprint preview after 2 seconds
          setTimeout(() => {
            alert('Blueprint generation complete! (Feature coming soon: Blueprint preview)');
          }, 2000);
        } else if (data.session.currentQuestion) {
          const agentMessage: Message = {
            role: 'agent',
            content: data.session.currentQuestion,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      } else {
        const error = await response.json();
        alert(`Failed to submit answer: ${error.error}`);
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      alert('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🤖 Blueprint Agent Interview
              </h1>
              <p className="text-slate-400 mt-1">
                Domain: <span className="font-semibold text-blue-400">{domainName}</span>
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!interviewStarted ? (
          /* Initial Project Description */
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tell me about your project
            </h2>
            <p className="text-gray-600 mb-6">
              Write a brief description of what you want to build. The Blueprint Agent will then ask you questions to understand your requirements, features, tech stack, and architecture.
            </p>

            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Example: I want to build a calculator app that can perform basic arithmetic operations (add, subtract, multiply, divide). It should have a clean UI and work on web browsers. Users should be able to see their calculation history."
              className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              disabled={loading}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartInterview}
                disabled={loading || !projectDescription.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Starting Interview...' : 'Start Interview'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Interview Conversation */
          <div className="space-y-6">
            {/* Messages */}
            <div className="bg-white rounded-lg shadow-xl p-6 max-h-[600px] overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{message.role === 'user' ? '👤' : '🤖'}</span>
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Answer Input */}
            {interviewSession && !interviewSession.isComplete && (
              <div className="bg-white rounded-lg shadow-xl p-6">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey && !loading) {
                      handleSubmitAnswer();
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> to submit
                  </p>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loading || !currentAnswer.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{loading ? 'Sending...' : 'Send Answer'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Completion State */}
            {interviewSession?.isComplete && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <h3 className="text-lg font-bold text-green-900 mb-2">
                      Interview Complete!
                    </h3>
                    <p className="text-green-700">
                      Your QUAD blueprint is ready. You can now proceed to configure your project and start development.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlueprintAgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BlueprintAgentContent />
    </Suspense>
  );
}
