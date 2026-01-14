import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInstructorCourses } from "@/services/instructor.course.service";
import {
  listAdminReviews,
  moderateReview,
} from "@/services/review.admin.service";

const STATUS_LABELS = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const STATUS_STYLES = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const normalizeCourseList = (payload) => {
  if (!payload) return [];
  const items = Array.isArray(payload)
    ? payload
    : payload.content || payload.items || payload.data || [];
  return Array.isArray(items) ? items : [];
};

export default function AdminReviews() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalReview, setModalReview] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadCourses = async () => {
    setCourseLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listInstructorCourses({ page: 0, size: 200 });
      const items = normalizeCourseList(data);
      setCourses(items);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message:
          error?.message ||
          "Không thể tải danh sách khóa học.",
      });
    } finally {
      setCourseLoading(false);
    }
  };

  const loadReviews = async (pageNumber = 0) => {
    setReviewsLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listAdminReviews({
        courseId: selectedCourseId || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: pageNumber,
        size: reviewsMeta.pageSize,
      });
      setReviews(data.items || []);
      setReviewsMeta({
        pageNumber: data.pageNumber ?? pageNumber,
        pageSize: data.pageSize ?? reviewsMeta.pageSize,
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
          error?.message || "Không thể tải danh sách đánh giá.",
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadReviews(0);
  }, [selectedCourseId, statusFilter]);

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reviews.filter((review) => {
      if (!term) return true;
      const text = [
        review.title,
        review.content,
        review.studentName,
        review.courseTitle,
        review.userId ? String(review.userId) : "",
        review.courseId ? String(review.courseId) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [reviews, searchTerm, statusFilter]);

  const handleModerate = async (review, status) => {
    if (!review?.id) return;
    setActionLoadingId(review.id);
    setNotice(null);
    try {
      const updated = await moderateReview(review.id, status);
      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? { ...item, status: updated?.status || status }
            : item
        )
      );
      setNotice({
        type: "success",
        message:
          status === "APPROVED"
            ? "Đã duyệt đánh giá."
            : "Đã từ chối đánh giá.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error?.message || "Không thể cập nhật đánh giá.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openModerateModal = (review, status) => {
    setModalReview(review);
    setModalAction(status);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setModalReview(null);
  };

  if (permissionError) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">
            Bạn không có quyền truy cập.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Về trang quản trị
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Đánh giá khóa học
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý phản hồi và duyệt đánh giá của học viên.
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
          value={selectedCourseId}
          onChange={(event) => setSelectedCourseId(event.target.value)}
          className="h-10 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          disabled={courseLoading}
        >
          {courseLoading ? (
            <option value="">
              Đang tải khóa học...
            </option>
          ) : (
            <option value="">Tất cả khóa học</option>
          )}
          {courses.length ? (
            courses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {course.title || `Khóa học #${course.id}`}
              </option>
            ))
          ) : courseLoading ? null : (
            <option value="">Chưa có khóa học</option>
          )}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo tiêu đề, nội dung..."
          className="h-10 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        />
        <span className="text-sm text-slate-500">
          {filteredReviews.length} đánh giá
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
                Học viên
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Khóa học
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Số sao
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Tiêu đề
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Nội dung
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                Thời gian
              </th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right font-semibold whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {reviewsLoading ? (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-slate-500">
                  Đang tải đánh giá...
                </td>
              </tr>
            ) : filteredReviews.length ? (
              filteredReviews.map((review) => {
                const ratingValue = Number(review.rating) || 0;
                const statusLabel = STATUS_LABELS[review.status] || review.status;
                const statusStyle = STATUS_STYLES[review.status] || "";
                const reviewerName = review.studentName
                  ? review.studentName
                  : review.createdUser
                  ? review.createdUser
                  : review.userId
                  ? `Học viên #${review.userId}`
                  : "Học viên";
                const courseTitle =
                  review.courseTitle ||
                  (review.courseId ? `Khóa học #${review.courseId}` : "-");
                return (
                  <tr key={review.id} className="border-t hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-slate-700 whitespace-nowrap">
                      {review.id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {reviewerName}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {courseTitle}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {ratingValue}/5
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {review.title || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {review.content || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {review.moderatedAt ||
                        review.createdAt ||
                        review.createdTime ||
                        "-"}
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openModerateModal(review, "APPROVED")}
                        disabled={
                          actionLoadingId === review.id ||
                          review.status === "APPROVED"
                        }
                        className="text-[#E11D48] hover:text-[#BE123C] hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        Duyệt
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => openModerateModal(review, "REJECTED")}
                        disabled={
                          actionLoadingId === review.id ||
                          review.status === "REJECTED"
                        }
                        className="text-[#E11D48] hover:text-[#BE123C] hover:underline underline-offset-4 disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-slate-500">
                  Chưa có đánh giá nào.
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
            loadReviews(Math.max(reviewsMeta.pageNumber - 1, 0))
          }
          disabled={reviewsMeta.pageNumber <= 0 || reviewsLoading}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang trước
        </button>
        <span className="text-slate-500">
          Trang {reviewsMeta.pageNumber + 1} / {reviewsMeta.totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            loadReviews(
              Math.min(reviewsMeta.pageNumber + 1, reviewsMeta.totalPages - 1)
            )
          }
          disabled={
            reviewsMeta.totalPages <= reviewsMeta.pageNumber + 1 ||
            reviewsLoading
          }
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Trang sau
        </button>
      </div>

      {modalOpen && modalReview ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {modalAction === "APPROVED" ? "Duyệt đánh giá" : "Từ chối đánh giá"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Xác nhận thao tác cho đánh giá #{modalReview.id}.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <div>
                <span className="text-slate-500">Học viên:</span>{" "}
                {modalReview.studentName ||
                  modalReview.createdUser ||
                  (modalReview.userId ? `Học viên #${modalReview.userId}` : "-")}
              </div>
              <div>
                <span className="text-slate-500">Khóa học:</span>{" "}
                {modalReview.courseTitle ||
                  (modalReview.courseId
                    ? `Khóa học #${modalReview.courseId}`
                    : "-")}
              </div>
              <div>
                <span className="text-slate-500">Số sao:</span>{" "}
                {modalReview.rating}/5
              </div>
              <div>
                <span className="text-slate-500">Tiêu đề:</span>{" "}
                {modalReview.title || "-"}
              </div>
              <div>
                <span className="text-slate-500">Nội dung:</span>{" "}
                {modalReview.content || "-"}
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
                onClick={() => {
                  handleModerate(modalReview, modalAction);
                  closeModal();
                }}
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
