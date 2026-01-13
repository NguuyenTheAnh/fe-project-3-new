import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getCourseDetail } from "@/services/course.service";
import { getLessonDetail } from "@/services/lesson.service";
import { getFileAccessUrlPrivate } from "@/services/file.service";
import {
  createQuizAttempt,
  listQuizAttempts,
  submitQuizAttempt,
} from "@/services/quiz.attempt.service";
import { getQuizByLesson } from "@/services/quiz.student.service";
import {
  getLessonProgress,
  getCourseProgress,
  listCompletedLessons,
  updateLessonProgress,
} from "@/services/progress.service";
import {
  createCourseQuestion,
  createQuestionAnswer,
  listCourseQuestions,
  listQuestionAnswers,
} from "@/services/qna.service";

const LESSON_TYPE_LABELS = {
  VIDEO: "Video",
  ARTICLE: "Bài viết",
  QUIZ: "Quiz",
};

const QUESTION_TYPE_LABELS = {
  SINGLE: "Một đáp án",
  MULTI: "Nhiều đáp án",
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 60) return `${seconds} giây`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} phút`;
};

const normalizeSections = (course) => {
  const raw = course?.sections || course?.curriculum || course?.chapters || [];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((section) => ({
      ...section,
      lessons: Array.isArray(section?.lessons) ? section.lessons : [],
    }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
};

const findLessonInSections = (sections, lessonId) => {
  if (!lessonId) return null;
  for (const section of sections) {
    const lesson = (section.lessons || []).find(
      (item) => Number(item.id) === Number(lessonId)
    );
    if (lesson) {
      return { lesson, sectionId: section.id };
    }
  }
  return null;
};

export default function Learn() {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [sections, setSections] = useState([]);
  const [openSections, setOpenSections] = useState([]);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [lessonDetail, setLessonDetail] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  const [lessonQuiz, setLessonQuiz] = useState(null);
  const [quizDetailLoading, setQuizDetailLoading] = useState(false);
  const [quizDetailError, setQuizDetailError] = useState("");
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState("");

  const [courseProgress, setCourseProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progressPercent: 0,
  });
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [progressMap, setProgressMap] = useState({});
  const [progressError, setProgressError] = useState("");
  const lastProgressRef = useRef(0);
  const progressSavingRef = useRef(false);

  const [questionScope, setQuestionScope] = useState("lesson");
  const [questionPage, setQuestionPage] = useState(0);
  const [questionMeta, setQuestionMeta] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [questionForm, setQuestionForm] = useState({
    title: "",
    content: "",
  });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [answersOpen, setAnswersOpen] = useState({});
  const [answersMap, setAnswersMap] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [answerSubmittingId, setAnswerSubmittingId] = useState(null);

  const queryLessonId = useMemo(() => {
    const raw = searchParams.get("lessonId");
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const activeLessonMeta = useMemo(
    () => findLessonInSections(sections, activeLessonId),
    [sections, activeLessonId]
  );

  const activeLessonType =
    lessonDetail?.lessonType ||
    activeLessonMeta?.lesson?.lessonType ||
    activeLessonMeta?.lesson?.type ||
    "";

  const quizData = lessonQuiz || lessonDetail?.quiz || lessonDetail?.quizInfo || null;
  const quizId =
    quizData?.id ||
    lessonDetail?.quizId ||
    lessonDetail?.quiz?.quizId ||
    null;

  const quizQuestions = useMemo(() => {
    const list =
      quizData?.questions ||
      lessonDetail?.questions ||
      lessonDetail?.quizQuestions ||
      [];
    const normalized = Array.isArray(list) ? list : [];
    return [...normalized].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
  }, [quizData, lessonDetail]);

  const canDoQuiz = quizAttempt?.status === "IN_PROGRESS";
  const activeProgress = activeLessonId ? progressMap[activeLessonId] : null;
  const isLessonCompleted = Boolean(activeProgress?.completed);
  const totalLessonsCount = useMemo(() => {
    return sections.reduce(
      (total, section) => total + (section.lessons?.length || 0),
      0
    );
  }, [sections]);
  const progressPercent = useMemo(() => {
    if (typeof courseProgress.progressPercent === "number") {
      return courseProgress.progressPercent;
    }
    const total = courseProgress.totalLessons || totalLessonsCount || 0;
    const completed = courseProgress.completedLessons || completedLessonIds.size;
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  }, [courseProgress, totalLessonsCount, completedLessonIds]);
  const progressDegree = Math.min(360, Math.max(0, progressPercent * 3.6));
  const lessonTitleMap = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => {
      section.lessons?.forEach((lesson) => {
        if (lesson?.id) {
          map.set(lesson.id, lesson.title || "Bài học");
        }
      });
    });
    return map;
  }, [sections]);

  useEffect(() => {
    let active = true;
    const loadCourse = async () => {
      if (!courseId) return;
      setCourseLoading(true);
      setCourseError("");
      try {
        const data = await getCourseDetail(courseId);
        if (!active) return;
        setCourse(data);
        const normalizedSections = normalizeSections(data);
        setSections(normalizedSections);
        if (normalizedSections.length && !openSections.length) {
          setOpenSections([normalizedSections[0].id]);
        }
      } catch (err) {
        if (active) {
          setCourseError(err?.message || "Không thể tải thông tin khóa học.");
        }
      } finally {
        if (active) setCourseLoading(false);
      }
    };
    loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    let active = true;
    const loadCourseProgress = async () => {
      if (!courseId) return;
      try {
        const data = await getCourseProgress(courseId);
        if (!active || !data) return;
        setCourseProgress({
          totalLessons: data.totalLessons ?? 0,
          completedLessons: data.completedLessons ?? 0,
          progressPercent: data.progressPercent ?? 0,
        });
      } catch (err) {
        if (!active) return;
        if (err?.status !== 404) {
          setProgressError(err?.message || "Không thể tải tiến độ khóa học.");
        }
      }
    };
    loadCourseProgress();
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    let active = true;
    const loadCompletedLessons = async () => {
      if (!courseId) return;
      try {
        const data = await listCompletedLessons(courseId);
        if (!active) return;
        const ids = new Set(
          (Array.isArray(data) ? data : []).map((item) => item?.id).filter(Boolean)
        );
        setCompletedLessonIds(ids);
        setProgressMap((prev) => {
          const next = { ...prev };
          ids.forEach((id) => {
            next[id] = {
              completed: true,
              lastPositionSeconds: prev[id]?.lastPositionSeconds ?? 0,
            };
          });
          return next;
        });
      } catch (err) {
        if (!active) return;
        if (err?.status !== 404) {
          setProgressError(err?.message || "Không thể tải tiến độ bài học.");
        }
      }
    };
    loadCompletedLessons();
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!sections.length) return;
    const match = findLessonInSections(sections, queryLessonId);
    const firstLesson = sections[0]?.lessons?.[0] || null;
    const nextLessonId = match?.lesson?.id || firstLesson?.id || null;
    if (nextLessonId && Number(nextLessonId) !== Number(activeLessonId)) {
      setActiveLessonId(nextLessonId);
    }
    const targetSectionId = match?.sectionId || sections[0]?.id;
    if (targetSectionId && !openSections.includes(targetSectionId)) {
      setOpenSections((prev) => [...prev, targetSectionId]);
    }
  }, [sections, queryLessonId, activeLessonId, openSections]);

  useEffect(() => {
    let active = true;
    const loadLesson = async () => {
      if (!activeLessonId) return;
      setLessonLoading(true);
      setLessonError("");
      setLessonDetail(null);
      setVideoUrl("");
      setLessonQuiz(null);
      setQuizDetailError("");
      setQuizAttempt(null);
      setQuizAnswers({});
      setQuizError("");
      try {
        const data = await getLessonDetail(activeLessonId);
        if (active) {
          setLessonDetail(data);
        }
      } catch (err) {
        if (active) {
          setLessonError(err?.message || "Không thể tải bài học.");
        }
      } finally {
        if (active) setLessonLoading(false);
      }
    };
    loadLesson();
    return () => {
      active = false;
    };
  }, [activeLessonId]);

  useEffect(() => {
    let active = true;
    const loadProgress = async () => {
      if (!courseId || !activeLessonId) return;
      setProgressError("");
      try {
        const data = await getLessonProgress(courseId, activeLessonId);
        if (!active) return;
        if (data) {
          lastProgressRef.current = data.lastPositionSeconds ?? 0;
          setProgressMap((prev) => ({
            ...prev,
            [activeLessonId]: {
              completed: Boolean(data.completed),
              lastPositionSeconds: data.lastPositionSeconds ?? 0,
            },
          }));
        }
      } catch (err) {
        if (!active) return;
        if (err?.status !== 404) {
          setProgressError(
            err?.message || "Không thể tải tiến độ bài học."
          );
        }
      }
    };
    lastProgressRef.current = 0;
    loadProgress();
    return () => {
      active = false;
    };
  }, [courseId, activeLessonId]);

  useEffect(() => {
    let active = true;
    const loadQuizDetail = async () => {
      if (!activeLessonId || activeLessonType !== "QUIZ") return;
      setQuizDetailLoading(true);
      setQuizDetailError("");
      try {
        const data = await getQuizByLesson(activeLessonId);
        if (active) {
          setLessonQuiz(data);
        }
      } catch (err) {
        if (active) {
          setQuizDetailError(err?.message || "Không thể tải đề bài kiểm tra.");
        }
      } finally {
        if (active) setQuizDetailLoading(false);
      }
    };
    loadQuizDetail();
    return () => {
      active = false;
    };
  }, [activeLessonId, activeLessonType]);

  useEffect(() => {
    let active = true;
    const resolveVideoUrl = async () => {
      const file =
        lessonDetail?.videoFile ||
        lessonDetail?.videoFileId ||
        lessonDetail?.videoFile?.id;
      if (!file) {
        setVideoUrl("");
        return;
      }
      const directUrl = typeof file === "object" ? file?.accessUrl : null;
      if (directUrl) {
        setVideoUrl(directUrl);
        return;
      }
      const fileId = typeof file === "object" ? file.id : file;
      if (!fileId) {
        setVideoUrl("");
        return;
      }
      setVideoLoading(true);
      try {
        const url = await getFileAccessUrlPrivate(fileId);
        if (active) {
          setVideoUrl(url || "");
        }
      } catch {
        if (active) setVideoUrl("");
      } finally {
        if (active) setVideoLoading(false);
      }
    };
    resolveVideoUrl();
    return () => {
      active = false;
    };
  }, [lessonDetail]);

  useEffect(() => {
    let active = true;
    const loadAttempts = async () => {
      if (!quizId) return;
      setQuizLoading(true);
      setQuizError("");
      try {
        const attempts = await listQuizAttempts(quizId);
        if (!active) return;
        const list = Array.isArray(attempts) ? attempts : [];
        const inProgress = list.find((item) => item.status === "IN_PROGRESS");
        setQuizAttempt(inProgress || list[0] || null);
      } catch (err) {
        if (active) {
          setQuizError(err?.message || "Không thể tải trạng thái bài kiểm tra.");
        }
      } finally {
        if (active) setQuizLoading(false);
      }
    };
    setQuizAttempt(null);
    setQuizAnswers({});
    if (quizId) {
      loadAttempts();
    }
    return () => {
      active = false;
    };
  }, [quizId]);

  useEffect(() => {
    let active = true;
    const loadQuestions = async () => {
      if (!courseId) return;
      if (questionScope === "lesson" && !activeLessonId) return;
      setQuestionsLoading(true);
      setQuestionsError("");
      try {
        const data = await listCourseQuestions({
          courseId,
          lessonId: questionScope === "lesson" ? activeLessonId : undefined,
          page: questionPage,
          size: questionMeta.pageSize,
        });
        if (!active) return;
        setQuestions(data.items || []);
        setQuestionMeta({
          pageNumber: data.pageNumber ?? questionPage,
          pageSize: data.pageSize ?? questionMeta.pageSize,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
        });
      } catch (err) {
        if (!active) return;
        setQuestionsError(err?.message || "Không thể tải hỏi đáp.");
      } finally {
        if (active) setQuestionsLoading(false);
      }
    };
    loadQuestions();
    return () => {
      active = false;
    };
  }, [courseId, activeLessonId, questionScope, questionPage, questionMeta.pageSize]);

  const persistProgress = async (payload, lessonIdOverride) => {
    const targetLessonId = lessonIdOverride ?? activeLessonId;
    if (!courseId || !targetLessonId) return;
    if (progressSavingRef.current) return;
    progressSavingRef.current = true;
    setProgressError("");
    try {
      const data = await updateLessonProgress(courseId, targetLessonId, payload);
      if (data) {
        if (typeof data.completed === "boolean") {
          setCompletedLessonIds((prev) => {
            const next = new Set(prev);
            if (data.completed) {
              next.add(targetLessonId);
            } else {
              next.delete(targetLessonId);
            }
            return next;
          });
        }
        setProgressMap((prev) => ({
          ...prev,
          [targetLessonId]: {
            completed: Boolean(data.completed),
            lastPositionSeconds:
              data.lastPositionSeconds ?? payload.lastPositionSeconds ?? 0,
          },
        }));
        if (typeof payload.completed === "boolean") {
          try {
            const progress = await getCourseProgress(courseId);
            if (progress) {
              setCourseProgress({
                totalLessons: progress.totalLessons ?? 0,
                completedLessons: progress.completedLessons ?? 0,
                progressPercent: progress.progressPercent ?? 0,
              });
            }
          } catch (err) {
            if (err?.status !== 404) {
              setProgressError(
                err?.message || "Không thể tải tiến độ khóa học."
              );
            }
          }
        }
      }
    } catch (err) {
      setProgressError(err?.message || "Không thể cập nhật tiến độ.");
    } finally {
      progressSavingRef.current = false;
    }
  };

  const handleVideoTimeUpdate = (event) => {
    if (isLessonCompleted) return;
    const current = Math.floor(event.currentTarget.currentTime || 0);
    if (!current) return;
    if (current - lastProgressRef.current < 10) return;
    lastProgressRef.current = current;
    persistProgress({ lastPositionSeconds: current, completed: false });
  };

  const handleVideoEnded = (event) => {
    const current = Math.floor(event.currentTarget.currentTime || 0);
    lastProgressRef.current = current;
    persistProgress({ lastPositionSeconds: current, completed: true });
  };

  const handleToggleLessonCompleted = async (event, lessonId) => {
    event.stopPropagation();
    const checked = event.target.checked;
    const existing = progressMap[lessonId] || {};
    await persistProgress(
      {
        completed: checked,
        lastPositionSeconds: existing.lastPositionSeconds ?? 0,
      },
      lessonId
    );
  };

  const handleToggleSection = (sectionId) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleQuestionScopeChange = (event) => {
    setQuestionScope(event.target.value);
    setQuestionPage(0);
  };

  const handleSubmitQuestion = async (event) => {
    event.preventDefault();
    if (!courseId) return;
    if (!questionForm.title.trim() || !questionForm.content.trim()) {
      setQuestionsError("Vui lòng nhập tiêu đề và nội dung câu hỏi.");
      return;
    }
    setQuestionSubmitting(true);
    setQuestionsError("");
    try {
      await createCourseQuestion(courseId, {
        courseId: Number(courseId),
        lessonId: questionScope === "lesson" ? activeLessonId : null,
        title: questionForm.title.trim(),
        content: questionForm.content.trim(),
      });
      setQuestionForm({ title: "", content: "" });
      setQuestionPage(0);
      const data = await listCourseQuestions({
        courseId,
        lessonId: questionScope === "lesson" ? activeLessonId : undefined,
        page: 0,
        size: questionMeta.pageSize,
      });
      setQuestions(data.items || []);
      setQuestionMeta({
        pageNumber: data.pageNumber ?? 0,
        pageSize: data.pageSize ?? questionMeta.pageSize,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (err) {
      setQuestionsError(err?.message || "Không thể gửi câu hỏi.");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleToggleAnswers = async (questionId) => {
    if (!questionId) return;
    setAnswersOpen((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
    if (answersMap[questionId]) return;
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: { items: [], loading: true, error: "" },
    }));
    try {
      const items = await listQuestionAnswers(questionId);
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: { items: items || [], loading: false, error: "" },
      }));
    } catch (err) {
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: {
          items: [],
          loading: false,
          error: err?.message || "Không thể tải câu trả lời.",
        },
      }));
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    if (!questionId) return;
    const content = (answerDrafts[questionId] || "").trim();
    if (!content) return;
    setAnswerSubmittingId(questionId);
    try {
      await createQuestionAnswer(questionId, { content });
      const items = await listQuestionAnswers(questionId);
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: { items: items || [], loading: false, error: "" },
      }));
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
    } catch (err) {
      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: {
          items: prev[questionId]?.items || [],
          loading: false,
          error: err?.message || "Không thể gửi trả lời.",
        },
      }));
    } finally {
      setAnswerSubmittingId(null);
    }
  };

  const handleSelectLesson = (lessonId, sectionId) => {
    setActiveLessonId(lessonId);
    if (sectionId && !openSections.includes(sectionId)) {
      setOpenSections((prev) => [...prev, sectionId]);
    }
    const nextParams = new URLSearchParams(searchParams);
    if (lessonId) {
      nextParams.set("lessonId", String(lessonId));
    } else {
      nextParams.delete("lessonId");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleStartQuiz = async () => {
    if (!quizId) return;
    setQuizLoading(true);
    setQuizError("");
    try {
      const attempt = await createQuizAttempt(quizId);
      setQuizAttempt(attempt);
    } catch (err) {
      setQuizError(err?.message || "Không thể bắt đầu bài kiểm tra.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswerChange = (question, answerId, checked) => {
    setQuizAnswers((prev) => {
      const current = prev[question.id];
      if (question.questionType === "MULTI") {
        const list = Array.isArray(current) ? current : [];
        if (checked) {
          return {
            ...prev,
            [question.id]: [...new Set([...list, answerId])],
          };
        }
        return {
          ...prev,
          [question.id]: list.filter((id) => id !== answerId),
        };
      }
      return {
        ...prev,
        [question.id]: answerId,
      };
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizId || !quizAttempt?.id) return;
    const answersPayload = quizQuestions.flatMap((question) => {
      const selection = quizAnswers[question.id];
      if (!selection) return [];
      if (question.questionType === "MULTI") {
        const list = Array.isArray(selection) ? selection : [];
        return list.map((answerId) => ({
          questionId: question.id,
          answerId,
        }));
      }
      return [
        {
          questionId: question.id,
          answerId: selection,
        },
      ];
    });
    if (!answersPayload.length) {
      setQuizError("Vui lòng chọn ít nhất một đáp án.");
      return;
    }
    setQuizSubmitting(true);
    setQuizError("");
    try {
      const submitted = await submitQuizAttempt(
        quizId,
        quizAttempt.id,
        answersPayload
      );
      setQuizAttempt(submitted);
      await persistProgress({ completed: true });
    } catch (err) {
      setQuizError(err?.message || "Không thể nộp bài.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const renderLessonContent = () => {
    if (lessonLoading) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải nội dung bài học...
        </div>
      );
    }

    if (lessonError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {lessonError}
        </div>
      );
    }

    if (!lessonDetail) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Vui lòng chọn một bài học để bắt đầu.
        </div>
      );
    }

    if (activeLessonType === "QUIZ") {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Bài kiểm tra
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {quizData?.title || "Hãy hoàn thành bài kiểm tra để tiếp tục."}
              </p>
            </div>
            <div className="text-sm text-slate-500">
              {quizAttempt?.status
                ? `Trạng thái: ${quizAttempt.status}`
                : "Chưa bắt đầu"}
            </div>
          </div>

          {quizError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {quizError}
            </div>
          ) : null}

          {progressError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {progressError}
            </div>
          ) : null}

          {quizDetailError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {quizDetailError}
            </div>
          ) : null}

          {quizDetailLoading ? (
            <div className="mt-4 text-sm text-slate-500">
              Đang tải đề bài kiểm tra...
            </div>
          ) : null}

          {!quizId ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Bài kiểm tra đang được cập nhật.
            </div>
          ) : quizLoading ? (
            <div className="mt-4 text-sm text-slate-500">
              Đang tải trạng thái bài kiểm tra...
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {!quizAttempt || quizAttempt.status !== "IN_PROGRESS" ? (
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition"
                >
                  Bắt đầu làm bài
                </button>
              ) : null}

              {canDoQuiz ? (
                quizQuestions.length ? (
                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => {
                      const answers = question.answers || question.options || [];
                      const selected = quizAnswers[question.id];
                      const isMulti = question.questionType === "MULTI";
                      return (
                        <div
                          key={question.id || index}
                          className="rounded-lg border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {index + 1}. {question.questionText || "Câu hỏi"}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {QUESTION_TYPE_LABELS[question.questionType] ||
                                "Một đáp án"}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {answers.map((answer) => {
                              const checked = isMulti
                                ? Array.isArray(selected) &&
                                  selected.includes(answer.id)
                                : selected === answer.id;
                              return (
                                <label
                                  key={answer.id}
                                  className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <input
                                    type={isMulti ? "checkbox" : "radio"}
                                    name={`question-${question.id}`}
                                    checked={checked}
                                    onChange={(event) =>
                                      handleAnswerChange(
                                        question,
                                        answer.id,
                                        event.target.checked
                                      )
                                    }
                                    className="mt-1"
                                  />
                                  <span>{answer.answerText || "Đáp án"}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={quizSubmitting || !quizAttempt?.id}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition disabled:opacity-60"
                    >
                      {quizSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Bài kiểm tra đang được cập nhật câu hỏi.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Hãy nhấn "Bắt đầu làm bài" để bắt đầu trả lời.
                </div>
              )}

              {quizAttempt?.status === "SUBMITTED" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Điểm số: {quizAttempt.score ?? 0}
                </div>
              ) : null}
            </div>
          )}
        </div>
      );
    }

    if (activeLessonType === "ARTICLE") {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {lessonDetail.title || "Bài viết"}
          </h2>
          <div
            className="mt-4 text-sm text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                lessonDetail.contentText ||
                "<p>Nội dung bài viết đang được cập nhật.</p>",
            }}
          />
          {progressError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {progressError}
            </div>
          ) : null}
          <div className="mt-6 flex items-center gap-3">
            {isLessonCompleted ? (
              <span className="text-sm font-medium text-emerald-600">
                Đã hoàn thành
              </span>
            ) : (
              <button
                type="button"
                onClick={() => persistProgress({ completed: true })}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                Đánh dấu đã hoàn thành
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {lessonDetail.title || "Bài học video"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {lessonDetail.durationSeconds
            ? `Thời lượng: ${formatDuration(lessonDetail.durationSeconds)}`
            : "Chưa có thời lượng"}
        </p>
        <div className="mt-4 overflow-hidden rounded-xl bg-slate-100">
          {videoLoading ? (
            <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">
              Đang tải video...
            </div>
          ) : videoUrl ? (
            <video
              className="h-[360px] w-full bg-black object-contain"
              controls
              src={videoUrl}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">
              Video chưa sẵn sàng.
            </div>
          )}
        </div>
        {progressError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {progressError}
          </div>
        ) : null}
        <div className="mt-4 text-sm text-slate-600">
          {isLessonCompleted ? "Đã hoàn thành bài học." : "Đang học bài này."}
        </div>
      </div>
    );
  };

  if (courseLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Đang tải khóa học...
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {courseError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {course?.title || "Khóa học"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {activeLessonMeta?.lesson?.title
              ? `Đang học: ${activeLessonMeta.lesson.title}`
              : "Chọn một bài học để bắt đầu."}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {course?.instructors?.length
            ? `Giảng viên: ${course.instructors
                .map((item) => item.fullName || item.name || item.email)
                .filter(Boolean)
                .join(", ")}`
            : ""}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Nội dung khóa học
            </h2>
            <div className="relative h-12 w-12">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#E11D48 ${progressDegree}deg, #E2E8F0 0deg)`,
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700">
                {progressPercent}%
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {sections.length ? (
              sections.map((section, sectionIndex) => {
                const isOpen = openSections.includes(section.id);
                return (
                  <div
                    key={section.id || sectionIndex}
                    className="rounded-lg border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSection(section.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      <span className="line-clamp-2">
                        {section.title || `Chương ${sectionIndex + 1}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {isOpen ? "Ẩn" : "Xem"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-slate-200 px-2 py-2">
                        {section.lessons?.length ? (
                          <div className="space-y-1">
                            {section.lessons.map((lesson) => {
                              const isActive =
                                Number(activeLessonId) === Number(lesson.id);
                              const lessonType =
                                lesson.lessonType || lesson.type;
                              const lessonProgress = progressMap[lesson.id];
                              const isCompleted =
                                Boolean(lessonProgress?.completed) ||
                                completedLessonIds.has(lesson.id);
                              return (
                                <button
                                  key={lesson.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectLesson(lesson.id, section.id)
                                  }
                                  className={[
                                    "w-full rounded-lg px-3 py-2 text-left transition",
                                    isActive
                                      ? "bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]"
                                      : "hover:bg-slate-50 text-slate-700",
                                  ].join(" ")}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-sm font-medium line-clamp-2">
                                      {lesson.title || "Bài học"}
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={(event) =>
                                        handleToggleLessonCompleted(
                                          event,
                                          lesson.id
                                        )
                                      }
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                                      aria-label="Đánh dấu hoàn thành"
                                    />
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                    <span>
                                      {LESSON_TYPE_LABELS[lessonType] ||
                                        "Bài học"}
                                    </span>
                                    {lesson.durationSeconds ? (
                                      <span>
                                        • {formatDuration(lesson.durationSeconds)}
                                      </span>
                                    ) : null}
                                    {isCompleted ? (
                                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                        Hoàn thành
                                      </span>
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-500">
                            Chưa có bài học.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Chưa có nội dung khóa học.
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          {renderLessonContent()}

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Hỏi đáp</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Trao đổi với giảng viên và học viên khác.
                </p>
              </div>
              <select
                value={questionScope}
                onChange={handleQuestionScopeChange}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#F43F5E]"
              >
                <option value="lesson">Theo bài học hiện tại</option>
                <option value="course">Theo toàn khóa học</option>
              </select>
            </div>

            <form onSubmit={handleSubmitQuestion} className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề câu hỏi
                </label>
                <input
                  type="text"
                  value={questionForm.title}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#F43F5E]"
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nội dung câu hỏi
                </label>
                <textarea
                  rows="3"
                  value={questionForm.content}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      content: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#F43F5E]"
                  placeholder="Mô tả chi tiết câu hỏi..."
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                {questionsError ? (
                  <p className="text-sm text-red-600">{questionsError}</p>
                ) : (
                  <span className="text-xs text-slate-500">
                    {questionScope === "lesson"
                      ? activeLessonMeta?.lesson?.title
                        ? `Bài học: ${activeLessonMeta.lesson.title}`
                        : "Đang xem theo bài học hiện tại"
                      : "Đang xem theo toàn khóa học"}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={questionSubmitting}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition disabled:opacity-60"
                >
                  {questionSubmitting ? "Đang gửi..." : "Gửi câu hỏi"}
                </button>
              </div>
            </form>

            {questionsLoading ? (
              <div className="mt-6 text-sm text-slate-500">Đang tải câu hỏi...</div>
            ) : questions.length ? (
              <div className="mt-6 space-y-4">
                {questions.map((question) => {
                  const answers = answersMap[question.id] || {
                    items: [],
                    loading: false,
                    error: "",
                  };
                  const isOpen = Boolean(answersOpen[question.id]);
                  const lessonTitle = question.lessonId
                    ? lessonTitleMap.get(question.lessonId)
                    : null;
                  return (
                    <div
                      key={question.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {question.title || "Câu hỏi"}
                          </h3>
                          <p className="mt-2 text-sm text-slate-700">
                            {question.content}
                          </p>
                          <div className="mt-2 text-xs text-slate-500">
                            {lessonTitle
                              ? `Bài học: ${lessonTitle}`
                              : "Theo toàn khóa học"}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {question.status || "OPEN"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAnswers(question.id)}
                          className="text-sm text-[#2563EB] hover:underline underline-offset-4"
                        >
                          {isOpen ? "Ẩn trả lời" : "Xem trả lời"}
                        </button>
                      </div>

                      {isOpen ? (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          {answers.loading ? (
                            <p className="text-sm text-slate-500">
                              Đang tải câu trả lời...
                            </p>
                          ) : answers.error ? (
                            <p className="text-sm text-red-600">
                              {answers.error}
                            </p>
                          ) : answers.items.length ? (
                            <div className="space-y-3">
                              {answers.items.map((answer) => (
                                <div
                                  key={answer.id}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                >
                                  <p>{answer.content}</p>
                                  {answer.isAccepted ? (
                                    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                      Đã được chấp nhận
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              Chưa có câu trả lời.
                            </p>
                          )}

                          <div className="mt-4">
                            <textarea
                              rows="2"
                              value={answerDrafts[question.id] || ""}
                              onChange={(event) =>
                                setAnswerDrafts((prev) => ({
                                  ...prev,
                                  [question.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#F43F5E]"
                              placeholder="Nhập câu trả lời..."
                            />
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleSubmitAnswer(question.id)}
                                disabled={answerSubmittingId === question.id}
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#E11D48] px-3 text-sm font-semibold text-white hover:bg-[#BE123C] transition disabled:opacity-60"
                              >
                                {answerSubmittingId === question.id
                                  ? "Đang gửi..."
                                  : "Gửi trả lời"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Chưa có câu hỏi nào.
              </div>
            )}

            {questionMeta.totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setQuestionPage((prev) => Math.max(0, prev - 1))
                  }
                  disabled={questionMeta.pageNumber <= 0}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm text-slate-500">
                  Trang {questionMeta.pageNumber + 1} / {questionMeta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuestionPage((prev) =>
                      Math.min(questionMeta.totalPages - 1, prev + 1)
                    )
                  }
                  disabled={questionMeta.pageNumber + 1 >= questionMeta.totalPages}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
