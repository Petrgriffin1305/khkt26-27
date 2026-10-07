import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DistractionEvent, RestrictedApp, StudyMaterial } from "@/types";
import type { ApiQuestion, ConfidenceRating } from "@/services/contracts";
interface SetupStore {
  goalText: string;
  topicId: string;
  documentText: string;
  setDocumentText: (text: string) => void;
  materials: StudyMaterial[];
  restrictedApps: RestrictedApp[];
  targetDurationSeconds: number;
  isCompleted: boolean;
  actualDurationSeconds: number;
  distractionAttempts: number;
  distractionLog: DistractionEvent[];
  focusPausedAt: number;
  pausedDurationMs: number;
  logDistraction: (event: DistractionEvent) => void;
  resumeFocus: () => void;
  ownerId: string | null;
  stage: "focus-timer" | "quiz" | "session-summary";
  setOwnerId: (id: string) => void;
  setStage: (stage: "focus-timer" | "quiz" | "session-summary") => void;
  clientId: string;
  startedAt: number;
  serverSessionId: string | null;
  quizQuestions: ApiQuestion[];
  answers: Record<string, number>;
  draftOptions: Record<string, number>;
  confidenceRatings: Record<string, ConfidenceRating>;
  selectOption: (id: string, index: number) => void;
  setConfidence: (id: string, rating: ConfidenceRating) => void;
  syncedAnswers: string[];
  setGoalText: (text: string) => void;
  setTopicId: (id: string) => void;
  addMaterials: (materials: StudyMaterial[]) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (id: string, material: Partial<StudyMaterial>) => void;
  toggleApp: (app: RestrictedApp) => void;
  setRestrictedApps: (apps: RestrictedApp[]) => void;
  setTargetDuration: (seconds: number) => void;
  setIsCompleted: (completed: boolean) => void;
  setActualDuration: (seconds: number) => void;
  setDistractionAttempts: (count: number) => void;
  beginSession: (clientId: string) => void;
  setServerSessionId: (id: string) => void;
  setQuizQuestions: (questions: ApiQuestion[]) => void;
  answer: (id: string, index: number) => void;
  markAnswerSynced: (id: string) => void;
  reset: () => void;
}
const initial = {
  goalText: "",
  topicId: "computer-science",
  documentText: "",
  materials: [] as StudyMaterial[],
  restrictedApps: [] as RestrictedApp[],
  targetDurationSeconds: 1500,
  ownerId: null as string | null,
  stage: "focus-timer" as "focus-timer" | "quiz" | "session-summary",
  isCompleted: false,
  actualDurationSeconds: 0,
  distractionAttempts: 0,
  distractionLog: [] as DistractionEvent[],
  focusPausedAt: 0,
  pausedDurationMs: 0,
  clientId: "",
  startedAt: 0,
  serverSessionId: null as string | null,
  quizQuestions: [] as ApiQuestion[],
  answers: {} as Record<string, number>,
  draftOptions: {} as Record<string, number>,
  confidenceRatings: {} as Record<string, ConfidenceRating>,
  syncedAnswers: [] as string[],
};
export const useSetupStore = create<SetupStore>()(
  persist(
    (set) => ({
      ...initial,
      setOwnerId: (ownerId) => set({ ownerId }),
      setStage: (stage) => set({ stage }),
      setGoalText: (goalText) => set({ goalText }),
      setTopicId: (topicId) => set({ topicId }),
      setDocumentText: (documentText) => set({ documentText }),
      addMaterials: (materials) =>
        set((state) => ({
          materials: [...state.materials, ...materials].slice(0, 4),
        })),
      removeMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),
      updateMaterial: (id, material) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...material } : m,
          ),
        })),
      toggleApp: (app) =>
        set((state) => ({
          restrictedApps: state.restrictedApps.some((a) => a.id === app.id)
            ? state.restrictedApps.filter((a) => a.id !== app.id)
            : [...state.restrictedApps, app],
        })),
      setRestrictedApps: (restrictedApps) => set({ restrictedApps }),
      setTargetDuration: (targetDurationSeconds) =>
        set({ targetDurationSeconds }),
      setIsCompleted: (isCompleted) => set({ isCompleted }),
      setActualDuration: (actualDurationSeconds) =>
        set({ actualDurationSeconds }),
      setDistractionAttempts: (distractionAttempts) =>
        set({ distractionAttempts }),
      logDistraction: (event) =>
        set((state) => state.focusPausedAt ? state : ({
          distractionAttempts: state.distractionAttempts + 1,
          distractionLog: [...state.distractionLog, event],
          focusPausedAt: Date.now(),
        })),
      resumeFocus: () =>
        set((state) => ({
          pausedDurationMs: state.pausedDurationMs + (state.focusPausedAt
            ? Math.max(0, Date.now() - state.focusPausedAt) : 0),
          focusPausedAt: 0,
        })),
      beginSession: (clientId) =>
        set({
          clientId,
          stage: "focus-timer",
          startedAt: Date.now(),
          actualDurationSeconds: 0,
          isCompleted: false,
          distractionAttempts: 0,
          distractionLog: [],
          focusPausedAt: 0,
          pausedDurationMs: 0,
          serverSessionId: null,
          quizQuestions: [],
          answers: {},
          draftOptions: {},
          confidenceRatings: {},
          syncedAnswers: [],
        }),
      setServerSessionId: (serverSessionId) => set({ serverSessionId }),
      setQuizQuestions: (quizQuestions) => set({ quizQuestions, draftOptions: {}, confidenceRatings: {} }),
      selectOption: (id, index) => set(state => state.answers[id] !== undefined ? state : ({
        draftOptions: { ...state.draftOptions, [id]: index },
      })),
      setConfidence: (id, rating) => set(state => state.answers[id] !== undefined ? state : ({
        confidenceRatings: { ...state.confidenceRatings, [id]: rating },
      })),
      answer: (id, index) =>
        set((state) => ({
          answers:
            state.answers[id] === undefined && state.confidenceRatings[id] !== undefined
              ? { ...state.answers, [id]: index }
              : state.answers,
        })),
      markAnswerSynced: (id) =>
        set((state) => ({
          syncedAnswers: [...new Set([...state.syncedAnswers, id])],
        })),
      reset: () =>
        set({
          ...initial,
          materials: [],
          restrictedApps: [],
          answers: {},
          draftOptions: {},
          confidenceRatings: {},
          syncedAnswers: [],
          quizQuestions: [],
        }),
    }),
    {
      name: "pomodoro.draft",
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => ({
        ...(persisted as Partial<SetupStore>),
        documentText: (persisted as Partial<SetupStore>).documentText ?? "",
        draftOptions: (persisted as Partial<SetupStore>).draftOptions ?? {},
        confidenceRatings: (persisted as Partial<SetupStore>).confidenceRatings ?? {},
      }) as SetupStore,
      partialize: (state) => ({
        ...state,
        materials: state.materials.map((material) => ({
          ...material,
          file: undefined,
        })),
      }),
    },
  ),
);
