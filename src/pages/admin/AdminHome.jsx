import { useEffect, useState } from "react";
import { getAdminDashboard } from "@/services/dashboard.service";

const formatCurrency = (amount) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatNumber = (num) => {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
};

const STATUS_LABELS = {
  PUBLISHED: "Đã xuất bản",
  DRAFT: "Bản nháp",
  REVIEW: "Đang xét duyệt",
  ARCHIVED: "Đã lưu trữ",
};

const REPORT_TYPE_LABELS = {
  COURSE_REVIEW: "Đánh giá khóa học",
  QUESTION: "Câu hỏi",
  ANSWER: "Trả lời",
  COURSE: "Khóa học",
  LESSON: "Bài học",
};

export default function AdminHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [daysFilter, setDaysFilter] = useState(30);

  const loadDashboard = async (days = 30) => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await getAdminDashboard({ days, limit: 10 });
      setDashboard(data);
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải dữ liệu dashboard.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(daysFilter);
  }, [daysFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
          Đang tải dashboard...
        </div>
      </div>
    );
  }

  const kpi = dashboard?.kpi || {};
  const revenueTrend = dashboard?.revenueTrend || [];
  const enrollmentTrend = dashboard?.enrollmentTrend || [];
  const courseFunnel = dashboard?.courseFunnel || [];
  const refundQueue = dashboard?.refundQueue || [];
  const contentReportQueue = dashboard?.contentReportQueue || [];
  const topCoursesByRevenue = dashboard?.topCoursesByRevenue || [];
  const topCoursesByEnrollment = dashboard?.topCoursesByEnrollment || [];
  const lowRatingCourses = dashboard?.lowRatingCourses || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi các chỉ số và hoạt động của hệ thống.
          </p>
        </div>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value={7}>7 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={90}>90 ngày</option>
        </select>
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

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        {revenueTrend.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Xu hướng doanh thu
            </h3>
            <div className="mt-4 h-64">
              <div className="flex h-full items-end justify-between gap-2">
                {revenueTrend.slice(0, 15).reverse().map((item, idx) => {
                  const maxRevenue = Math.max(...revenueTrend.map((r) => r.revenue || 0));
                  const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-[#E11D48] to-[#FB7185] rounded-t hover:from-[#BE123C] hover:to-[#E11D48] transition cursor-pointer group relative"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${item.date}: ${formatCurrency(item.revenue)}`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          <div className="font-medium">{formatCurrency(item.revenue)}</div>
                          <div className="text-slate-300">{item.orderCount} đơn</div>
                        </div>
                      </div>
                      {idx % 3 === 0 ? (
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(item.date).getDate()}/{new Date(item.date).getMonth() + 1}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Enrollment Trend Chart */}
        {enrollmentTrend.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Xu hướng ghi danh
            </h3>
            <div className="mt-4 h-64">
              <div className="flex h-full items-end justify-between gap-2">
                {enrollmentTrend.slice(0, 15).reverse().map((item, idx) => {
                  const maxEnrollment = Math.max(
                    ...enrollmentTrend.map((e) => e.enrollmentCount || 0)
                  );
                  const height =
                    maxEnrollment > 0
                      ? ((item.enrollmentCount || 0) / maxEnrollment) * 100
                      : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t hover:from-emerald-600 hover:to-emerald-400 transition cursor-pointer group relative"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${item.date}: ${item.enrollmentCount} ghi danh`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          <div className="font-medium">{item.enrollmentCount} ghi danh</div>
                        </div>
                      </div>
                      {idx % 3 === 0 ? (
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(item.date).getDate()}/{new Date(item.date).getMonth() + 1}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Course Funnel Visualization */}
      {courseFunnel.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Phân bổ trạng thái khóa học</h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-3">
              {courseFunnel.map((item, idx) => {
                const total = courseFunnel.reduce((sum, i) => sum + (i.courseCount || 0), 0);
                const percentage = total > 0 ? ((item.courseCount || 0) / total) * 100 : 0;
                const colors = {
                  PUBLISHED: 'bg-emerald-500',
                  DRAFT: 'bg-amber-500',
                  REVIEW: 'bg-blue-500',
                  ARCHIVED: 'bg-slate-400',
                };
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                      <span className="text-slate-600">
                        {formatNumber(item.courseCount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors[item.status] || 'bg-slate-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Tổng người dùng</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.totalUsers)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Giảng viên</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.totalInstructors)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Tổng khóa học</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.totalCourses)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Đã xuất bản</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.publishedCourses)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Ghi danh (30 ngày)
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.enrollmentsLast30Days)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Doanh thu hôm nay</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(kpi.revenueToday)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Doanh thu 7 ngày</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(kpi.revenueLast7Days)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Doanh thu 30 ngày</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(kpi.revenueLast30Days)}
          </div>
        </div>
      </div>



      {/* Refund Queue */}
      {refundQueue.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Yêu cầu hoàn tiền chờ xử lý
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Người dùng</th>
                  <th className="px-4 py-3 text-left font-semibold">Lý do</th>
                  <th className="px-4 py-3 text-left font-semibold">Số tiền</th>
                  <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {refundQueue.map((item) => (
                  <tr key={item.refundRequestId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {item.refundRequestId}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.userFullName || `User #${item.userId}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={item.reason}>
                        {item.reason || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatCurrency(item.requestedAmountCents)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Content Report Queue */}
      {contentReportQueue.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Báo cáo nội dung chờ xử lý
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Loại</th>
                  <th className="px-4 py-3 text-left font-semibold">Người báo cáo</th>
                  <th className="px-4 py-3 text-left font-semibold">Lý do</th>
                  <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {contentReportQueue.map((item) => (
                  <tr key={item.reportId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{item.reportId}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {REPORT_TYPE_LABELS[item.contentType] || item.contentType}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.reporterFullName || `User #${item.reporterUserId}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={item.reason}>
                        {item.reason || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.reportedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Top Courses */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top by Revenue */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Top khóa học theo doanh thu
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                  <th className="px-4 py-3 text-left font-semibold">Ghi danh</th>
                  <th className="px-4 py-3 text-left font-semibold">Doanh thu</th>
                  <th className="px-4 py-3 text-left font-semibold">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {topCoursesByRevenue.map((course) => (
                  <tr key={course.courseId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={course.courseTitle}>
                        {course.courseTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(course.enrollmentCount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {course.ratingAvg?.toFixed(1) || "-"} (
                      {formatNumber(course.ratingCount)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top by Enrollment */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Top khóa học theo lượt ghi danh
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                  <th className="px-4 py-3 text-left font-semibold">Ghi danh</th>
                  <th className="px-4 py-3 text-left font-semibold">Doanh thu</th>
                  <th className="px-4 py-3 text-left font-semibold">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {topCoursesByEnrollment.map((course) => (
                  <tr key={course.courseId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={course.courseTitle}>
                        {course.courseTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(course.enrollmentCount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {course.ratingAvg?.toFixed(1) || "-"} (
                      {formatNumber(course.ratingCount)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Rating Courses */}
      {lowRatingCourses.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Khóa học đánh giá thấp
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                  <th className="px-4 py-3 text-left font-semibold">Ghi danh</th>
                  <th className="px-4 py-3 text-left font-semibold">Doanh thu</th>
                  <th className="px-4 py-3 text-left font-semibold">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {lowRatingCourses.map((course) => (
                  <tr key={course.courseId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-xs truncate" title={course.courseTitle}>
                        {course.courseTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(course.enrollmentCount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="text-red-600 font-medium">
                        {course.ratingAvg?.toFixed(1) || "-"}
                      </span>{" "}
                      ({formatNumber(course.ratingCount)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
