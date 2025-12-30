import { vi, describe, afterEach, it, expect, beforeAll, beforeEach } from 'vitest';
import { getAuth } from '@local/admin-shared';
import { clear, generateIdToken } from '~/server/_tests/utils';
import { initializeApp } from '~/server/firebase/app';

const readStreamResponse = async (response: Response): Promise<{ texts: string[]; error?: string }> => {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const texts: string[] = [];
  let error: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n').filter((line) => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) {
          texts.push(parsed.text);
        }
        if (parsed.error) {
          error = parsed.error;
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return { texts, error };
};

describe('streamingApiHandler', async () => {
  const { streamingApiHandler } = await import('../handler');
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

  it('can execute streaming API with authentication', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'Hello';
      yield ' World';
    });
    const handler = streamingApiHandler<{ name: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    const { texts, error } = await readStreamResponse(response);
    expect(error).toBeUndefined();
    expect(texts).toEqual(['Hello', ' World']);
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

  it('can execute streaming API without authentication', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'Hello';
    });
    const handler = streamingApiHandler<{ name: string }>(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'test' }),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    const { texts, error } = await readStreamResponse(response);
    expect(error).toBeUndefined();
    expect(texts).toEqual(['Hello']);
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

  it('streams chunks correctly', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'chunk1';
      yield 'chunk2';
      yield 'chunk3';
    });
    const handler = streamingApiHandler(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');
    const { texts, error } = await readStreamResponse(response);
    expect(error).toBeUndefined();
    expect(texts).toEqual(['chunk1', 'chunk2', 'chunk3']);
  });

  it('returns error via SSE when error occurs in generator', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'before error';
      throw new Error('Test error');
    });
    const handler = streamingApiHandler(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    const { texts, error } = await readStreamResponse(response);
    expect(texts).toEqual(['before error']);
    expect(error).toBe('Internal Server Error');
  });

  it('returns error content as-is when Response is thrown', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'before error';
      throw new Response('Not Found', { status: 404 });
    });
    const handler = streamingApiHandler(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    const { texts, error } = await readStreamResponse(response);
    expect(texts).toEqual(['before error']);
    expect(error).toBe('Not Found');
  });

  it('returns 400 error for JSON parse error', async () => {
    const mockHandler = vi.fn().mockImplementation(async function* () {
      yield 'Hello';
    });
    const handler = streamingApiHandler(mockHandler);
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await handler(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: 'Invalid JSON' });
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
