'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t.auth.errorEmail);
      return;
    }

    setLoading(true);
    try {
      // First, check if the email exists in Firebase Authentication
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      // If no sign-in methods exist, the account doesn't exist
      if (signInMethods.length === 0) {
        // Show generic success message to prevent email enumeration
        // but DON'T actually send an email
        setSuccess(true);
        setEmail('');
        setLoading(false);
        return;
      }
      
      // Account exists - send the password reset email
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      setSuccess(true);
      setEmail('');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        // Show generic success message instead of error
        setSuccess(true);
        setEmail('');
      } else if (code === 'auth/invalid-email') {
        setError(t.auth.errorEmail);
      } else {
        setError(t.forgotPassword.errorSendFailed);
      }
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
            <h1 className="text-2xl font-bold text-gray-900">{t.forgotPassword.title}</h1>
            <p className="text-sm text-gray-500 mt-2">
              {t.forgotPassword.subtitle}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t.forgotPassword.emailSent}</p>
                <p className="mt-1">{t.forgotPassword.checkInbox}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.email}
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-rose-200"
            >
              {loading ? t.common.loading : t.forgotPassword.sendResetLink}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-rose-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t.forgotPassword.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
