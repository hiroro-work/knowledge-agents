import { resolve } from 'path';
import dotenv from 'dotenv';

export const env = (environment: 'stg' | 'prod') => {
  const path = resolve(`.env.${environment}`);
  const { parsed } = dotenv.config({ path, override: false });
  return parsed;
};
