import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  query,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { describe, beforeEach, it } from 'vitest';
import { agentFactory, userFactory } from '@local/test-shared';
import { firestore, getTestEnv, setCollection, timestamp } from '../../utils';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { Firestore, QueryConstraint } from 'firebase/firestore';

const agentsRef = (db: Firestore) => collection(db, 'agents');
const agentRef = (db: Firestore, id: string) => doc(agentsRef(db), id);
const agentsQuery = (db: Firestore, ...queryConstraints: QueryConstraint[]) =>
  query(agentsRef(db), ...queryConstraints);

const creator = userFactory.build({ id: 'creator-id', role: 'user' });
const other = userFactory.build({ id: 'other-id', role: 'user' });
const admin = userFactory.build({ id: 'admin-id', role: 'admin' });
const creatorAgent = agentFactory.build({ id: 'creator-agent', createdBy: creator.id });
const otherAgent = agentFactory.build({ id: 'other-agent', createdBy: other.id });
const agents = [creatorAgent, otherAgent];

export const agentsTest = () => {
  describe('agents', () => {
    let env: RulesTestEnvironment;

    beforeEach(async () => {
      env = getTestEnv();
      await env.withSecurityRulesDisabled(async (context) => {
        const adminDb = firestore(context);
        await setCollection(agentsRef(adminDb), agents);
      });
    });

    describe('Unauthenticated', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.unauthenticatedContext());
      });

      it('cannot read (get)', async () => {
        await assertFails(getDoc(agentRef(db, creatorAgent.id)));
      });

      it('cannot read (list)', async () => {
        await assertFails(getDocs(agentsQuery(db)));
      });

      it('cannot create', async () => {
        const newAgent = agentFactory.build({ id: 'new-agent', createdBy: 'someone' });
        await assertFails(setDoc(agentRef(db, newAgent.id), newAgent));
      });

      it('cannot update', async () => {
        await assertFails(updateDoc(agentRef(db, creatorAgent.id), { name: 'Updated' }));
      });

      it('cannot delete', async () => {
        await assertFails(deleteDoc(agentRef(db, creatorAgent.id)));
      });
    });

    describe('Regular user', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.authenticatedContext(creator.id, { role: creator.role }));
      });

      it('can read (get)', async () => {
        await assertSucceeds(getDoc(agentRef(db, creatorAgent.id)));
      });

      it('can read (list)', async () => {
        await assertSucceeds(getDocs(agentsQuery(db)));
      });

      describe('Agent created by self', () => {
        it('can update', async () => {
          await assertSucceeds(
            updateDoc(agentRef(db, creatorAgent.id), {
              name: 'Updated',
              updatedAt: serverTimestamp(),
            }),
          );
        });

        it('cannot overwrite createdAt', async () => {
          await assertFails(
            updateDoc(agentRef(db, creatorAgent.id), {
              name: 'Updated',
              createdAt: timestamp(new Date()),
            }),
          );
        });

        it('can delete', async () => {
          await assertSucceeds(deleteDoc(agentRef(db, creatorAgent.id)));
        });
      });

      describe('Agent created by another user', () => {
        it('can read (get)', async () => {
          await assertSucceeds(getDoc(agentRef(db, otherAgent.id)));
        });

        it('cannot create', async () => {
          const newAgent = agentFactory.build({ id: 'new-agent', createdBy: creator.id });
          await assertFails(setDoc(agentRef(db, newAgent.id), newAgent));
        });

        it('cannot update', async () => {
          await assertFails(updateDoc(agentRef(db, otherAgent.id), { name: 'Updated' }));
        });

        it('cannot delete', async () => {
          await assertFails(deleteDoc(agentRef(db, otherAgent.id)));
        });
      });
    });

    describe('Admin', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.authenticatedContext(admin.id, { role: admin.role }));
      });

      it('can read (get)', async () => {
        await assertSucceeds(getDoc(agentRef(db, creatorAgent.id)));
      });

      it('can read (list)', async () => {
        await assertSucceeds(getDocs(agentsQuery(db)));
      });

      it('cannot create (API only)', async () => {
        const newAgent = agentFactory.build({ id: 'new-agent', createdBy: admin.id });
        await assertFails(setDoc(agentRef(db, newAgent.id), newAgent));
      });

      describe('Agent created by another user', () => {
        it('can update', async () => {
          await assertSucceeds(
            updateDoc(agentRef(db, creatorAgent.id), {
              name: 'Updated by admin',
              updatedAt: serverTimestamp(),
            }),
          );
        });

        it('cannot overwrite createdAt', async () => {
          await assertFails(
            updateDoc(agentRef(db, creatorAgent.id), {
              name: 'Updated',
              createdAt: timestamp(new Date()),
            }),
          );
        });

        it('can delete', async () => {
          await assertSucceeds(deleteDoc(agentRef(db, creatorAgent.id)));
        });
      });
    });
  });
};
