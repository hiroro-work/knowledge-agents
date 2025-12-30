import { defineString, defineSecret } from 'firebase-functions/params';

const stringEnvs = ['ENVIRONMENT'] as const;
const arrayEnvs = [] as const;
const stringSecrets = ['GEMINI_API_KEY'] as const;

type StringEnvs = (typeof stringEnvs)[number];
type ArrayEnvs = (typeof arrayEnvs)[number];
type StringSecrets = (typeof stringSecrets)[number];
type Envs = StringEnvs | ArrayEnvs;
type Secrets = StringSecrets;
type Env<T> = T extends ArrayEnvs ? string[] : T extends StringEnvs | StringSecrets ? string : undefined;

// NOTE:
// Using find instead of includes because includes causes type errors
// https://github.com/microsoft/TypeScript/issues/31018
export const env = <T extends Envs | Secrets>(name: T): Env<T> => {
  if (stringEnvs.find((_) => _ === name)) return defineString(name).value() as Env<T>;
  if (arrayEnvs.find((_) => _ === name)) return defineString(name).value().split(', ') as Env<T>;
  if (stringSecrets.find((_) => _ === name)) return defineSecret(name).value() as Env<T>;

  return undefined as Env<T>;
};
