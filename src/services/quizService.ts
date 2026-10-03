import { QuizQuestion } from '@/types';
import mockQuizBank from '@/data/mockQuizBank.json';

/**
 * Shape of a raw quiz entry in the local mock bank.
 * Mirrors the backend API payload so the swap later is a drop-in.
 */
interface QuizBankEntry {
  id: string;
  topicId?: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MOCK_DELAY_MS = 150;

/** Simulate network latency so loading states are exercised during development. */
function simulateNetwork<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

/**
 * Quiz Service — abstraction layer between the UI and the question source.
 *
 * Today it resolves from the local mockQuizBank.json file.
 * To go live, replace the body of getQuestionsByTopic with:
 *
 *   const res = await fetch(`${API_BASE_URL}/quiz/${topicId}`);
 *   if (!res.ok) throw new Error(`Failed to load quiz: ${res.status}`);
 *   return (await res.json()) as QuizQuestion[];
 *
 * The return type stays identical, so no UI changes will be required.
 */
export const quizService = {
  async getQuestionsByTopic(topicId: string): Promise<QuizQuestion[]> {
    const bank = mockQuizBank as QuizBankEntry[];

    // Match on topicId, falling back to the shared "default" set
    // (mirrors the backend: topics without their own set use the default bank).
    const matched = bank.filter(
      (entry) => entry.topicId === topicId || entry.topicId === 'default',
    );

    const questions: QuizQuestion[] = matched.map((entry) => ({
      id: entry.id,
      topicId: entry.topicId ?? 'default',
      question: entry.questionText,
      options: entry.options,
      correctIndex: entry.correctIndex,
      explanation: entry.explanation,
    }));

    return simulateNetwork(questions);
  },
};
