/* eslint-disable @typescript-eslint/no-explicit-any */
export type ModelField = {
  default: any;
  label: string;
};

export type ModelFields = Record<string, ModelField>;
