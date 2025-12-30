import { vi, describe, afterEach, it, expect, beforeAll, beforeEach } from 'vitest';
import { getAuth } from '@local/admin-shared';
import { clear, generateIdToken } from '~/server/_tests/utils';
import { initializeApp } from '~/server/firebase/app';

describe('apiHandler', async () => {
  const { apiHandler } = await import('../handler');
  let authToken: string;

  beforeAll(() => {
    initializeApp();
  });

  beforeEach(async () => {
    const auth = getAuth();
    await auth.createUser({
      uid: 'user-id',
    });
    authToken = await generateIdToken('user-id');
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await clear();
  });

  it('can execute API with authentication', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: 'success' });
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ result: 'success' });
    expect(mockHandler).toHaveBeenCalledWith({
      data: { name: 'test' },
      auth: expect.objectContaining({
        uid: 'user-id',
      }),
      logger: expect.objectContaining({
        info: expect.any(Function),
        warn: expect.any(Function),
        error: expect.any(Function),
      }),
    });
  });

  it('can execute API without authentication', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: 'success' });
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ result: 'success' });
    expect(mockHandler).toHaveBeenCalledWith({
      data: { name: 'test' },
      auth: null,
      logger: expect.objectContaining({
        info: expect.any(Function),
        warn: expect.any(Function),
        error: expect.any(Function),
      }),
    });
  });

  it('can execute API without arguments', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: 'success' });
    const handler = apiHandler<void, { result: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const response = await handler(request);

    const jsonResponse = await response.json();
    expect(jsonResponse).toEqual({ result: 'success' });
    expect(mockHandler).toHaveBeenCalledWith({
      data: {},
      auth: null,
      logger: expect.any(Object),
    });
  });

  it('returns null for empty response', async () => {
    const mockHandler = vi.fn().mockResolvedValue(null);
    const handler = apiHandler<{ name: string }, null>(mockHandler);

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    const jsonResponse = await response.json();
    expect(jsonResponse).toBeNull();
  });

  it('returns 500 error when error occurs in action', async () => {
    const error = new Error('Test error');
    const mockHandler = vi.fn().mockRejectedValue(error);
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: 'Internal Server Error' });
    expect(mockHandler).toHaveBeenCalled();
  });

  it('returns 500 error when authentication error occurs', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: 'success' });
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: 'Internal Server Error' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('returns error content as-is when Response is thrown', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Not Found' });
    expect(mockHandler).toHaveBeenCalled();
  });

  it('returns 500 error when non-Response is thrown', async () => {
    const errorValue = 'String error';
    const mockHandler = vi.fn().mockRejectedValue(errorValue);
    const handler = apiHandler<{ name: string }, { result: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: 'Internal Server Error' });
    expect(mockHandler).toHaveBeenCalled();
  });
});
