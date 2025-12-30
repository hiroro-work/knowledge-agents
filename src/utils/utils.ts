export const isTest = () =>
  process.env.NODE_ENV === 'test' || ['test', 'development'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT || '');

export const isDevelopment = () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

export const isStaging = () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';

export const isLocal = () => process.env.NODE_ENV !== 'production';
