import { initializeApp as _initializeApp, getApps } from '@local/admin-shared';

const initializeApp = () => {
  if (getApps().length !== 0) return;

  _initializeApp();
};

export { initializeApp };
