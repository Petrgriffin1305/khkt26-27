/** Core data models — see PROJECT_CONTEXT §2. */

export interface StudySession {
  id: string;
  goalText: string;
  topicId: string;
  targetDurationSeconds: number;
  actualDurationSeconds: number;
  distractionAttempts: number;
  quizScore: number;
  totalQuizQuestions: number;
  isCompleted: boolean;
  timestamp: string; // ISO String
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** A file attached by the user as study material. */
export interface StudyMaterial {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  file?: File;
  uploaded?: import("@/services/contracts").UploadedDocument;
}

/** Shape of the multi-step setup flow shared between screens. */
export interface SetupState {
  goalText: string;
  materials: StudyMaterial[];
}

/** Expo Go detects leaving the app; a named app is only known in simulation. */
export interface DistractionEvent {
  timestamp: string;
  appId: string;
  appName: string;
  simulated?: boolean;
}

/** An app selected for the user's focus plan. */
export interface RestrictedApp {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  category: AppCategory;
  packageName?: string; // Android package name or iOS bundle id
}

/** Categories for quick preset selection. */
export type AppCategory = "social" | "games" | "streaming" | "other";

/** Preset definition for quick selection. */
export interface AppPreset {
  id: string;
  label: string;
  icon: string;
  category: AppCategory;
  appIds: string[];
}
