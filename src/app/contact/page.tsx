'use client';

import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, MapPin, Phone, Instagram, Send, CheckCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const functions = getFunctions(app, 'us-central1');
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmail({ name, email, subject, message });
      setSent(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error('Contact email failed:', err);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{t.contact.title}</h1>
          <p className="text-lg text-gray-600">{t.contact.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-700">{t.contact.sent}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.contact.name}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors"
                    placeholder={t.contact.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.contact.email}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors"
                    placeholder={t.contact.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.contact.subject}</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors"
                    placeholder={t.contact.subject}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.contact.message}</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors resize-none"
                    placeholder={t.contact.message}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center justify-center gap-2 w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-4 rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-rose-200"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? 'Sending...' : t.contact.send}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.contact.info}</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t.contact.email}</h3>
                  <a href="mailto:satinglanzbyanamarija@gmail.com" className="text-gray-600 hover:text-rose-500 transition-colors">
                    satinglanzbyanamarija@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t.contact.phone}</h3>
                  <p className="text-gray-600">+385 XX XXX XXXX</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t.contact.address}</h3>
                  <p className="text-gray-600">Croatia</p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.contact.followUs}</h3>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/satinglanzbyanamarija?igsh=NG03Ymw1MDBueGl5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://www.tiktok.com/@satinglanzbyanamarija" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.24 8.24 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.13z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
