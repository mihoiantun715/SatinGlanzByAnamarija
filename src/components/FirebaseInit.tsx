'use client';

import { useEffect } from 'react';

export default function FirebaseInit() {
  useEffect(() => {
    import('@/lib/firebase');
  }, []);
  return null;
}
