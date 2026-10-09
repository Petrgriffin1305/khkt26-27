import { useEffect, useRef, useState } from "react";
import type { Session } from "../../backend/src/adventure/domain";
import { knowledgeGaps } from "./learning";
import {
  emptyQuizDraft,
  isQuizCount,
  isValidQuizDraft,
  QuizRequestGuard,
  type QuizDraft,
  type QuizQuestion,
} from "./quizDrafts";

type Answer = { id: string; selected: number };
type Assessment = NonNullable<Session["quiz"]>;

type Props = {
  ownerId: string;
  session: Session;
  draft?: QuizDraft;
  canUseAI: boolean;
  needsLogin: boolean;
  onGenerate: (count: number) => Promise<QuizQuestion[]>;
  onSaveDraft: (draft: QuizDraft) => void;
  onGrade: (answers: Answer[]) => Promise<Session>;
  onLogin: () => void;
  onStartReview: () => void;
};

export function QuizPanel({
  ownerId,
  session,
  draft: initialDraft,
  canUseAI,
  needsLogin,
  onGenerate,
  onSaveDraft,
  onGrade,
  onLogin,
  onStartReview,
}: Props) {
  const firstDraft = isValidQuizDraft(initialDraft) ? initialDraft : emptyQuizDraft();
  const [draft, setDraft] = useState<QuizDraft>(() => structuredClone(firstDraft));
  const [countInput, setCountInput] = useState(() => String(firstDraft.requestedCount ?? firstDraft.count));
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [gradedQuiz, setGradedQuiz] = useState<Assessment | null>(null);
  const requests = useRef(new QuizRequestGuard());
  const assessment = gradedQuiz ?? session.quiz;
  const questions = draft.questions;

  useEffect(() => () => requests.current.invalidate(), [ownerId, session.id]);

  function saveDraft(next: QuizDraft) {
    setDraft(next);
    onSaveDraft(next);
  }

  async function generate() {
    const count = Number(countInput);
    if (!isQuizCount(count) || assessment || generating || grading || !canUseAI) return;
    const request = requests.current.begin(ownerId, session.id);
    setGenerating(true);
    setError("");
    try {
      const result = await onGenerate(count);
      if (!requests.current.isCurrent(request, ownerId, session.id)) return;
      if (result.length !== count) {
        throw new Error("AI chưa tạo đủ số câu hỏi đã chọn. Bạn có thể thử lại.");
      }
      const next: QuizDraft = { count: result.length, requestedCount: count, questions: result, answers: {} };
      if (!isValidQuizDraft(next)) throw new Error("AI trả về câu hỏi chưa hợp lệ. Hãy thử lại.");
      saveDraft(next);
    } catch (cause) {
      if (requests.current.isCurrent(request, ownerId, session.id))
        setError(cause instanceof Error ? cause.message : "Chưa tạo được quiz. Hãy thử lại.");
    } finally {
      if (requests.current.isCurrent(request, ownerId, session.id)) setGenerating(false);
    }
  }

  function choose(questionId: string, selected: number) {
    const next: QuizDraft = { ...draft, answers: { ...draft.answers, [questionId]: selected } };
    saveDraft(next);
  }

  async function grade() {
    if (assessment || grading || generating || !questions.length ||
        questions.some((question) => !Number.isSafeInteger(draft.answers[question.id]))) return;
    const request = requests.current.begin(ownerId, session.id);
    setGrading(true);
    setError("");
    try {
      const result = await onGrade(questions.map((question) => ({
        id: question.id,
        selected: draft.answers[question.id],
      })));
      if (!requests.current.isCurrent(request, ownerId, session.id)) return;
      if (!result.quiz) throw new Error("Máy chủ chưa trả kết quả chấm. Câu trả lời vẫn được giữ lại.");
      setGradedQuiz(result.quiz);
    } catch (cause) {
      if (requests.current.isCurrent(request, ownerId, session.id))
        setError(cause instanceof Error ? cause.message : "Chưa chấm được quiz. Câu trả lời vẫn được giữ lại.");
    } finally {
      if (requests.current.isCurrent(request, ownerId, session.id)) setGrading(false);
    }
  }

  const wrongAnswers = assessment?.feedback?.filter((item) => !item.correct) ?? [];
  const gaps = assessment ? knowledgeGaps(assessment) : [];
  return (
    <section className="quiz-panel" aria-labelledby="quiz-panel-title">
      <div className="quiz-panel-heading">
        <div>
          <span className="eyebrow">ÔN TẬP THEO CHUYẾN</span>
          <h2 id="quiz-panel-title">Câu hỏi học tập</h2>
        </div>
      </div>
      {assessment ? (
        <div className="quiz-result" role="status">
          <h3>Điểm: {assessment.score}/{assessment.total}</h3>
          {assessment.feedback ? (
            <>
              {wrongAnswers.length ? (
                <div>
                  <h4>Kiến thức nên ôn lại</h4>
                  {gaps.length ? <ul>
                    {gaps.map((gap) => (
                      <li key={gap.knowledgePoint.toLocaleLowerCase()}>
                        <strong>{gap.knowledgePoint}</strong> — {gap.wrong}/{gap.total} câu sai
                        {gap.feedback.map((item) => item.explanation && (
                          <p key={item.questionId}>{item.explanation}</p>
                        ))}
                      </li>
                    ))}
                  </ul> : <p>Có câu trả lời sai nhưng máy chủ chưa gửi nhãn kiến thức để nhóm nội dung cần ôn.</p>}
                </div>
              ) : (
                <p>Không có câu trả lời sai trong lượt quiz này.</p>
              )}
              <details>
                <summary>Xem lại câu trả lời</summary>
                <ol className="quiz-feedback-list">
                  {assessment.feedback.map((item) => (
                    <li key={item.questionId}>
                      <strong>{item.question}</strong>
                      <p className={item.correct ? "quiz-answer-correct" : "quiz-answer-wrong"}>
                        Bạn chọn: {item.options[item.selected] ?? "Không rõ"}
                        {item.correct ? " · Đúng" : ` · Đáp án: ${item.options[item.correctIndex] ?? "Không rõ"}`}
                      </p>
                      {item.explanation && <p>{item.explanation}</p>}
                    </li>
                  ))}
                </ol>
              </details>
            </>
          ) : (
            <p>Kết quả được lưu trên máy chủ. Chi tiết câu hỏi của lượt cũ không có trong bản lưu.</p>
          )}
          <button className="primary" onClick={onStartReview}>Bắt đầu chuyến ôn tập →</button>
        </div>
      ) : (
        <>
          <p>Quiz do AI tạo dựa trên chủ đề, mục tiêu và ghi chú bạn đã nhập.</p>
          {canUseAI ? (
            <>
              <label className="quiz-count-label">
                Số câu hỏi
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={countInput}
                  disabled={generating || grading}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCountInput(value);
                    const count = Number(value);
                    if (isQuizCount(count)) saveDraft(draft.questions.length
                      ? { ...draft, requestedCount: count }
                      : { ...draft, count, requestedCount: count });
                  }}
                />
              </label>
              <button className="primary" disabled={generating || grading || !isQuizCount(Number(countInput))} onClick={() => void generate()}>
                {generating ? "Đang tạo câu hỏi…" : "Tạo câu hỏi bằng AI"}
              </button>
              {questions.length > 0 && <p className="quiz-replace-hint">Tạo lại trước khi chấm sẽ thay câu hỏi và câu trả lời hiện tại.</p>}
            </>
          ) : (
            <div className="choice-row">
              <p>{needsLogin ? "Đăng nhập lại để tạo quiz AI." : "Quiz AI cần tài khoản đã đăng nhập."}</p>
              <button onClick={onLogin}>Đăng nhập</button>
            </div>
          )}
          {questions.length > 0 && (
            <div className="quiz">
              {questions.map((question, index) => (
                <fieldset key={question.id} disabled={grading}>
                  <legend>{index + 1}. {question.question}</legend>
                  {question.options.map((option, optionIndex) => (
                    <label className="answer" key={`${question.id}:${optionIndex}`}>
                      <input
                        type="radio"
                        name={`quiz-${session.id}-${question.id}`}
                        checked={draft.answers[question.id] === optionIndex}
                        onChange={() => choose(question.id, optionIndex)}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              ))}
              <button className="primary" disabled={grading || generating || questions.some((question) => !Number.isSafeInteger(draft.answers[question.id]))} onClick={() => void grade()}>
                {grading ? "Đang chấm…" : "Nộp câu trả lời"}
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="quiz-error" role="alert">{error}</p>}
    </section>
  );
}
