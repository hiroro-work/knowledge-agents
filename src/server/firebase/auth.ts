import { getAuth as _getAuth } from '@local/admin-shared';
import { getApp } from './app';
import type { DecodedIdToken } from '@local/admin-shared';

const getAuth = () => {
  return _getAuth(getApp());
};

const getDecodedIdToken = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  const decodedIdToken = await getAuth().verifyIdToken(token);
  return decodedIdToken;
};

export type { DecodedIdToken };
export { getAuth, getDecodedIdToken };
