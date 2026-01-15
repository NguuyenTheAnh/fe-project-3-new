import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteManagementQuestion,
  deleteQuestionAnswer,
  listManagementQuestions,
  updateManagementQuestion,
} from "@/services/question.management.service";
import { acceptQuestionAnswer, listQuestionAnswers } from "@/services/qna.service";
import PaginationBar from "@/components/catalog/PaginationBar";

const EMPTY_FORM = {
  title: "",
  content: "",
};

const normalizeList = (data) => {
  const content = Array.isArray(data?.content) ? data.content : [];
  return {
    items: content,
    pageNumber: data?.pageNumber ?? data?.number ?? 0,
    pageSize: data?.pageSize ?? data?.size ?? content.length,
    totalElements: data?.totalElements ?? content.length,
    totalPages: data?.totalPages ?? 1,
  };
};

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

export default function QuestionManagement({ scope = "admin" }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState(null);
  const [detailAnswers, setDetailAnswers] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmLabel: "Xác nhận",
    variant: "default",
    onConfirm: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const pageTitle = useMemo(() => "Hỏi đáp", []);

  const loadQuestions = async (page = pageInfo.pageNumber) => {
    setLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listManagementQuestions({
        page,
        size: pageInfo.pageSize,
      });
      const normalized = normalizeList(data || {});
      setQuestions(normalized.items);
      setPageInfo((prev) => ({
        ...prev,
        pageNumber: normalized.pageNumber,
        pageSize: normalized.pageSize,
        totalElements: normalized.totalElements,
        totalPages: normalized.totalPages,
      }));
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải câu hỏi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(0);
  }, []);

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

  const openEdit = (question) => {
    setActiveQuestion(question);
    setEditForm({
      title: question?.title || "",
      content: question?.content || "",
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setActiveQuestion(null);
    setEditForm(EMPTY_FORM);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!activeQuestion?.id) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setNotice({
        type: "error",
        message: "Vui lòng nhập đầy đủ tiêu đề và nội dung.",
      });
      return;
    }
    setEditSaving(true);
    setNotice(null);
    try {
      await updateManagementQuestion(
        activeQuestion.id,
        {
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          lessonId: activeQuestion.lesson?.id ?? null,
        },
        scope
      );
      setNotice({ type: "success", message: "Cập nhật thành công." });
      closeEdit();
      await loadQuestions(pageInfo.pageNumber);
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể cập nhật câu hỏi.",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteQuestion = (question) => {
    if (!question?.id) return;
    openConfirm({
      title: "Xóa câu hỏi",
      message: "Bạn chắc chắn muốn xóa câu hỏi này?",
      confirmLabel: "Xóa",
      variant: "danger",
      onConfirm: async () => {
        await deleteManagementQuestion(question.id, scope);
        setNotice({ type: "success", message: "Đã xóa câu hỏi." });
        await loadQuestions(pageInfo.pageNumber);
      },
    });
  };

  const openDetail = async (question) => {
    if (!question) return;
    setDetailQuestion(question);
    setDetailAnswers(Array.isArray(question.answers) ? question.answers : []);
    setDetailError("");
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const answers = await listQuestionAnswers(question.id);
      setDetailAnswers(Array.isArray(answers) ? answers : []);
    } catch (error) {
      setDetailError(error?.message || "Không thể tải câu trả lời.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailQuestion(null);
    setDetailAnswers([]);
    setDetailError("");
  };

  const refreshDetailAnswers = async (questionId) => {
    if (!questionId) return;
    const answers = await listQuestionAnswers(questionId);
    setDetailAnswers(Array.isArray(answers) ? answers : []);
  };

  const handleApproveAnswer = (answer) => {
    if (!detailQuestion?.id || !answer?.id) return;
    openConfirm({
      title: "Duyệt câu trả lời",
      message: "Bạn chắc chắn muốn duyệt câu trả lời này?",
      confirmLabel: "Duyệt",
      onConfirm: async () => {
        await acceptQuestionAnswer(detailQuestion.id, answer.id);
        await refreshDetailAnswers(detailQuestion.id);
      },
    });
  };

  const handleRejectAnswer = (answer) => {
    if (!answer?.id) return;
    openConfirm({
      title: "Từ chối câu trả lời",
      message: "Từ chối câu trả lời này?",
      confirmLabel: "Từ chối",
      variant: "danger",
      onConfirm: async () => {
        await deleteQuestionAnswer(answer.id);
        await refreshDetailAnswers(detailQuestion?.id);
      },
    });
  };

  const handleDeleteAnswer = (answer) => {
    if (!answer?.id) return;
    openConfirm({
      title: "Xóa câu trả lời",
      message: "Bạn chắc chắn muốn xóa câu trả lời này?",
      confirmLabel: "Xóa",
      variant: "danger",
      onConfirm: async () => {
        await deleteQuestionAnswer(answer.id);
        await refreshDetailAnswers(detailQuestion?.id);
      },
    });
  };

  if (permissionError) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Bạn không có quyền truy cập.</p>
          <button
            type="button"
            onClick={() =>
              navigate(scope === "admin" ? "/admin" : "/instructor")
            }
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Về trang quản trị
          </button>
        </div>
      </div>
    );
  }

  const detailCourseTitle =
    detailQuestion?.course?.title || detailQuestion?.courseTitle || "-";
  const detailLessonTitle = detailQuestion?.lesson?.title || "Toàn khóa học";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý câu hỏi của học viên trong khóa học.
          </p>
        </div>
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

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold border-r border-slate-200">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Khóa học
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Bài học
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Người tạo
                </th>
                <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold border-l border-slate-200">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    Đang tải câu hỏi...
                  </td>
                </tr>
              ) : questions.length ? (
                questions.map((question) => (
                  <tr key={question.id} className="group hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-200 whitespace-nowrap group-hover:bg-slate-50">
                      {question.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-[220px] truncate">
                      {question.course?.title || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate">
                      {question.lesson?.title || "Toàn khóa học"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-[240px] truncate">
                      {question.title || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {question.status || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCreator(question)}
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 border-l border-slate-200 whitespace-nowrap group-hover:bg-slate-50">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetail(question)}
                          className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(question)}
                          className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(question)}
                          className="text-red-600 hover:text-red-700 hover:underline underline-offset-4 whitespace-nowrap"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Chưa có câu hỏi nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && pageInfo.totalPages > 1 ? (
        <div className="mt-6">
          <PaginationBar
            page={pageInfo.pageNumber}
            totalPages={pageInfo.totalPages}
            onChange={(nextPage) => loadQuestions(nextPage)}
          />
        </div>
      ) : null}

      {editOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeEdit} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">Sửa câu hỏi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cập nhật tiêu đề và nội dung câu hỏi.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nội dung
                </label>
                <textarea
                  rows="4"
                  value={editForm.content}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      content: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="Nhập nội dung"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <div>
                  Khóa học:{" "}
                  <span className="font-medium text-slate-900">
                    {activeQuestion?.course?.title || "-"}
                  </span>
                </div>
                <div className="mt-1">
                  Bài học:{" "}
                  <span className="font-medium text-slate-900">
                    {activeQuestion?.lesson?.title || "Toàn khóa học"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition inline-flex items-center justify-center disabled:opacity-60"
                >
                  {editSaving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {detailOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeDetail} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Chi tiết câu hỏi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin cơ bản từ danh sách câu hỏi.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-sm text-slate-600 hover:text-slate-900 hover:underline underline-offset-4"
              >
                Quay lại
              </button>
            </div>

            {detailError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {detailError}
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase text-slate-500">
                  Thông tin cơ bản
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-slate-500">Khóa học: </span>
                    <span className="font-medium text-slate-900">
                      {detailCourseTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bài học: </span>
                    <span className="font-medium text-slate-900">
                      {detailLessonTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tiêu đề: </span>
                    <span className="font-medium text-slate-900">
                      {detailQuestion?.title || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái: </span>
                    <span className="font-medium text-slate-900">
                      {detailQuestion?.status || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Người tạo: </span>
                    <span className="font-medium text-slate-900">
                      {formatCreator(detailQuestion)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <div className="text-xs uppercase text-slate-500">Nội dung</div>
                <p className="mt-3 whitespace-pre-line text-slate-800">
                  {detailQuestion?.content || "-"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Câu trả lời
                </h3>
                <span className="text-xs text-slate-500">
                  {detailAnswers.length} câu trả lời
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          ID
                        </th>
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
                      {detailLoading ? (
                        <tr>
                          <td className="px-4 py-6" colSpan={5}>
                            Đang tải câu trả lời...
                          </td>
                        </tr>
                      ) : detailAnswers.length ? (
                        detailAnswers.map((answer) => (
                          <tr key={answer.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{answer.id}</td>
                            <td className="px-4 py-3">
                              {answer.content || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {answer.userId ? `${answer.createdUser}` : "-"}
                            </td>
                            <td className="px-4 py-3">
                              {answer.isAccepted ? "Đã duyệt" : "Chờ duyệt"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApproveAnswer(answer)}
                                  className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectAnswer(answer)}
                                  className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                                >
                                  Từ chối
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnswer(answer)}
                                  className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
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
          </div>
        </>
      ) : null}

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
                    : "bg-red-600 hover:bg-red-700",
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
