import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listAdminReports,
  updateReportStatus,
  addModerationAction,
} from "@/services/report.admin.service";

const TARGET_TYPE_LABELS = {
  REVIEW: "Đánh giá",
  QUESTION: "Câu hỏi",
  ANSWER: "Trả lời",
  COURSE: "Khóa học",
  LESSON: "Bài học",
};

const STATUS_LABELS = {
  OPEN: "Đang mở",
  IN_REVIEW: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};

const STATUS_STYLES = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-700",
  IN_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const ACTION_LABELS = {
  APPROVE: "Chấp nhận",
  REJECT: "Từ chối",
  HIDE: "Ẩn nội dung",
  BLOCK_USER: "Chặn người dùng",
};

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [reportsMeta, setReportsMeta] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [reportsLoading, setReportsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalReport, setModalReport] = useState(null);
  const [modalForm, setModalForm] = useState({
    action: "APPROVE",
    notes: "",
  });

  const loadReports = async (pageNumber = 0) => {
    setReportsLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listAdminReports({
        page: pageNumber,
        size: reportsMeta.pageSize,
      });
      setReports(data.items || []);
      setReportsMeta({
        pageNumber: data.pageNumber ?? pageNumber,
        pageSize: data.pageSize ?? reportsMeta.pageSize,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message:
          error?.message || "Không thể tải danh sách phản hồi.",
      });
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (
        targetTypeFilter !== "all" &&
        report.targetType !== targetTypeFilter
      )
        return false;
      if (!term) return true;
      return (
        report.reason?.toLowerCase().includes(term) ||
        String(report.id).includes(term) ||
        String(report.reporterUserId).includes(term) ||
        String(report.targetId).includes(term)
      );
    });
  }, [reports, statusFilter, targetTypeFilter, searchTerm]);

  const openStatusModal = (report) => {
    setModalType("status");
    setModalReport(report);
    setModalOpen(true);
  };

  const openActionModal = (report) => {
    setModalType("action");
    setModalReport(report);
    setModalForm({
      action: "APPROVE",
      notes: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalReport(null);
    setModalForm({
      action: "APPROVE",
      notes: "",
    });
  };

  const handleUpdateStatus = async (status) => {
    if (!modalReport || !status) return;
    setActionLoadingId(modalReport.id);
    setNotice(null);
    try {
      await updateReportStatus(modalReport.id, status);
      setNotice({
        type: "success",
        message: `Đã cập nhật trạng thái thành: ${STATUS_LABELS[status] || status}`,
      });
      closeModal();
      loadReports(reportsMeta.pageNumber);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error?.message || "Không thể cập nhật trạng thái.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddAction = async () => {
    if (!modalReport) return;
    if (!modalForm.action) {
      setNotice({
        type: "error",
        message: "Vui lòng chọn hành động.",
      });
      return;
    }
    setActionLoadingId(modalReport.id);
    setNotice(null);
    try {
      await addModerationAction(modalReport.id, {
        action: modalForm.action,
        notes: modalForm.notes.trim() || undefined,
      });
      setNotice({
        type: "success",
        message: `Đã thực hiện hành động: ${ACTION_LABELS[modalForm.action] || modalForm.action}`,
      });
      closeModal();
      loadReports(reportsMeta.pageNumber);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error?.message || "Không thể thực hiện hành động.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (permissionError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Quản lý phản hồi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem xét và xử lý các phản hồi từ người dùng.
          </p>
        </div>
      </div>

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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="OPEN">Đang mở</option>
          <option value="IN_REVIEW">Đang xử lý</option>
          <option value="RESOLVED">Đã xử lý</option>
        </select>
        <select
          value={targetTypeFilter}
          onChange={(event) => setTargetTypeFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="all">Tất cả loại nội dung</option>
          <option value="REVIEW">Đánh giá</option>
          <option value="QUESTION">Câu hỏi</option>
          <option value="ANSWER">Trả lời</option>
          <option value="COURSE">Khóa học</option>
          <option value="LESSON">Bài học</option>
        </select>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo ID, lý do..."
          className="h-10 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        />
        <span className="text-sm text-slate-500">
          {filteredReports.length} phản hồi
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap">
                ID
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Người báo cáo
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Loại nội dung
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                ID nội dung
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Lý do
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Trạng thái
              </th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right font-semibold whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {reportsLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                  Đang tải phản hồi...
                </td>
              </tr>
            ) : filteredReports.length ? (
              filteredReports.map((report) => {
                const statusLabel = STATUS_LABELS[report.status] || report.status;
                const statusStyle = STATUS_STYLES[report.status] || "";
                const targetTypeLabel =
                  TARGET_TYPE_LABELS[report.targetType] || report.targetType;
                return (
                  <tr key={report.id} className="border-t hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-slate-700 whitespace-nowrap">
                      {report.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {report.reporterName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {targetTypeLabel}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {report.targetId}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={report.reason}>
                        {report.reason || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openStatusModal(report)}
                        disabled={actionLoadingId === report.id}
                        className="text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                      >
                        Đổi trạng thái
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => openActionModal(report)}
                        disabled={actionLoadingId === report.id}
                        className="text-[#E11D48] hover:text-[#BE123C] hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        Hành động
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                  Chưa có phản hồi nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() =>
            loadReports(Math.max(reportsMeta.pageNumber - 1, 0))
          }
          disabled={reportsMeta.pageNumber <= 0 || reportsLoading}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang trước
        </button>
        <span className="text-slate-500">
          Trang {reportsMeta.pageNumber + 1} / {reportsMeta.totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            loadReports(
              Math.min(reportsMeta.pageNumber + 1, reportsMeta.totalPages - 1)
            )
          }
          disabled={
            reportsMeta.totalPages <= reportsMeta.pageNumber + 1 ||
            reportsLoading
          }
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang sau
        </button>
      </div>

      {modalOpen && modalReport && modalType === "status" ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Cập nhật trạng thái phản hồi
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Chọn trạng thái mới cho phản hồi #{modalReport.id}.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <div>
                <span className="text-slate-500">Loại nội dung:</span>{" "}
                {TARGET_TYPE_LABELS[modalReport.targetType] || modalReport.targetType}
              </div>
              <div>
                <span className="text-slate-500">ID nội dung:</span>{" "}
                {modalReport.targetId}
              </div>
              <div>
                <span className="text-slate-500">Lý do:</span>{" "}
                {modalReport.reason || "-"}
              </div>
              <div>
                <span className="text-slate-500">Trạng thái hiện tại:</span>{" "}
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[modalReport.status] || ""
                  }`}
                >
                  {STATUS_LABELS[modalReport.status] || modalReport.status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus("OPEN")}
                disabled={modalReport.status === "OPEN"}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đánh dấu: Đang mở
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("IN_REVIEW")}
                disabled={modalReport.status === "IN_REVIEW"}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đánh dấu: Đang xử lý
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("RESOLVED")}
                disabled={modalReport.status === "RESOLVED"}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đánh dấu: Đã xử lý
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-[#E11D48] hover:bg-red-50 transition inline-flex items-center justify-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      ) : null}

      {modalOpen && modalReport && modalType === "action" ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Thực hiện hành động kiểm duyệt
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Chọn hành động cho phản hồi #{modalReport.id}.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <div>
                <span className="text-slate-500">Loại nội dung:</span>{" "}
                {TARGET_TYPE_LABELS[modalReport.targetType] || modalReport.targetType}
              </div>
              <div>
                <span className="text-slate-500">ID nội dung:</span>{" "}
                {modalReport.targetId}
              </div>
              <div>
                <span className="text-slate-500">Lý do:</span>{" "}
                {modalReport.reason || "-"}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hành động
                </label>
                <select
                  value={modalForm.action}
                  onChange={(event) =>
                    setModalForm((prev) => ({
                      ...prev,
                      action: event.target.value,
                    }))
                  }
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                >
                  <option value="APPROVE">Chấp nhận</option>
                  <option value="REJECT">Từ chối</option>
                  <option value="HIDE">Ẩn nội dung</option>
                  <option value="BLOCK_USER">Chặn người dùng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={modalForm.notes}
                  onChange={(event) =>
                    setModalForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Nhập ghi chú về hành động này..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-[#E11D48] hover:bg-red-50 transition inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddAction}
                className="h-10 rounded-lg bg-[#E11D48] px-4 text-sm font-semibold text-white hover:bg-[#BE123C] transition inline-flex items-center justify-center"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
