'use client';

import { useAuth as _useAuth } from '@sonicgarden/react-fire-hooks';
import { createContext, useContext, useMemo } from 'react';
import { defaultUserRole } from '@local/shared';
import { userRef, useUserDocument } from '~/models/user';
import type { User, Claims, UserRole } from '@local/shared';
import type { FC, ReactNode } from 'react';
import type { User as FirebaseUser } from '~/utils/firebase/auth';

type AuthContextValue = {
  firebaseUser?: FirebaseUser | null;
  currentUser?: User | null;
  claims?: Claims | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signedIn: boolean | undefined;
};

export const AuthContext = createContext<AuthContextValue>({
  role: defaultUserRole,
  isAdmin: false,
  loading: false,
  signedIn: undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, claims, loading: loadingAuth, signedIn: signedInAuth } = _useAuth();
  const { data: currentUser, loading: loadingData } = useUserDocument(userRef(firebaseUser?.uid));
  const role = useMemo(() => {
    if (!claims?.role || !currentUser?.role) return defaultUserRole;
    if (claims.role !== currentUser.role) return defaultUserRole;
    return currentUser.role;
  }, [currentUser?.role, claims?.role]);
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const loading = useMemo(
    () => loadingAuth || loadingData || !!(firebaseUser && !currentUser),
    [loadingAuth, loadingData, firebaseUser, currentUser],
  );
  const signedIn = useMemo(() => {
    if (loading) return undefined;
    return signedInAuth;
  }, [loading, signedInAuth]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, currentUser, claims: claims as Claims, role, isAdmin, loading, signedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export type WithAuthProps = {
  children: ReactNode;
};

export const withAuth = (WrappedComponent: FC<WithAuthProps>) => {
  const WithAuth = ({ children }: { children?: ReactNode }) => (
    <AuthProvider>
      <WrappedComponent>{children}</WrappedComponent>
    </AuthProvider>
  );

  return WithAuth;
};

export const useAuth = () => useContext(AuthContext);
