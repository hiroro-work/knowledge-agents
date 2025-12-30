'use client';

import { useEffect } from 'react';
import { initializeApp } from '~/utils/firebase/app';

export function FirebaseInitializer() {
  useEffect(() => {
    initializeApp();
  }, []);

  return null;
}
