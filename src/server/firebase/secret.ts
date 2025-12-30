import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { isTest } from '~/utils/utils';

const secretManagerServiceClient = () => {
  return new SecretManagerServiceClient();
};

// Service account requires Secret Manager Secret Accessor role to get secrets
const getSecret = async (name: string) => {
  if (isTest()) return '0'.repeat(64);
  if (process.env[name]) return process.env[name];

  const client = secretManagerServiceClient();
  const [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/secrets/${name}/versions/latest`,
  });
  const value = accessResponse.payload?.data?.toString();
  process.env[name] = value;
  return value;
};

export { getSecret };
