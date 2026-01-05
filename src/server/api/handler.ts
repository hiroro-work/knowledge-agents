import { randomUUID } from 'crypto';
import { getErrorMessage, getErrorStack } from '@local/shared';
import { getDecodedIdToken } from '~/server/firebase/auth';
import { logger as _logger } from '../logging';
import type { DecodedIdToken } from '@local/admin-shared';

type RequestInfo = {
  id: string;
  url: {
    href: string;
    pathname: string;
  };
  auth?: {
    uid: string;
  };
};

const createRequestInfo = (request: Request, auth: DecodedIdToken | null): RequestInfo => {
  const url = new URL(request.url);
  return {
    id: randomUUID(),
    url: {
      href: url.href,
      pathname: url.pathname,
    },
    auth: auth ? { uid: auth?.uid } : undefined,
  };
};

const createApiLogger = (request: Request, auth: DecodedIdToken | null) => {
  const requestInfo = createRequestInfo(request, auth);
  return Object.entries(_logger).reduce(
    (acc, [key, fn]) => ({
      [key]: (message: string, data?: Record<string, unknown>) =>
        fn(message, { request: requestInfo, ...data }, { labels: { endpoint: requestInfo.url.pathname } }),
      ...acc,
    }),
    {},
  ) as typeof _logger;
};

type DefaultRequest = object | null;
type DefaultResponse = object | void;
type ApiHandlerFunction<Request = DefaultRequest, Response = DefaultResponse> = ({
  data,
  auth,
  logger,
}: {
  data: Request;
  auth: DecodedIdToken | null;
  logger: typeof _logger;
}) => Promise<Response>;

// ex)
// const sample: ApiHandlerFunction<{ name: string }, { message: string }> = async ({ data, auth, logger }) => {
//   await logger.info('Sample action', { data, auth });
//   return { message: `Hello ${data.name}` };
// };
// export const POST = apiHandler(sample);
const apiHandler = <Request = DefaultRequest, Response = DefaultResponse>(
  fn: ApiHandlerFunction<Request, Response>,
) => {
  return async (request: globalThis.Request) => {
    let logger: typeof _logger;
    try {
      const data = await request.json();
      const auth = await getDecodedIdToken(request);
      logger = createApiLogger(request, auth);
      await logger.info(`[START][${request.method}] ${request.url}`);
      const response = await fn({ data, auth, logger });
      await logger.info(`[END][${request.method}] ${request.url}`);
      return globalThis.Response.json(response ?? null);
    } catch (error) {
      logger ||= createApiLogger(request, null);
      await logger.error(`[ERROR][${request.method}] ${request.url}`, {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      });
      return error instanceof globalThis.Response
        ? globalThis.Response.json({ error: await error.text() }, { status: error.status })
        : globalThis.Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
};

type StreamingApiHandlerFunction<Request = DefaultRequest> = ({
  data,
  auth,
  logger,
}: {
  data: Request;
  auth: DecodedIdToken | null;
  logger: typeof _logger;
}) => AsyncGenerator<string, void, unknown>;

// ex)
// const stream: StreamingApiHandlerFunction<{ prompt: string }> = async function* ({ data, auth, logger }) {
//   yield 'Hello';
//   yield ' World';
// };
// export const POST = streamingApiHandler(stream);
const streamingApiHandler = <Request = DefaultRequest>(fn: StreamingApiHandlerFunction<Request>) => {
  return async (request: globalThis.Request) => {
    let data: Request;
    try {
      data = await request.json();
    } catch {
      return globalThis.Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const auth = await getDecodedIdToken(request);
    const logger = createApiLogger(request, auth);
    await logger.info(`[START][${request.method}] ${request.url}`);
    const encoder = new TextEncoder();
    const generator = fn({ data, auth, logger });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            const jsonData = JSON.stringify({ text: chunk });
            controller.enqueue(encoder.encode(`data: ${jsonData}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          await logger.info(`[END][${request.method}] ${request.url}`);
          controller.close();
        } catch (error) {
          await logger.error(`[ERROR][${request.method}] ${request.url}`, {
            error: getErrorMessage(error),
            stack: getErrorStack(error),
          });
          if (error instanceof globalThis.Response) {
            const errorText = await error.text();
            const errorData = JSON.stringify({ error: errorText });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } else {
            const errorData = JSON.stringify({ error: 'Internal Server Error' });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  };
};

export type { ApiHandlerFunction, StreamingApiHandlerFunction };
export { apiHandler, streamingApiHandler };
