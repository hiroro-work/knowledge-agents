import { onDeleted } from './onDeleted.js';
import { syncSession } from './syncSession/index.js';

export const agent = {
  onDeleted,
  syncSession,
};
