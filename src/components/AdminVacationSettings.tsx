'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminVacationSettings() {
  const { locale, t } = useLanguage();
  const [vacationMode, setVacationMode] = useState({
    active: false,
    returnDate: new Date('2026-08-02').toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVacationConfig();
  }, []);

  const fetchVacationConfig = async () => {
    try {
      const docRef = doc(db, 'settings', 'vacationMode');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVacationMode({
          active: data.active || false,
          returnDate: data.returnDate ? new Date(data.returnDate).toISOString().split('T')[0] : new Date('2026-08-02').toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error fetching vacation config:', error);
    }
  };

  const saveVacationConfig = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'vacationMode'), {
        active: vacationMode.active,
        returnDate: new Date(vacationMode.returnDate).toISOString(),
      }, { merge: true });
      alert('Vacation mode saved successfully!');
    } catch (error) {
      console.error('Failed to save vacation config:', error);
      alert('Failed to save vacation mode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-rose-500" />
        <h2 className="text-2xl font-bold text-gray-900">Vacation Mode</h2>
      </div>

      <div className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-semibold text-gray-900">Enable Vacation Mode</p>
            <p className="text-sm text-gray-500">When active, visitors will see a countdown and cannot access the site</p>
          </div>
          <button
            onClick={() => setVacationMode({ ...vacationMode, active: !vacationMode.active })}
            className="relative"
          >
            {vacationMode.active ? (
              <ToggleRight className="w-12 h-12 text-rose-500" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-gray-400" />
            )}
          </button>
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Return Date</label>
          <input
            type="date"
            value={vacationMode.returnDate}
            onChange={(e) => setVacationMode({ ...vacationMode, returnDate: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={saveVacationConfig}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* Warning */}
        {vacationMode.active && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-800">⚠️ Warning</p>
            <p className="text-sm text-amber-700 mt-1">
              Vacation mode is currently ACTIVE. All visitors will see the vacation countdown page and cannot access the shop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
