import { create } from 'zustand';
import type { RestrictedApp, StudyMaterial } from '@/types';

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
  setDistractionAttempts: (count) => set({ distractionAttempts: count }),
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
      quizScore: 0,
      totalQuizQuestions: 0,
    }),
}));
