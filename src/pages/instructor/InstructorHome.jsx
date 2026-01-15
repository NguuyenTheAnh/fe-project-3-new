import { useEffect, useState } from "react";
import { getInstructorDashboard } from "@/services/dashboard.service";

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

export default function InstructorHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await getInstructorDashboard({ limit: 10 });
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
    loadDashboard();
  }, []);

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
  const unansweredQuestions = dashboard?.unansweredQuestions || [];
  const myCourses = dashboard?.myCourses || [];
  const courseCompletions = dashboard?.courseCompletions || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tổng quan giảng dạy
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi hoạt động giảng dạy và tương tác với học viên.
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

      {/* Revenue & Enrollment Overview Chart */}
      <div className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Tổng quan hoạt động
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Ghi danh (7 ngày)</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(kpi.newEnrollmentsLast7Days)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{
                      width: `${Math.min(100, (kpi.newEnrollmentsLast7Days / Math.max(kpi.newEnrollmentsLast30Days, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Ghi danh (30 ngày)</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(kpi.newEnrollmentsLast30Days)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Doanh thu (7 ngày)</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(kpi.revenueLast7Days)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E11D48] to-[#FB7185]"
                    style={{
                      width: `${Math.min(100, (kpi.revenueLast7Days / Math.max(kpi.revenueLast30Days, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Doanh thu (30 ngày)</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(kpi.revenueLast30Days)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E11D48] to-[#BE123C]"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance Chart */}
      {myCourses.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Hiệu suất khóa học
          </h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-4">
              {myCourses.slice(0, 5).map((course) => {
                const maxEnrollment = Math.max(
                  ...myCourses.map((c) => c.enrollmentCount || 0)
                );
                const enrollmentPercent =
                  maxEnrollment > 0
                    ? ((course.enrollmentCount || 0) / maxEnrollment) * 100
                    : 0;
                return (
                  <div key={course.courseId}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span
                        className="font-medium text-slate-900 truncate max-w-xs"
                        title={course.courseTitle}
                      >
                        {course.courseTitle}
                      </span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-slate-600">
                          {formatNumber(course.enrollmentCount)} học viên
                        </span>
                        <span className="text-[#E11D48] font-semibold">
                          {formatCurrency(course.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E11D48] to-[#FB7185] transition-all duration-500"
                        style={{ width: `${enrollmentPercent}%` }}
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
          <div className="text-sm font-medium text-slate-600">
            Khóa học đã xuất bản
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.myPublishedCourses)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">Tổng học viên</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.totalStudents)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Ghi danh mới (7 ngày)
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.newEnrollmentsLast7Days)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Ghi danh mới (30 ngày)
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(kpi.newEnrollmentsLast30Days)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Doanh thu (7 ngày)
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(kpi.revenueLast7Days)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Doanh thu (30 ngày)
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(kpi.revenueLast30Days)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium text-slate-600">
            Đánh giá trung bình
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {kpi.avgRating ? kpi.avgRating.toFixed(2) : "-"} / 5.0
          </div>
        </div>
      </div>

      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Câu hỏi chưa trả lời
            <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
              {unansweredQuestions.length}
            </span>
          </h2>
          <div className="mt-4 space-y-3">
            {unansweredQuestions.map((question) => (
              <div
                key={question.questionId}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">
                        {question.courseTitle}
                      </span>
                      {question.lessonTitle ? (
                        <>
                          {" › "}
                          <span>{question.lessonTitle}</span>
                        </>
                      ) : null}
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-900">
                      {question.questionTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {question.questionContent}
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      Hỏi bởi: {question.askerFullName || `User #${question.askerUserId}`}{" "}
                      • {question.askedAt}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* My Courses */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Khóa học của tôi</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                <th className="px-4 py-3 text-left font-semibold">Học viên</th>
                <th className="px-4 py-3 text-left font-semibold">Doanh thu</th>
                <th className="px-4 py-3 text-left font-semibold">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.length > 0 ? (
                myCourses.map((course) => (
                  <tr key={course.courseId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-sm truncate" title={course.courseTitle}>
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
                      {course.ratingAvg ? (
                        <>
                          {course.ratingAvg.toFixed(1)} (
                          {formatNumber(course.ratingCount)})
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                    Chưa có khóa học nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Completion Analytics */}
      {courseCompletions.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Tỷ lệ hoàn thành khóa học
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Khóa học</th>
                  <th className="px-4 py-3 text-left font-semibold">Tổng bài học</th>
                  <th className="px-4 py-3 text-left font-semibold">Học viên</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Bài học đã hoàn thành
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Tỷ lệ hoàn thành
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseCompletions.map((completion) => (
                  <tr key={completion.courseId} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <div
                        className="max-w-sm truncate"
                        title={completion.courseTitle}
                      >
                        {completion.courseTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(completion.totalLessons)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(completion.totalEnrollments)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatNumber(completion.totalCompletedLessons)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-[#E11D48] h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, completion.completionRate || 0)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {completion.completionRate
                            ? completion.completionRate.toFixed(1)
                            : "0"}
                          %
                        </span>
                      </div>
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
