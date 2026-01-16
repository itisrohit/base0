import { createRoute } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { rootRoute } from './__root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [magicToken, setMagicToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send magic link');
      const data = await res.json();
      setSuccess(true);
      setMagicToken(data.token);
      console.log('Magic Link Data:', data); // Dev only
    } catch (_err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMagicLink = async (token: string) => {
    try {
      const res = await fetch('/api/v1/auth/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('Failed to verify magic link');
      const data = await res.json();

      // Store the auth token
      if (data.accessToken) {
        Cookies.set('auth_token', data.accessToken, { expires: 7 }); // 7 days
      }

      // Redirect to dashboard
      window.location.href = '/';
    } catch (_err) {
      setError('Failed to verify magic link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-gray-950 border border-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">Base0</h1>
          <p className="text-gray-400">Sign in to your dashboard</p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-green-500 space-y-3">
            <p className="text-center font-medium">Check your email for the magic link!</p>
            {magicToken && (
              <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Development Mode - Click to verify:</p>
                <button
                  type="button"
                  onClick={() => handleVerifyMagicLink(magicToken)}
                  className="w-full text-left text-xs font-mono text-blue-400 hover:text-blue-300 break-all"
                >
                  {magicToken}
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-white transition-all"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Sign in with Email'}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-950 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="space-y-2 relative">
          <button
            type="button"
            onClick={() => {
              setNotice('Planned for Production');
              setTimeout(() => setNotice(null), 3000);
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-gray-900/10 border border-gray-800 rounded-lg text-gray-600 cursor-not-allowed transition-all font-medium opacity-50 hover:bg-gray-900/20"
            title="Available in production phase"
          >
            <svg
              className="w-5 h-5 opacity-40"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              ></path>
            </svg>
            {notice || 'GitHub'}
          </button>
          {!notice && (
            <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest">
              Coming in Production
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
