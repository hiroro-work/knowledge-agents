import { auth } from './auth/index.js';
import { firestore } from './firestore/index.js';
import { schedules } from './schedules/index.js';
import { taskQueues } from './taskQueues/index.js';
import { initializeApp } from './utils/firebase/app.js';

process.env.TZ = 'Asia/Tokyo';
initializeApp();

export { auth, firestore, schedules, taskQueues };
