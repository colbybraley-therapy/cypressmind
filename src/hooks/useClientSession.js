import { useState, useCallback } from 'react';

/**
 * useClientSession — manages the active live session between
 * therapist and client. Shared between clinical and adventure UIs.
 *
 * Returns session state, a start fn, and an end fn.
 */
export function useClientSession(db) {
  const [session, setSession]     = useState(null);
  const [elapsed, setElapsed]     = useState(0);
  const [timerRef, setTimerRef]   = useState(null);

  const startSession = useCallback(async ({ clientId, activityType }) => {
    // Generate a 6-char join code
    const code = Array.from({ length: 6 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');

    const { data, error } = await db.from('sessions').insert({
      code,
      client_id:     clientId,
      activity_type: activityType,
      status:        'waiting',
    }).select().single();

    if (error) throw error;

    setSession(data);
    setElapsed(0);

    const ref = setInterval(() => setElapsed(s => s + 1), 1000);
    setTimerRef(ref);

    return data;
  }, [db]);

  const endSession = useCallback(async () => {
    if (!session) return;
    clearInterval(timerRef);

    await db.from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id);

    const snapshot = { ...session, duration: elapsed };
    setSession(null);
    return snapshot;
  }, [db, session, elapsed, timerRef]);

  return { session, elapsed, startSession, endSession };
}
