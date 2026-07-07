'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, Clock } from 'lucide-react';

interface VacationModeProps {
  returnDate: Date;
}

export default function VacationMode({ returnDate }: VacationModeProps) {
  const { locale, t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const returnTime = returnDate.getTime();
      const difference = returnTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [returnDate]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(locale, options);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-pink-100 to-amber-100 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 text-center border border-rose-200">
        {/* Icon */}
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-rose-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif italic text-gray-800 mb-3 sm:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          {t.vacation.title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-6 sm:mb-8">
          {t.vacation.subtitle}
        </p>

        {/* Return Date */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-rose-200">
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-1 sm:mb-2">
            {t.vacation.returningOn}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600">
            {formatDate(returnDate)}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { value: timeLeft.days, label: t.vacation.days },
            { value: timeLeft.hours, label: t.vacation.hours },
            { value: timeLeft.minutes, label: t.vacation.minutes },
            { value: timeLeft.seconds, label: t.vacation.seconds },
          ].map((item, index) => (
            <div key={index} className="bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl p-3 sm:p-4 border border-rose-300">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-700 mb-1">
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="text-xs sm:text-sm">
            {t.vacation.message}
          </p>
        </div>
      </div>
    </div>
  );
}
