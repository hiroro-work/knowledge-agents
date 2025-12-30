/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFunctions } from '@local/admin-shared';
import { https, logger } from 'firebase-functions/v2';
import {
  onDocumentCreated as _onDocumentCreated,
  onDocumentCreatedWithAuthContext as _onDocumentCreatedWithAuthContext,
  onDocumentDeleted as _onDocumentDeleted,
  onDocumentDeletedWithAuthContext as _onDocumentDeletedWithAuthContext,
  onDocumentUpdated as _onDocumentUpdated,
  onDocumentUpdatedWithAuthContext as _onDocumentUpdatedWithAuthContext,
  onDocumentWritten as _onDocumentWritten,
  onDocumentWrittenWithAuthContext as _onDocumentWrittenWithAuthContext,
} from 'firebase-functions/v2/firestore';
import { onCall as _onCall } from 'firebase-functions/v2/https';
import {
  beforeUserCreated as _beforeUserCreated,
  beforeUserSignedIn as _beforeUserSignedIn,
  HttpsError,
} from 'firebase-functions/v2/identity';
import { onSchedule as _onSchedule } from 'firebase-functions/v2/scheduler';
import { onTaskDispatched as _onTaskDispatched } from 'firebase-functions/v2/tasks';
import { isTest } from '../utils.js';
import type { CleanupDriveSourcePayload } from '../../taskQueues/cleanupDriveSource.js';
import type { InitialSyncAgentDrivePayload } from '../../taskQueues/initialSyncAgentDrive.js';
import type { SyncAgentDrivePayload } from '../../taskQueues/syncAgentDrive.js';
import type { SyncAgentFilePayload } from '../../taskQueues/syncAgentFile.js';
import type { Claims } from '@local/shared';
import type {
  Change,
  DocumentOptions,
  DocumentSnapshot,
  FirestoreAuthEvent,
  FirestoreEvent,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore';
import type { CallableOptions, CallableRequest } from 'firebase-functions/v2/https';
import type { BlockingOptions } from 'firebase-functions/v2/identity';
import type { ScheduledEvent, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import type { TaskQueueOptions, Request } from 'firebase-functions/v2/tasks';

const defaultRegion = 'asia-northeast1';
const defaultTimeZone = 'Asia/Tokyo';
const defaultMemory = '1GiB';
const defaultTimeoutSeconds = 540;

type BeforeUserCreatedHandler = Parameters<typeof _beforeUserCreated>[1];
const beforeUserCreated = (
  optsOrHandler: BlockingOptions | BeforeUserCreatedHandler,
  _handler?: BeforeUserCreatedHandler,
) => {
  const handler = _handler ?? (optsOrHandler as BeforeUserCreatedHandler);
  return _beforeUserCreated(
    {
      region: defaultRegion,
      ...optsOrHandler,
    },
    handler,
  );
};

type BeforeUserSignedInHandler = Parameters<typeof _beforeUserSignedIn>[1];
const beforeUserSignedIn = (
  optsOrHandler: BlockingOptions | BeforeUserSignedInHandler,
  _handler?: BeforeUserSignedInHandler,
) => {
  const handler = _handler ?? (optsOrHandler as BeforeUserSignedInHandler);
  return _beforeUserSignedIn(
    {
      region: defaultRegion,
      ...optsOrHandler,
    },
    handler,
  );
};

type OnCallHandler<T> = (request: CallableRequest<T>) => Promise<any>;
const onCall = <T>(optsOrHandler: CallableOptions | OnCallHandler<T>, _handler?: OnCallHandler<T>) => {
  const handler = _handler ?? (optsOrHandler as OnCallHandler<T>);
  return _onCall<T>(
    {
      region: defaultRegion,
      memory: defaultMemory,
      timeoutSeconds: defaultTimeoutSeconds,
      ...optsOrHandler,
    },
    handler,
  );
};
const customClaims = (auth: CallableRequest<unknown>['auth']) => auth?.token as Claims | undefined;

type OnDocumentCreatedHandler = (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => Promise<void>;
const onDocumentCreated = (opts: DocumentOptions, handler: OnDocumentCreatedHandler) => {
  return _onDocumentCreated(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentCreatedWithAuthContextHandler = (
  event: FirestoreAuthEvent<QueryDocumentSnapshot | undefined>,
) => Promise<void>;
const onDocumentCreatedWithAuthContext = (opts: DocumentOptions, handler: OnDocumentCreatedWithAuthContextHandler) => {
  return _onDocumentCreatedWithAuthContext(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentDeletedHandler = (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => Promise<void>;
const onDocumentDeleted = (opts: DocumentOptions, handler: OnDocumentDeletedHandler) => {
  return _onDocumentDeleted(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentDeletedWithAuthContextHandler = (
  event: FirestoreAuthEvent<QueryDocumentSnapshot | undefined>,
) => Promise<void>;
const onDocumentDeletedWithAuthContext = (opts: DocumentOptions, handler: OnDocumentDeletedWithAuthContextHandler) => {
  return _onDocumentDeletedWithAuthContext(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentUpdatedHandler = (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => Promise<void>;
const onDocumentUpdated = (opts: DocumentOptions, handler: OnDocumentUpdatedHandler) => {
  return _onDocumentUpdated(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentUpdatedWithAuthContextHandler = (
  event: FirestoreAuthEvent<Change<QueryDocumentSnapshot> | undefined>,
) => Promise<void>;
const onDocumentUpdatedWithAuthContext = (opts: DocumentOptions, handler: OnDocumentUpdatedWithAuthContextHandler) => {
  return _onDocumentUpdatedWithAuthContext(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentWrittenHandler = (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>,
) => any;
const onDocumentWritten = (opts: DocumentOptions, handler: OnDocumentWrittenHandler) => {
  return _onDocumentWritten(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type OnDocumentWrittenWithAuthContextHandler = (
  event: FirestoreAuthEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>,
) => Promise<void>;
const onDocumentWrittenWithAuthContext = (opts: DocumentOptions, handler: OnDocumentWrittenWithAuthContextHandler) => {
  return _onDocumentWrittenWithAuthContext(
    { region: defaultRegion, memory: defaultMemory, timeoutSeconds: defaultTimeoutSeconds, ...opts },
    handler,
  );
};

type ScheduleHandler = (event: ScheduledEvent) => void | Promise<void>;
const onSchedule = (options: ScheduleOptions, handler: ScheduleHandler) =>
  _onSchedule(
    {
      region: defaultRegion,
      timeZone: defaultTimeZone,
      memory: defaultMemory,
      timeoutSeconds: defaultTimeoutSeconds,
      ...options,
    },
    handler,
  );

type OnTaskDispatchedHandler<T = any> = (request: Omit<Request, 'data'> & { data: T }) => Promise<void>;
type OnRetryOverHandler<T = any> = (data: T, error: unknown) => Promise<void> | void;
type TaskQueueOptionsWithRetry<T = any> = TaskQueueOptions & {
  onRetryOver?: OnRetryOverHandler<T>;
};
const onTaskDispatched = <T = any>(
  optsOrHandler: TaskQueueOptionsWithRetry<T> | OnTaskDispatchedHandler<T>,
  _handler?: OnTaskDispatchedHandler<T>,
) => {
  const handler = _handler ?? (optsOrHandler as OnTaskDispatchedHandler<T>);
  const { onRetryOver, ..._options } = typeof optsOrHandler === 'function' ? {} : optsOrHandler;
  const options: TaskQueueOptions = {
    region: defaultRegion,
    memory: defaultMemory,
    timeoutSeconds: defaultTimeoutSeconds,
    ..._options,
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 10,
      ..._options.retryConfig,
    },
  };

  return _onTaskDispatched(options, async (request: Request) => {
    try {
      await handler(request as Omit<Request, 'data'> & { data: T });
    } catch (error) {
      const maxAttempts = options.retryConfig!.maxAttempts as number;
      if (request.retryCount >= maxAttempts - 1) {
        await onRetryOver?.(request.data as T, error);
      }
      throw error;
    }
  });
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Keeping definition for template repository although currently unused
const taskQueue = <T extends Record<string, any>>(name: string) => {
  // NOTE: Return empty function because using enqueue in tests causes errors
  return isTest() ? { enqueue: () => {} } : getFunctions().taskQueue<T>(`locations/${defaultRegion}/functions/${name}`);
};

const taskQueues = () => ({
  cleanupDriveSource: taskQueue<CleanupDriveSourcePayload>('taskQueues-cleanupDriveSource'),
  initialSyncAgentDrive: taskQueue<InitialSyncAgentDrivePayload>('taskQueues-initialSyncAgentDrive'),
  syncAgentDrive: taskQueue<SyncAgentDrivePayload>('taskQueues-syncAgentDrive'),
  syncAgentFile: taskQueue<SyncAgentFilePayload>('taskQueues-syncAgentFile'),
});

export {
  defaultRegion,
  defaultTimeZone,
  defaultMemory,
  defaultTimeoutSeconds,
  https,
  logger,
  HttpsError,
  beforeUserCreated,
  beforeUserSignedIn,
  onCall,
  customClaims,
  onDocumentCreated,
  onDocumentCreatedWithAuthContext,
  onDocumentDeleted,
  onDocumentDeletedWithAuthContext,
  onDocumentUpdated,
  onDocumentUpdatedWithAuthContext,
  onDocumentWritten,
  onDocumentWrittenWithAuthContext,
  onSchedule,
  onTaskDispatched,
  taskQueues,
};
