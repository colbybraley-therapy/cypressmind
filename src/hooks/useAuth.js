import { useState, useEffect } from 'react';

/**
 * useAuth — wraps Supabase auth state.
 * Returns the current user and convenience sign-in/out helpers.
 */
export function useAuth(db) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [db]);

  const signIn = (email, password) =>
    db.auth.signInWithPassword({ email, password });

  const signOut = () => db.auth.signOut();

  return { user, loading, signIn, signOut };
}
