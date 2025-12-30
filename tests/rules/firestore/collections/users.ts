import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { collection, doc, query, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { describe, beforeEach, it } from 'vitest';
import { userFactory } from '@local/test-shared';
import { firestore, getTestEnv, setCollection } from '../../utils';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { Firestore, QueryConstraint } from 'firebase/firestore';

const usersRef = (db: Firestore) => collection(db, 'users');
const userRef = (db: Firestore, id: string) => doc(usersRef(db), id);
const usersQuery = (db: Firestore, ...queryConstraints: QueryConstraint[]) => query(usersRef(db), ...queryConstraints);

const user = userFactory.build({ id: 'user-id', role: 'user' });
const other = userFactory.build({ id: 'other-id', role: 'user' });
const admin = userFactory.build({ id: 'admin-id', role: 'admin' });
const users = [user, other, admin];

export const usersTest = () => {
  describe('users', () => {
    let env: RulesTestEnvironment;

    beforeEach(async () => {
      env = getTestEnv();
      await env.withSecurityRulesDisabled(async (context) => {
        const adminDb = firestore(context);
        await setCollection(usersRef(adminDb), users);
      });
    });

    describe('Unauthenticated', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.unauthenticatedContext());
      });

      it('cannot read (get)', async () => {
        await assertFails(getDoc(userRef(db, user.id)));
      });

      it('cannot read (list)', async () => {
        await assertFails(getDocs(usersQuery(db)));
      });

      it('cannot create', async () => {
        const newUser = userFactory.build();
        await assertFails(addDoc(usersRef(db), newUser));
      });

      it('cannot update', async () => {
        await assertFails(updateDoc(userRef(db, user.id), { role: 'admin' }));
      });

      it('cannot delete', async () => {
        await assertFails(deleteDoc(userRef(db, user.id)));
      });
    });

    describe('Regular user', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.authenticatedContext(user.id, { role: user.role }));
      });

      it('cannot read (list)', async () => {
        await assertFails(getDocs(usersQuery(db)));
      });

      describe('Own data', () => {
        it('can read (get)', async () => {
          await assertSucceeds(getDoc(userRef(db, user.id)));
        });

        it('cannot update', async () => {
          await assertFails(updateDoc(userRef(db, user.id), { role: 'admin' }));
        });

        it('cannot delete', async () => {
          await assertFails(deleteDoc(userRef(db, user.id)));
        });
      });

      describe("Other user's data", () => {
        it('cannot read (get)', async () => {
          await assertFails(getDoc(userRef(db, other.id)));
        });

        it('cannot create', async () => {
          const newUser = userFactory.build({ id: 'new-user-id' });
          await assertFails(addDoc(usersRef(db), newUser));
        });

        it('cannot update', async () => {
          await assertFails(updateDoc(userRef(db, other.id), { role: 'admin' }));
        });

        it('cannot delete', async () => {
          await assertFails(deleteDoc(userRef(db, other.id)));
        });
      });
    });

    describe('Admin', () => {
      let db: Firestore;

      beforeEach(() => {
        db = firestore(env.authenticatedContext(admin.id, { role: admin.role }));
      });

      it('can read (list)', async () => {
        await assertSucceeds(getDocs(usersQuery(db)));
      });

      describe('Own data', () => {
        it('can read (get)', async () => {
          await assertSucceeds(getDoc(userRef(db, admin.id)));
        });

        it('cannot update', async () => {
          await assertFails(updateDoc(userRef(db, admin.id), { role: 'user' }));
        });

        it('cannot delete', async () => {
          await assertFails(deleteDoc(userRef(db, admin.id)));
        });
      });

      describe("Other user's data", () => {
        it('can read (get)', async () => {
          await assertSucceeds(getDoc(userRef(db, other.id)));
        });

        it('cannot create', async () => {
          const newUser = userFactory.build({ id: 'new-user-id' });
          await assertFails(addDoc(usersRef(db), newUser));
        });

        it('cannot update', async () => {
          await assertFails(updateDoc(userRef(db, other.id), { role: 'admin' }));
        });

        it('cannot delete', async () => {
          await assertFails(deleteDoc(userRef(db, other.id)));
        });
      });
    });
  });
};
