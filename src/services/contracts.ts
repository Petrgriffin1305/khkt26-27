export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}
export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
export interface AuthResponse {
  user: User;
  tokens: Tokens;
}
export interface Topic {
  id: string;
  name: string;
  icon: string;
  question_count: number;
}
export interface ApiQuestion {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}
export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  thumbnail_url: string | null;
  size_bytes: number;
  mime_type: string;
  created_at: string;
}
export interface SessionInput {
  client_id: string;
  goal_text: string;
  topic_id: string;
  target_duration_seconds: number;
  actual_duration_seconds: number;
  distraction_attempts: number;
  quiz_score: number;
  total_quiz_questions: number;
  is_completed: boolean;
  apps_blocked: string[];
  documents: {
    id: string;
    name: string;
    url: string;
    thumbnail_url?: string | null;
  }[];
}
export interface ApiSession extends SessionInput {
  id: string;
  user_id: string;
  created_at: string;
}
export interface Answer {
  id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
}
export interface Stats {
  total_sessions: number;
  total_focus_time_formatted: string;
  average_quiz_score: number;
  streak_days: number;
  completion_rate: number;
}
