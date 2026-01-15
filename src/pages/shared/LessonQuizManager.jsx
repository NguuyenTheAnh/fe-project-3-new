import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAnswer,
  createLessonQuiz,
  createQuestion,
  deleteAnswer,
  deleteQuestion,
  deleteQuiz,
  getLessonQuiz,
  updateAnswer,
  updateQuestion,
  updateQuiz,
} from "@/services/quiz.service";

const QUIZ_FORM_DEFAULT = {
  title: "",
  timeLimitSeconds: 900,
  passScore: 70,
  maxAttempts: 1,
  shuffleQuestions: false,
};

const QUESTION_FORM_DEFAULT = {
  questionText: "",
  questionType: "SINGLE",
  position: 1,
  points: 1,
  explanation: "",
};

const ANSWER_FORM_DEFAULT = {
  answerText: "",
  isCorrect: false,
  position: 1,
};

const QUESTION_TYPES = [
  { value: "SINGLE", label: "Một đáp án" },
  { value: "MULTI", label: "Nhiều đáp án" },
];

export default function LessonQuizManager({ open, onClose, lesson }) {
  const lessonId = lesson?.id;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [quizForm, setQuizForm] = useState(QUIZ_FORM_DEFAULT);
  const [questionForm, setQuestionForm] = useState(QUESTION_FORM_DEFAULT);
  const [questionMode, setQuestionMode] = useState("create");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const [answerForm, setAnswerForm] = useState(ANSWER_FORM_DEFAULT);
  const [answerMode, setAnswerMode] = useState("create");
  const [answerOpen, setAnswerOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState(null);
  const [answerQuestion, setAnswerQuestion] = useState(null);

  const questions = useMemo(() => {
    const list = Array.isArray(quiz?.questions) ? quiz.questions : [];
    return [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [quiz]);

  const isSingleAnswerQuestion =
    (answerQuestion?.questionType || "").toUpperCase() === "SINGLE";
  const hasCorrectAnswer = useMemo(() => {
    const answers = Array.isArray(answerQuestion?.answers)
      ? answerQuestion.answers
      : [];
    return answers.some(
      (answer) => answer?.isCorrect && answer?.id !== activeAnswer?.id
    );
  }, [answerQuestion, activeAnswer]);
  const lockCorrectToggle =
    isSingleAnswerQuestion && hasCorrectAnswer && !activeAnswer?.isCorrect;

  const resetQuestionForm = () => {
    setQuestionForm(QUESTION_FORM_DEFAULT);
    setQuestionMode("create");
    setActiveQuestion(null);
    setQuestionOpen(false);
  };

  const resetAnswerForm = () => {
    setAnswerForm(ANSWER_FORM_DEFAULT);
    setAnswerMode("create");
    setActiveAnswer(null);
    setAnswerQuestion(null);
    setAnswerOpen(false);
  };

  const loadQuiz = async () => {
    if (!lessonId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getLessonQuiz(lessonId);
      setQuiz(data);
      setQuizForm({
        title: data?.title || "",
        timeLimitSeconds: data?.timeLimitSeconds ?? 900,
        passScore: data?.passScore ?? 70,
        maxAttempts: data?.maxAttempts ?? 1,
        shuffleQuestions: Boolean(data?.shuffleQuestions),
      });
    } catch (err) {
      if (err?.status === 404 || err?.message?.includes("not_found") || err?.message?.includes("not found")) {
        // Chưa có quiz nào - đây là trường hợp bình thường, không phải lỗi
        setQuiz(null);
        setError(""); // Xóa error để không hiển thị thông báo lỗi
        setQuizForm({
          ...QUIZ_FORM_DEFAULT,
          title: lesson?.title ? `Quiz - ${lesson.title}` : "",
        });
      } else {
        setError(err?.message || "Không thể tải quiz.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setNotice(null);
      resetQuestionForm();
      resetAnswerForm();
      loadQuiz();
    }
  }, [open, lessonId]);

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    if (!lessonId) return;
    if (!quizForm.title.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập tiêu đề quiz." });
      return;
    }
    setSavingQuiz(true);
    setNotice(null);
    const payload = {
      lessonId,
      title: quizForm.title.trim(),
      timeLimitSeconds: Number(quizForm.timeLimitSeconds) || 0,
      passScore: Number(quizForm.passScore) || 0,
      maxAttempts: Number(quizForm.maxAttempts) || 1,
      shuffleQuestions: Boolean(quizForm.shuffleQuestions),
    };
    try {
      if (quiz?.id) {
        await updateQuiz(quiz.id, payload);
        setNotice({ type: "success", message: "Đã cập nhật quiz." });
      } else {
        await createLessonQuiz(lessonId, payload);
        setNotice({ type: "success", message: "Đã tạo quiz." });
      }
      await loadQuiz();
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể lưu quiz." });
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa quiz này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteQuiz(quiz.id);
      setQuiz(null);
      setQuizForm(QUIZ_FORM_DEFAULT);
      setNotice({ type: "success", message: "Đã xóa quiz." });
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể xóa quiz." });
    }
  };

  const openCreateQuestion = () => {
    setQuestionMode("create");
    setActiveQuestion(null);
    setQuestionForm({
      ...QUESTION_FORM_DEFAULT,
      position: (questions.length || 0) + 1,
    });
    setQuestionOpen(true);
  };

  const openEditQuestion = (question) => {
    setQuestionMode("edit");
    setActiveQuestion(question);
    setQuestionForm({
      questionText: question?.questionText || "",
      questionType: question?.questionType || "SINGLE",
      position: question?.position ?? 1,
      points: question?.points ?? 1,
      explanation: question?.explanation || "",
    });
    setQuestionOpen(true);
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!quiz?.id) return;
    if (!questionForm.questionText.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập nội dung câu hỏi." });
      return;
    }
    const payload = {
      questionText: questionForm.questionText.trim(),
      questionType: questionForm.questionType,
      position: Number(questionForm.position) || 1,
      points: Number(questionForm.points) || 1,
      explanation: questionForm.explanation?.trim() || null,
    };
    try {
      if (questionMode === "edit" && activeQuestion?.id) {
        await updateQuestion(activeQuestion.id, payload);
        setNotice({ type: "success", message: "Đã cập nhật câu hỏi." });
      } else {
        await createQuestion(quiz.id, payload);
        setNotice({ type: "success", message: "Đã tạo câu hỏi." });
      }
      resetQuestionForm();
      await loadQuiz();
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể lưu câu hỏi." });
    }
  };

  const handleDeleteQuestion = async (question) => {
    if (!question?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa câu hỏi này?");
    if (!ok) return;
    try {
      await deleteQuestion(question.id);
      setNotice({ type: "success", message: "Đã xóa câu hỏi." });
      await loadQuiz();
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể xóa câu hỏi." });
    }
  };

  const openCreateAnswer = (question) => {
    setAnswerMode("create");
    setActiveAnswer(null);
    setAnswerQuestion(question);
    const count = Array.isArray(question?.answers) ? question.answers.length : 0;
    setAnswerForm({
      ...ANSWER_FORM_DEFAULT,
      position: count + 1,
    });
    setAnswerOpen(true);
  };

  const openEditAnswer = (question, answer) => {
    setAnswerMode("edit");
    setActiveAnswer(answer);
    setAnswerQuestion(question);
    setAnswerForm({
      answerText: answer?.answerText || "",
      isCorrect: Boolean(answer?.isCorrect),
      position: answer?.position ?? 1,
    });
    setAnswerOpen(true);
  };

  const handleAnswerSubmit = async (event) => {
    event.preventDefault();
    if (!answerQuestion?.id) return;
    if (!answerForm.answerText.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập nội dung đáp án." });
      return;
    }
    const payload = {
      answerText: answerForm.answerText.trim(),
      isCorrect: Boolean(answerForm.isCorrect),
      position: Number(answerForm.position) || 1,
    };
    try {
      if (answerMode === "edit" && activeAnswer?.id) {
        await updateAnswer(activeAnswer.id, payload);
        setNotice({ type: "success", message: "Đã cập nhật đáp án." });
      } else {
        await createAnswer(answerQuestion.id, payload);
        setNotice({ type: "success", message: "Đã tạo đáp án." });
      }
      resetAnswerForm();
      await loadQuiz();
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể lưu đáp án." });
    }
  };

  const handleDeleteAnswer = async (answer) => {
    if (!answer?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa đáp án này?");
    if (!ok) return;
    try {
      await deleteAnswer(answer.id);
      setNotice({ type: "success", message: "Đã xóa đáp án." });
      await loadQuiz();
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể xóa đáp án." });
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Quản lý quiz
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Bài học: {lesson?.title || `#${lessonId || "-"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
          >
            Đóng
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Thông tin quiz
            </h3>
            {quiz?.id ? (
              <button
                type="button"
                onClick={handleDeleteQuiz}
                className="text-sm text-red-600 hover:text-red-700 hover:underline underline-offset-4"
              >
                Xóa quiz
              </button>
            ) : null}
          </div>
          {loading ? (
            <div className="mt-4 text-sm text-slate-500">
              Đang tải quiz...
            </div>
          ) : !quiz?.id && !error ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
               Chưa có quiz nào cho bài học này. Hãy tạo quiz mới bên dưới.
            </div>
          ) : null}
          {!loading && (
            <form className="mt-4 space-y-4" onSubmit={handleQuizSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề quiz
                </label>
                <Input
                  value={quizForm.title}
                  onChange={(event) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Thời gian (giây)
                  </label>
                  <Input
                    type="number"
                    value={quizForm.timeLimitSeconds}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        timeLimitSeconds: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Điểm đạt (%)
                  </label>
                  <Input
                    type="number"
                    value={quizForm.passScore}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        passScore: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Số lần làm tối đa
                  </label>
                  <Input
                    type="number"
                    value={quizForm.maxAttempts}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        maxAttempts: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20"
                    checked={quizForm.shuffleQuestions}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        shuffleQuestions: event.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-700">
                    Trộn câu hỏi
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingQuiz}>
                  {savingQuiz
                    ? "Đang lưu..."
                    : quiz?.id
                      ? "Cập nhật quiz"
                      : "Tạo quiz"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Câu hỏi</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={openCreateQuestion}
              disabled={!quiz?.id}
            >
              + Thêm câu hỏi
            </Button>
          </div>

          {!quiz?.id ? (
            <div className="mt-3 text-sm text-slate-500">
              Hãy tạo quiz trước khi thêm câu hỏi.
            </div>
          ) : questions.length ? (
            <div className="mt-4 space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {question.questionText}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {question.questionType} • {question.points} điểm • Vị
                        trí {question.position ?? "-"}
                      </div>
                      {question.explanation ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Giải thích: {question.explanation}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => openEditQuestion(question)}
                        className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question)}
                        className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Đáp án ({question.answers?.length || 0})
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreateAnswer(question)}
                        className="text-xs text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                      >
                        + Thêm đáp án
                      </button>
                    </div>
                    {question.answers?.length ? (
                      <div className="mt-2 space-y-2">
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900">
                                {answer.answerText}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                Vị trí {answer.position ?? "-"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {answer.isCorrect ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Đúng
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                  Sai
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditAnswer(question, answer)}
                                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnswer(answer)}
                                className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">
                        Chưa có đáp án.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-500">
              Chưa có câu hỏi nào.
            </div>
          )}
        </div>

        {questionOpen ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                {questionMode === "edit" ? "Sửa câu hỏi" : "Thêm câu hỏi"}
              </h4>
              <button
                type="button"
                onClick={resetQuestionForm}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Đóng
              </button>
            </div>
            <form className="mt-3 space-y-4" onSubmit={handleQuestionSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nội dung câu hỏi
                </label>
                <textarea
                  value={questionForm.questionText}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      questionText: event.target.value,
                    }))
                  }
                  rows="3"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Loại câu hỏi
                  </label>
                  <select
                    value={questionForm.questionType}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        questionType: event.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    {QUESTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Vị trí
                  </label>
                  <Input
                    type="number"
                    value={questionForm.position}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Điểm
                  </label>
                  <Input
                    type="number"
                    value={questionForm.points}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        points: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Giải thích (nếu có)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      explanation: event.target.value,
                    }))
                  }
                  rows="2"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit">
                  {questionMode === "edit" ? "Cập nhật" : "Tạo câu hỏi"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {answerOpen ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {answerMode === "edit" ? "Sửa đáp án" : "Thêm đáp án"}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Câu hỏi: {answerQuestion?.questionText || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAnswerForm}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Đóng
              </button>
            </div>
            <form className="mt-3 space-y-4" onSubmit={handleAnswerSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nội dung đáp án
                </label>
                <Input
                  value={answerForm.answerText}
                  onChange={(event) =>
                    setAnswerForm((prev) => ({
                      ...prev,
                      answerText: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Vị trí
                  </label>
                  <Input
                    type="number"
                    value={answerForm.position}
                    onChange={(event) =>
                      setAnswerForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    checked={answerForm.isCorrect}
                    disabled={lockCorrectToggle}
                    onChange={(event) =>
                      setAnswerForm((prev) => ({
                        ...prev,
                        isCorrect: event.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-700">
                    Đáp án đúng
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit">
                  {answerMode === "edit" ? "Cập nhật" : "Tạo đáp án"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
