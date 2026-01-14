import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteQuestionAnswer } from "@/services/question.management.service";
import {
  acceptQuestionAnswer,
  getQuestionDetail,
  listQuestionAnswers,
} from "@/services/qna.service";

const formatCreator = (question) => {
  const user = question?.createdUser;
  if (typeof user === "string") return user;
  return (
    user?.fullName ||
    user?.name ||
    user?.email ||
    user?.username ||
    (user?.id ? `#${user.id}` : "") ||
    (question?.userId ? `#${question.userId}` : "-")
  );
};

export default function QuestionDetailManagement({ scope = "admin" }) {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmLabel: "Xác nhận",
    variant: "default",
    onConfirm: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const basePath =
    scope === "admin" ? "/admin/questions" : "/instructor/questions";

  const loadDetail = async () => {
    if (!questionId) return;
    setLoading(true);
    setNotice(null);
    try {
      const [questionData, answerList] = await Promise.all([
        getQuestionDetail(questionId),
        listQuestionAnswers(questionId),
      ]);
      setQuestion(questionData || null);
      setAnswers(Array.isArray(answerList) ? answerList : []);
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải chi tiết câu hỏi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [questionId]);

  const openConfirm = ({ title, message, confirmLabel, variant, onConfirm }) => {
    setConfirmConfig({
      title,
      message,
      confirmLabel: confirmLabel || "Xác nhận",
      variant: variant || "default",
      onConfirm,
    });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmConfig({
      title: "",
      message: "",
      confirmLabel: "Xác nhận",
      variant: "default",
      onConfirm: null,
    });
  };

  const handleConfirm = async () => {
    if (!confirmConfig.onConfirm) return;
    setConfirmLoading(true);
    try {
      await confirmConfig.onConfirm();
      closeConfirm();
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể thực hiện thao tác.",
      });
      closeConfirm();
    } finally {
      setConfirmLoading(false);
    }
  };

  const runAnswerAction = async (answerId, action) => {
    setActionId(answerId);
    try {
      await action();
      await loadDetail();
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = (answer) => {
    if (!question?.id || !answer?.id) return;
    openConfirm({
      title: "Duyệt câu trả lời",
      message: "Bạn chắc chắn muốn duyệt câu trả lời này?",
      confirmLabel: "Duyệt",
      onConfirm: async () => {
        await runAnswerAction(answer.id, () =>
          acceptQuestionAnswer(question.id, answer.id)
        );
      },
    });
  };

  const handleReject = (answer) => {
    if (!answer?.id) return;
    openConfirm({
      title: "Từ chối câu trả lời",
      message: "Từ chối câu trả lời này?",
      confirmLabel: "Từ chối",
      variant: "danger",
      onConfirm: async () => {
        await runAnswerAction(answer.id, () => deleteQuestionAnswer(answer.id));
      },
    });
  };

  const handleDelete = (answer) => {
    if (!answer?.id) return;
    openConfirm({
      title: "Xóa câu trả lời",
      message: "Bạn chắc chắn muốn xóa câu trả lời này?",
      confirmLabel: "Xóa",
      variant: "danger",
      onConfirm: async () => {
        await runAnswerAction(answer.id, () => deleteQuestionAnswer(answer.id));
      },
    });
  };

  const courseLabel = useMemo(() => {
    if (question?.course?.title) return question.course.title;
    if (question?.courseId) return `#${question.courseId}`;
    return "-";
  }, [question]);

  const lessonLabel = useMemo(() => {
    if (question?.lesson?.title) return question.lesson.title;
    if (question?.lessonId) return `#${question.lessonId}`;
    return "Toàn khóa học";
  }, [question]);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Chi tiết câu hỏi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem thông tin câu hỏi và danh sách câu trả lời.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(basePath)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition"
        >
          Quay lại
        </button>
      </div>

      {notice ? (
        <div
          className={[
            "mt-4 rounded-lg border p-3 text-sm",
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {notice.message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Đang tải dữ liệu...
        </div>
      ) : question ? (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="text-xs uppercase text-slate-500">
                Thông tin cơ bản
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-slate-500">Khóa học: </span>
                  <span className="font-medium text-slate-900">
                    {courseLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Bài học: </span>
                  <span className="font-medium text-slate-900">
                    {lessonLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Tiêu đề: </span>
                  <span className="font-medium text-slate-900">
                    {question.title || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Trạng thái: </span>
                  <span className="font-medium text-slate-900">
                    {question.status || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Người tạo: </span>
                  <span className="font-medium text-slate-900">
                    {formatCreator(question)}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="text-xs uppercase text-slate-500">Nội dung</div>
              <p className="mt-3 whitespace-pre-line text-slate-800">
                {question.content || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Câu trả lời
              </h3>
              <span className="text-xs text-slate-500">
                {answers.length} câu trả lời
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Nội dung
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Người trả lời
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {answers.length ? (
                      answers.map((answer) => (
                        <tr key={answer.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{answer.id}</td>
                          <td className="px-4 py-3">
                            {answer.content || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {answer.userId ? `#${answer.createdUser}` : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {answer.isAccepted ? "Đã duyệt" : "Chờ duyệt"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(answer)}
                                disabled={actionId === answer.id}
                                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 disabled:opacity-60"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(answer)}
                                disabled={actionId === answer.id}
                                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 disabled:opacity-60"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(answer)}
                                disabled={actionId === answer.id}
                                className="text-red-600 hover:text-red-700 hover:underline underline-offset-4 disabled:opacity-60"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={5}>
                          Chưa có câu trả lời nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Không tìm thấy câu hỏi.
        </div>
      )}

      {confirmOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeConfirm} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {confirmConfig.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmConfig.message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmLoading}
                className={[
                  "h-10 rounded-lg px-4 text-sm font-semibold text-white transition inline-flex items-center justify-center disabled:opacity-60",
                  confirmConfig.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-900 hover:bg-slate-800",
                ].join(" ")}
              >
                {confirmLoading ? "Đang xử lý..." : confirmConfig.confirmLabel}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
