'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { Mail, Phone, Send, CheckCircle } from 'lucide-react';

export default function SpecialRequestPage() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roseCount, setRoseCount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone || !roseCount) {
      setError(t.specialRequest.errorAllFields);
      return;
    }

    const roses = parseInt(roseCount);
    if (roses <= 101) {
      setError(t.specialRequest.errorMinimumRoses);
      return;
    }

    setSending(true);
    setError('');

    try {
      const functions = getFunctions(app, 'us-central1');
      const sendSpecialRequest = httpsCallable(functions, 'sendSpecialBouquetRequest');
      
      await sendSpecialRequest({
        customerEmail: email,
        customerPhone: phone,
        roseCount: roses,
        message: message || 'No additional message provided.',
      });

      setSent(true);
      setEmail('');
      setPhone('');
      setRoseCount('');
      setMessage('');
    } catch (err) {
      console.error('Failed to send special request:', err);
      setError(t.specialRequest.errorSendFailed);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t.specialRequest.requestSentTitle}
          </h2>
          <p className="text-gray-600 mb-6">
            {t.specialRequest.requestSentMessage}
          </p>
          <button
            onClick={() => window.location.href = '/build-bouquet'}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {t.specialRequest.backToBouquetBuilder}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{t.specialRequest.title}</h1>
            <p className="text-rose-100">{t.specialRequest.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> {t.specialRequest.yourEmail} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" /> {t.specialRequest.yourPhone} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123 456 7890"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌹 {t.specialRequest.numberOfRoses} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="102"
                value={roseCount}
                onChange={(e) => setRoseCount(e.target.value)}
                placeholder="e.g., 150"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
              <p className="text-xs text-gray-500 mt-1">{t.specialRequest.minimumRoses}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.specialRequest.additionalMessage}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.specialRequest.messagePlaceholder}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-semibold mb-1">{t.specialRequest.whatHappensNext}</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>✓ {t.specialRequest.step1}</li>
                <li>✓ {t.specialRequest.step2}</li>
                <li>✓ {t.specialRequest.step3}</li>
                <li>✓ {t.specialRequest.step4}</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <>{t.specialRequest.sendingRequest}</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.specialRequest.sendRequest}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/build-bouquet'}
              className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {t.specialRequest.backToBouquetBuilder}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
