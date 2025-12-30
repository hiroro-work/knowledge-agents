import { impersonateServiceAccount } from './utils/firebase.js';

const serviceAccount = process.env.DEV_GOOGLE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error('DEV_GOOGLE_SERVICE_ACCOUNT is not set');
  process.exit(1);
}
impersonateServiceAccount({ serviceAccount });
