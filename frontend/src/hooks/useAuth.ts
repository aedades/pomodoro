import { useState, useEffect, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: isFirebaseConfigured, // Only loading if Firebase is configured
    error: null,
  });

  useEffect(() => {
    // If Firebase isn't configured, we're in guest mode
    if (!auth || !isFirebaseConfigured) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({ user, loading: false, error: null });
      },
      (error) => {
        console.error('Auth state error:', error);
        setState({ user: null, loading: false, error: error.message });
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) {
      setState((prev) => ({ ...prev, error: 'Firebase not configured' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isFirebaseConfigured,
    signInWithGoogle,
    signOut,
  };
}
