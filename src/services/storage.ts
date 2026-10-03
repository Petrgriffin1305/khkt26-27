import { StudySession } from '@/types';

const SESSIONS_KEY = '@pomodoro_sessions';

type SessionListener = (sessions: StudySession[]) => void;

/**
 * Lightweight session storage with an in-memory cache.
 * Swap the internal implementation with AsyncStorage or MMKV later
 * without changing the public API.
 */
class SessionStorage {
  private sessions: StudySession[] = [];
  private listeners: Set<SessionListener> = new Set();
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    // In a real implementation, read from AsyncStorage / MMKV here.
    // For now, sessions are kept in memory for the current app lifecycle.
    this.isLoaded = true;
  }

  async saveSession(session: StudySession): Promise<void> {
    this.sessions = [session, ...this.sessions];
    this.notifyListeners();
  }

  async getAllSessions(): Promise<StudySession[]> {
    return [...this.sessions];
  }

  async clearAll(): Promise<void> {
    this.sessions = [];
    this.notifyListeners();
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener([...this.sessions]);
    }
  }
}

export const sessionStorage = new SessionStorage();
