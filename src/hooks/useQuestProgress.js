import { useState, useCallback } from 'react';

/**
 * useQuestProgress — tracks a child's current step within an activity.
 * Drives the AdventureScene prompt queue and XP accumulation.
 */
export function useQuestProgress({ totalSteps = 6, xpPerStep = 10 } = {}) {
  const [step, setStep]         = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [completed, setCompleted] = useState(false);

  const advance = useCallback(() => {
    setStep(prev => {
      const next = prev + 1;
      setXpEarned(x => x + xpPerStep);
      if (next >= totalSteps) setCompleted(true);
      return next;
    });
  }, [totalSteps, xpPerStep]);

  const reset = useCallback(() => {
    setStep(0);
    setXpEarned(0);
    setCompleted(false);
  }, []);

  return { step, xpEarned, completed, advance, reset, totalSteps };
}
