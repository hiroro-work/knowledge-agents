/* eslint-disable @typescript-eslint/no-restricted-imports */
import { getApp } from 'firebase/app';
import { httpsCallable as _httpsCallable, getFunctions } from 'firebase/functions';

const httpsCallable = <Request, Response>(name: string) =>
  _httpsCallable<Request, Response>(getFunctions(getApp(), 'asia-northeast1'), name);

export type * from 'firebase/functions';
