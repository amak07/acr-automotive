'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AcrButton } from '@/components/acr/Button';
import { AcrInput } from '@/components/acr/Input';
import { AcrLabel } from '@/components/acr/Label';
import { AcrSpinner } from '@/components/acr/Spinner';
import { Preloader } from '@/components/ui/Preloader';
import { AcrLogo } from '@/components/ui/AcrLogo';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const profile = await signIn(email, password);

      // Redirect to requested page or default to data-portal
      const requestedRedirect = searchParams?.get('redirect');
      let redirect: string;

      // Sanitize redirect: must be a relative path, not a login page or external URL
      const isSafeRedirect = requestedRedirect
        && requestedRedirect.startsWith('/')
        && !requestedRedirect.startsWith('//')
        && !requestedRedirect.endsWith('/login')
        && requestedRedirect !== '/login';
      redirect = isSafeRedirect ? requestedRedirect : '/data-portal';

      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show preloader during auth initialization
  if (authLoading) {
    return <Preloader isLoading={true} animationSrc="/animations/gear-loader.lottie" />;
  }

  const isFormValid = email.length > 0 && password.length >= 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 via-white to-acr-gray-100 flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-acr-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-acr-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      {/* Login container */}
      <div className="relative w-full max-w-md acr-animate-fade-up">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <AcrLogo className="h-20" />
          </div>
          <h1 className="acr-brand-heading-2xl text-acr-gray-900 mb-2">
            Admin Access
          </h1>
          <p className="text-acr-gray-600 acr-body">
            Sign in to manage your parts catalog
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-acr-gray-200 overflow-hidden">
          {/* Red accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-acr-red-500 via-acr-red-600 to-acr-red-500" />

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <AcrLabel htmlFor="email" className="flex items-center gap-2 text-acr-gray-700">
                  <Mail className="w-4 h-4 text-acr-gray-400" />
                  Email Address
                </AcrLabel>
                <div className="relative">
                  <AcrInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "h-12 pl-4 pr-4 transition-all duration-200",
                      "focus:ring-2 focus:ring-acr-red-500 focus:border-acr-red-500"
                    )}
                    placeholder="admin@acr.com"
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <AcrLabel htmlFor="password" className="flex items-center gap-2 text-acr-gray-700">
                  <Lock className="w-4 h-4 text-acr-gray-400" />
                  Password
                </AcrLabel>
                <div className="relative">
                  <AcrInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "h-12 pl-4 pr-12 transition-all duration-200",
                      "focus:ring-2 focus:ring-acr-red-500 focus:border-acr-red-500"
                    )}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      "text-acr-gray-400 hover:text-acr-gray-600",
                      "transition-colors duration-150",
                      "focus:outline-none focus:text-acr-gray-700"
                    )}
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-acr-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Password must be at least 8 characters
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl",
                    "bg-red-50 border border-red-200",
                    "acr-animate-fade-in"
                  )}
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-0.5">
                      Authentication Failed
                    </p>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <AcrButton
                type="submit"
                variant="primary"
                className={cn(
                  "w-full h-12 text-base font-semibold",
                  "transition-all duration-300",
                  isFormValid && !isLoading && "acr-pulse-ready"
                )}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <AcrSpinner size="sm" color="white" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </AcrButton>
            </form>
          </div>

          {/* Footer with security note */}
          <div className="bg-acr-gray-50 px-8 py-4 border-t border-acr-gray-200">
            <p className="text-xs text-center text-acr-gray-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Secured with Supabase Authentication
            </p>
          </div>
        </div>

        {/* Contact administrator */}
        <p className="text-center text-sm text-acr-gray-500 mt-6">
          Need access?{' '}
          <span className="text-acr-gray-700 font-medium">
            Contact your administrator
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Login Page - Admin authentication
 *
 * Secure email/password login with role-based access control.
 * Redirects to original destination after successful authentication.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={<Preloader isLoading={true} animationSrc="/animations/gear-loader.lottie" />}
    >
      <LoginForm />
    </Suspense>
  );
}
