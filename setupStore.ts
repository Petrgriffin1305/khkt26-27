import { create } from 'zustand';
import type { RestrictedApp, StudyMaterial } from '@/types';
<<<<<<< HEAD

/**
 * Zustand store for the multi-step setup flow.
 * Shared across GoalInput -> AppBlockerSetup -> TimerSetup -> FocusTimer screens.
 */
interface SetupStore {
=======
import type { Language } from '@/utils/i18n';

interface SetupStore {
  language: Language;
>>>>>>> a2e8653 (1st)
  goalText: string;
  materials: StudyMaterial[];
  restrictedApps: RestrictedApp[];
  targetDurationSeconds: number;
<<<<<<< HEAD
=======
  actualDurationSeconds: number;
  distractionAttempts: number;
  quizScore: number;
  isCompleted: boolean;
  toggleLanguage: () => void;
>>>>>>> a2e8653 (1st)
  setGoalText: (text: string) => void;
  addMaterials: (materials: StudyMaterial[]) => void;
  removeMaterial: (id: string) => void;
  toggleApp: (app: RestrictedApp) => void;
  setRestrictedApps: (apps: RestrictedApp[]) => void;
  setTargetDuration: (seconds: number) => void;
<<<<<<< HEAD
=======
  setSessionData: (actualDuration: number, distractions: number, completed: boolean) => void;
  setQuizScore: (score: number) => void;
>>>>>>> a2e8653 (1st)
  reset: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
<<<<<<< HEAD
=======
  language: 'vi',
>>>>>>> a2e8653 (1st)
  goalText: '',
  materials: [],
  restrictedApps: [],
  targetDurationSeconds: 25 * 60,
<<<<<<< HEAD
=======
  actualDurationSeconds: 0,
  distractionAttempts: 0,
  quizScore: 0,
  isCompleted: false,
  toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
>>>>>>> a2e8653 (1st)
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
<<<<<<< HEAD
  reset: () =>
    set({
=======
  setSessionData: (actualDuration, distractions, completed) =>
    set({ actualDurationSeconds: actualDuration, distractionAttempts: distractions, isCompleted: completed }),
  setQuizScore: (score) => set({ quizScore: score }),
  reset: () =>
    set((state) => ({
>>>>>>> a2e8653 (1st)
      goalText: '',
      materials: [],
      restrictedApps: [],
      targetDurationSeconds: 25 * 60,
<<<<<<< HEAD
    }),
=======
      actualDurationSeconds: 0,
      distractionAttempts: 0,
      quizScore: 0,
      isCompleted: false,
      language: state.language,
    })),
>>>>>>> a2e8653 (1st)
}));
