import { create } from 'zustand';
import type { DistractionEvent, RestrictedApp, StudyMaterial } from '@/types';

/**
 * Zustand store for the multi-step setup flow.
 * Shared across GoalInput -> AppBlockerSetup -> TimerSetup -> FocusTimer screens.
 */
interface SetupStore {
  goalText: string;
  materials: StudyMaterial[];
  restrictedApps: RestrictedApp[];
  targetDurationSeconds: number;
  isCompleted: boolean;
  actualDurationSeconds: number;
  distractionAttempts: number;
  /** Total distraction count — synced alias of distractionAttempts for session consumers. */
  totalDistractionCount: number;
  /** Timestamped log of every detected distraction (app id + name). */
  distractionLog: DistractionEvent[];
  quizScore: number;
  totalQuizQuestions: number;
  setGoalText: (text: string) => void;
  addMaterials: (materials: StudyMaterial[]) => void;
  removeMaterial: (id: string) => void;
  toggleApp: (app: RestrictedApp) => void;
  setRestrictedApps: (apps: RestrictedApp[]) => void;
  setTargetDuration: (seconds: number) => void;
  setIsCompleted: (completed: boolean) => void;
  setActualDuration: (seconds: number) => void;
  setDistractionAttempts: (count: number) => void;
  /** Log a distraction event: increment counters and append to the session log. */
  logDistraction: (appId: string, appName: string) => void;
  setQuizScore: (score: number) => void;
  setTotalQuizQuestions: (total: number) => void;
  reset: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
  goalText: '',
  materials: [],
  restrictedApps: [],
  targetDurationSeconds: 25 * 60,
  isCompleted: false,
  actualDurationSeconds: 0,
  distractionAttempts: 0,
  totalDistractionCount: 0,
  distractionLog: [],
  quizScore: 0,
  totalQuizQuestions: 0,
  setGoalText: (text) => set({ goalText: text }),
  addMaterials: (materials) =>
    set((state) => ({ materials: [...state.materials, ...materials] })),
  removeMaterial: (id) =>
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
    })),
  toggleApp: (app) =>
    set((state) => {
      const exists = state.restrictedApps.some((a) => a.id === app.id);
      return {
        restrictedApps: exists
          ? state.restrictedApps.filter((a) => a.id !== app.id)
          : [...state.restrictedApps, app],
      };
    }),
  setRestrictedApps: (apps) => set({ restrictedApps: apps }),
  setTargetDuration: (seconds) => set({ targetDurationSeconds: seconds }),
  setIsCompleted: (completed) => set({ isCompleted: completed }),
  setActualDuration: (seconds) => set({ actualDurationSeconds: seconds }),
  setDistractionAttempts: (count) =>
    set({ distractionAttempts: count, totalDistractionCount: count }),
  logDistraction: (appId, appName) =>
    set((state) => ({
      distractionAttempts: state.distractionAttempts + 1,
      totalDistractionCount: state.totalDistractionCount + 1,
      distractionLog: [
        ...state.distractionLog,
        { timestamp: new Date().toISOString(), appId, appName } satisfies DistractionEvent,
      ],
    })),
  setQuizScore: (score) => set({ quizScore: score }),
  setTotalQuizQuestions: (total) => set({ totalQuizQuestions: total }),
  reset: () =>
    set({
      goalText: '',
      materials: [],
      restrictedApps: [],
      targetDurationSeconds: 25 * 60,
      isCompleted: false,
      actualDurationSeconds: 0,
      distractionAttempts: 0,
      totalDistractionCount: 0,
      distractionLog: [],
      quizScore: 0,
      totalQuizQuestions: 0,
    }),
}));
