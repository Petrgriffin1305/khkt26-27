import { create } from 'zustand';
import type { RestrictedApp, StudyMaterial } from '@/types';

/**
 * Zustand store for the multi-step setup flow.
 * Shared across GoalInput → AppBlockerSetup → TimerSetup screens.
 */
interface SetupStore {
  goalText: string;
  materials: StudyMaterial[];
  restrictedApps: RestrictedApp[];
  setGoalText: (text: string) => void;
  addMaterials: (materials: StudyMaterial[]) => void;
  removeMaterial: (id: string) => void;
  toggleApp: (app: RestrictedApp) => void;
  setRestrictedApps: (apps: RestrictedApp[]) => void;
  reset: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
  goalText: '',
  materials: [],
  restrictedApps: [],
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
  reset: () => set({ goalText: '', materials: [], restrictedApps: [] }),
}));
