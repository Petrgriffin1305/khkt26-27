import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Minimum time (in seconds) the app must be in the background
 * before the return is counted as a distraction attempt.
 */
const DISTRACTION_THRESHOLD_SECONDS = 3;

interface UseDistractionMonitorOptions {
  /** Whether the monitor is active (true while shield is on). */
  isActive: boolean;
  /** Optional callback fired each time a distraction is detected. */
  onDistraction?: () => void;
}

interface UseDistractionMonitorReturn {
  /** Number of distraction attempts detected. */
  distractionAttempts: number;
  /** Reset the distraction counter to zero. */
  resetDistractionAttempts: () => void;
}

/**
 * Custom hook that monitors AppState transitions to detect distraction attempts.
 *
 * Flow:
 *   1. App goes to background/inactive → record timestamp.
 *   2. App returns to foreground → compute elapsed time.
 *   3. If elapsed > DISTRACTION_THRESHOLD_SECONDS → increment counter,
 *      fire haptic warning, and call onDistraction callback.
 *
 * All AppState logic is isolated here so the UI component stays clean.
 */
export function useDistractionMonitor({
  isActive,
  onDistraction,
}: UseDistractionMonitorOptions): UseDistractionMonitorReturn {
  const [distractionAttempts, setDistractionAttempts] = useState(0);

  // Ref to track current AppState without re-triggering the effect.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Ref to store the timestamp when the app went to background.
  const backgroundTimestampRef = useRef<number | null>(null);

  // Keep the callback in a ref so the effect doesn't re-subscribe.
  const onDistractionRef = useRef(onDistraction);
  useEffect(() => {
    onDistractionRef.current = onDistraction;
  }, [onDistraction]);

  useEffect(() => {
    if (!isActive) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const prevState = appStateRef.current;

        // App going to background or becoming inactive.
        if (prevState === 'active' && nextAppState.match(/inactive|background/)) {
          backgroundTimestampRef.current = Date.now();
        }

        // App returning to foreground.
        if (
          prevState.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          if (backgroundTimestampRef.current !== null) {
            const elapsedSeconds =
              (Date.now() - backgroundTimestampRef.current) / 1000;
            backgroundTimestampRef.current = null;

            if (elapsedSeconds > DISTRACTION_THRESHOLD_SECONDS) {
              setDistractionAttempts((prev) => prev + 1);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              ).catch(() => {});
              onDistractionRef.current?.();
            }
          }
        }

        appStateRef.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  const resetDistractionAttempts = useCallback(() => {
    setDistractionAttempts(0);
  }, []);

  return { distractionAttempts, resetDistractionAttempts };
}
