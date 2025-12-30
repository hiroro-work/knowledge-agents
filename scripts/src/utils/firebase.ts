import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeApp as _initializeApp, cert } from '@local/admin-shared';

const AUTO_AUTH = true;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const environments = ['test', 'development', 'staging', 'production'] as const;
type Environment = (typeof environments)[number];
const environment = process.env.ENVIRONMENT as Environment | undefined;

const serviceAccountKeyDir = resolve(__dirname, '../../google_application_credentials');
const serviceAccountKeyPath = ({ serviceAccount = process.env.SCRIPTS_GOOGLE_SERVICE_ACCOUNT } = {}) =>
  resolve(serviceAccountKeyDir, `${serviceAccount}.json`);

const getServiceAccountKeyData = async (path: string) => {
  if (!(await exists(path))) return;
  const { default: serviceAccountKeyData } = await import(path, { with: { type: 'json' } });
  return serviceAccountKeyData;
};

const createServiceAccountKey = async ({
  serviceAccount = process.env.SCRIPTS_GOOGLE_SERVICE_ACCOUNT,
  path,
}: { serviceAccount?: string; path?: string } = {}) => {
  const filePath = path ?? serviceAccountKeyPath({ serviceAccount });
  execSync(`gcloud iam service-accounts keys create ${filePath} --iam-account=${serviceAccount}`);
  // Wait after key creation as authentication takes time to become available
  await setTimeout(10000);
};

const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const deleteServiceAccountKey = async ({
  serviceAccount = process.env.SCRIPTS_GOOGLE_SERVICE_ACCOUNT,
  path,
}: { serviceAccount?: string; path?: string } = {}) => {
  const filePath = path ?? serviceAccountKeyPath({ serviceAccount });
  const serviceAccountKeyData = await getServiceAccountKeyData(filePath);
  if (!serviceAccountKeyData) return;
  execSync(
    `yes | gcloud iam service-accounts keys delete ${serviceAccountKeyData['private_key_id']} --iam-account=${serviceAccount}`,
  );
  execSync(`rm -f ${filePath}`);
};

const impersonateServiceAccount = ({
  serviceAccount = process.env.SCRIPTS_GOOGLE_SERVICE_ACCOUNT,
}: { serviceAccount?: string } = {}) => {
  execSync(`gcloud auth application-default login --impersonate-service-account ${serviceAccount}`);
};

const revokeImpersonation = () => {
  execSync('yes | gcloud auth application-default revoke');
};

// NOTE: Use key mode only when handling multiple projects simultaneously
const initializeApp = async ({
  serviceAccount: _serviceAccount,
  authMode = 'impersonate',
}: { serviceAccount?: string; authMode?: 'impersonate' | 'key' } = {}) => {
  if (!environment || !environments.includes(environment)) return null;

  // NOTE: Set environment variables for accessing Google Cloud API
  if (!_serviceAccount) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID!;
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;
  }
  const serviceAccount = _serviceAccount || process.env.SCRIPTS_GOOGLE_SERVICE_ACCOUNT;
  if (['test', 'development'].includes(environment)) {
    console.info('USE EMULATORS...');
    return _serviceAccount
      ? _initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, _serviceAccount)
      : _initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  } else if (authMode === 'key') {
    if (AUTO_AUTH) await createServiceAccountKey({ serviceAccount });
    const serviceAccountKeyData = await getServiceAccountKeyData(serviceAccountKeyPath({ serviceAccount }));
    return _serviceAccount
      ? _initializeApp(
          {
            credential: cert(serviceAccountKeyData),
          },
          _serviceAccount,
        )
      : _initializeApp({ credential: cert(serviceAccountKeyData) });
  } else {
    if (AUTO_AUTH) impersonateServiceAccount({ serviceAccount });
    return _initializeApp();
  }
};

const runWithFirebaseApp = async <T>(fn: () => Promise<T>) => {
  if (!environment || !environments.includes(environment)) {
    console.error('ENVIRONMENT is not set or invalid');
    return;
  }

  try {
    await initializeApp();
    return await fn();
  } catch (error) {
    console.error(error);
  } finally {
    if (AUTO_AUTH && !['test', 'development'].includes(environment)) revokeImpersonation();
  }
};

const secretManagerServiceClient = () => {
  return new SecretManagerServiceClient();
};

const getSecret = async ({ name }: { name: string }) => {
  const client = secretManagerServiceClient();
  const [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/${name}/versions/latest`,
  });
  return accessResponse.payload?.data?.toString();
};

export type { Environment };
export {
  createServiceAccountKey,
  deleteServiceAccountKey,
  environment,
  environments,
  getSecret,
  initializeApp,
  impersonateServiceAccount,
  revokeImpersonation,
  runWithFirebaseApp,
  serviceAccountKeyDir,
};
