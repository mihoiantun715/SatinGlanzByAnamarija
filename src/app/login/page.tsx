'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';

export default function LoginPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push('/account');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) { setError(t.auth.errorEmail); return; }
    if (password.length < 6) { setError(t.auth.errorPassword); return; }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/account');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') setError(t.auth.errorUserNotFound);
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setError(t.auth.errorWrongPassword);
      else setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/account');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') setError('Sign-in cancelled');
      else if (code === 'auth/popup-blocked') setError('Please allow popups for this site');
      else setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="SatinGlanz" width={48} height={48} className="rounded-full mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">{t.auth.loginTitle}</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-rose-200"
            >
              {loading ? t.common.loading : t.auth.login}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-md flex items-center justify-center gap-3"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Continue with Google
          </button>

          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">
              {t.auth.forgotPassword || 'Forgot password?'}
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.noAccount}{' '}
            <Link href="/register" className="text-rose-500 hover:text-rose-600 font-semibold">
              {t.auth.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
