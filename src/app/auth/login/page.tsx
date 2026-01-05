'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  enabled: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>([]);
  const [companyName, setCompanyName] = useState<string>('QUAD Platform');
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Detect domain and load company-specific SSO providers
  useEffect(() => {
    async function loadSSOConfig() {
      const hostname = window.location.hostname;

      try {
        // Call API to get SSO config for this domain
        const response = await fetch(`/api/auth/sso-config?domain=${hostname}`);

        if (response.ok) {
          const data = await response.json();

          if (data.isCustomDomain) {
            // Custom domain - show only company's SSO
            setIsCustomDomain(true);
            setCompanyName(data.companyName);
            setSSOProviders(data.providers);
          } else {
            // QUAD platform domain - show default providers
            setIsCustomDomain(false);
            setCompanyName('QUAD Platform');
            loadDefaultProviders();
          }
        } else {
          // Fallback to default
          loadDefaultProviders();
        }
      } catch (error) {
        console.error('Failed to load SSO config:', error);
        loadDefaultProviders();
      }
    }

    async function loadDefaultProviders() {
      // Fetch available providers from NextAuth API
      try {
        const response = await fetch('/api/auth/providers');
        if (response.ok) {
          const availableProviders = await response.json();

          // Map NextAuth providers to our UI format
          const providerConfig: Record<string, { name: string; icon: string; bgColor: string }> = {
            google: {
              name: 'Google',
              icon: '/icons/google.svg',
              bgColor: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
            },
            github: {
              name: 'GitHub',
              icon: '/icons/github.svg',
              bgColor: 'bg-gray-900 hover:bg-black',
            },
          };

          const providers = Object.keys(availableProviders).map((id) => ({
            id,
            name: providerConfig[id]?.name || availableProviders[id].name,
            icon: providerConfig[id]?.icon || '',
            bgColor: providerConfig[id]?.bgColor || 'bg-blue-600 hover:bg-blue-700',
            enabled: true,
          }));

          setSSOProviders(providers);
        } else {
          console.error('Failed to fetch providers:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading providers:', error);
      }
    }

    loadSSOConfig();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus code input when shown
  useEffect(() => {
    if (showCodeInput && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [showCodeInput]);

  // Send verification code
  const handleSendCode = async () => {
    setIsLoading('email');
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send code');
        setIsLoading(null);
        return;
      }

      setSuccess('Verification code sent! Check your email.');
      setShowCodeInput(true);
      setCooldown(60); // 60 second cooldown
      setIsLoading(null);
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(null);
    }
  };

  // Verify code and login
  const handleVerifyCode = async () => {
    setIsLoading('verify');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid code');
        setIsLoading(null);
        return;
      }

      if (data.isNewUser) {
        // New user - redirect to signup with verified email
        router.push(data.redirectTo);
      } else {
        // Existing user - store token and redirect to dashboard
        localStorage.setItem('token', data.token);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard');
        }, 500);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(null);
    }
  };

  const handleSSOLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">Q</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{companyName}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isCustomDomain ? 'Sign in with your company SSO' : 'Sign in to QUAD Platform'}
          </p>
        </div>

        {/* Authentication Options */}
        {!showEmailForm ? (
          <div className="space-y-4">
            {/* Email/Code Option */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Email / Code</h3>
                  <p className="text-sm text-gray-600">Sign in with verification code</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* SSO Options */}
            {ssoProviders.length > 0 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {ssoProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleSSOLogin(provider.id)}
                      disabled={isLoading !== null}
                      className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        provider.bgColor
                      } ${
                        isLoading === provider.id
                          ? 'opacity-50 cursor-not-allowed'
                          : 'transform hover:scale-[1.02]'
                      } shadow-sm`}
                    >
                      {isLoading === provider.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className={provider.id === 'google' ? 'text-gray-800' : 'text-white'}>
                            Connecting...
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className={provider.id === 'google' ? 'text-gray-800' : 'text-white'}>
                            Continue with {provider.name}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Email Form */
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowEmailForm(false);
                setShowCodeInput(false);
                setCode('');
                setError('');
                setSuccess('');
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to options
            </button>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={showCodeInput}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {showCodeInput ? (
              /* Code Input */
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification code
                  </label>
                  <input
                    ref={codeInputRef}
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono text-gray-900 placeholder:text-gray-400"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || isLoading !== null}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading === 'verify' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={handleSendCode}
                    disabled={cooldown > 0 || isLoading !== null}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive the code? Resend"}
                  </button>
                </div>
              </>
            ) : (
              /* Send Code Button */
              <>
                <button
                  onClick={handleSendCode}
                  disabled={!email || isLoading !== null}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading === 'email' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  We'll send a 6-digit code to your email
                </p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create an account
            </a>
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="text-xs text-gray-600">
            Secured with OAuth 2.0 / OIDC
          </span>
        </div>
      </div>
    </div>
  );
}
