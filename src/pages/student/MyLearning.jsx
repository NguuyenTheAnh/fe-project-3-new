import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCourseDetail,
  getFileMetaSmart,
  listMyEnrollments,
} from "@/services/learning.service";
import { getCourseProgress } from "@/services/progress.service";

const PAGE_SIZE = 10;

const LEVEL_LABELS = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_LABELS = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  Vietnamese: "Tiếng Việt",
  English: "Tiếng Anh",
};

const formatPrice = (priceCents, currency, isFree) => {
  if (isFree || priceCents === 0) return "Miễn phí";
  if (typeof priceCents !== "number") return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(priceCents);
};

const mapLevel = (level) =>
  LEVEL_LABELS[level] || (level ? level : "Tất cả trình độ");

const mapLanguage = (language) =>
  LANGUAGE_LABELS[language] || (language ? language : "");

const normalizeEnrollmentStatus = (item) =>
  item?.status || item?.enrollmentStatus;

const isActiveEnrollment = (item) => {
  const status = normalizeEnrollmentStatus(item);
  if (!status) return true;
  const normalized = String(status).toUpperCase();
  return normalized === "ENROLLED" || normalized === "ACTIVE";
};

const extractCourseId = (item) => item?.courseId;

const resolveInstructorNames = (course) => {
  const list = course?.instructors || [];
  const names = list
    .map((item) => item?.fullName || item?.name || item?.email)
    .filter(Boolean)
    .join(", ");
  return names || course?.instructorName || "Giảng viên";
};

const buildMetaLine = (course) => {
  const parts = [];
  if (course?.level) parts.push(mapLevel(course.level));
  if (course?.language) parts.push(mapLanguage(course.language));
  if (course?.totalLessons) parts.push(`${course.totalLessons} bài học`);
  if (course?.totalDurationMinutes) {
    parts.push(`${course.totalDurationMinutes} phút`);
  }
  return parts.filter(Boolean).join(" • ");
};

const buildRatingText = (ratingAvg, ratingCount) => {
  if (!ratingCount || typeof ratingAvg !== "number") return null;
  return ratingAvg.toFixed(1);
};

const resolveContinueLessonId = (course) =>
  course?.sections?.[0]?.lessons?.[0]?.id || null;

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
        <div className="h-9 w-full bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function MyLearning() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageNumber: 0,
    pageSize: PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourseDetails = useCallback(async (courseIds) => {
    const results = new Map();
    const errors = new Map();
    const limit = 6;

    for (let i = 0; i < courseIds.length; i += limit) {
      const chunk = courseIds.slice(i, i + limit);
      const settled = await Promise.allSettled(
        chunk.map((id) => getCourseDetail(id))
      );
      settled.forEach((result, index) => {
        const courseId = chunk[index];
        if (result.status === "fulfilled" && result.value) {
          results.set(courseId, result.value);
        } else {
          errors.set(courseId, "Không tải được khóa học.");
        }
      });
    }

    return { results, errors };
  }, []);

  const fetchProgress = useCallback(async (courseIds) => {
    const results = new Map();
    const limit = 6;
    for (let i = 0; i < courseIds.length; i += limit) {
      const chunk = courseIds.slice(i, i + limit);
      const settled = await Promise.allSettled(
        chunk.map((id) => getCourseProgress(id))
      );
      settled.forEach((result, index) => {
        const courseId = chunk[index];
        if (result.status === "fulfilled" && result.value) {
          results.set(courseId, result.value);
        }
      });
    }
    return results;
  }, []);

  const resolveThumbnailUrl = useCallback(async (thumbnail) => {
    if (!thumbnail?.id) return null;
    const accessUrl = thumbnail.accessUrl || null;
    if (accessUrl) return accessUrl;

    try {
      return await getFileMetaSmart(thumbnail.id, thumbnail.isPublic);
    } catch (error) {
      return null;
    }
  }, []);

  const buildCards = useCallback(
    async (enrollments) => {
      const active = enrollments.filter(isActiveEnrollment);
      const courseIds = Array.from(
        new Set(active.map((item) => extractCourseId(item)).filter(Boolean))
      );

      const { results, errors } = await fetchCourseDetails(courseIds);
      const progressMap = await fetchProgress(courseIds);

      const nextCards = await Promise.all(
        active.map(async (item) => {
          const courseId = extractCourseId(item);
          const course = results.get(courseId);
          if (!course) {
            return {
              courseId,
              error: errors.get(courseId) || "Không tải được khóa học.",
            };
          }

          const thumbnailUrl = await resolveThumbnailUrl(course.thumbnail);
          const continueLessonId = resolveContinueLessonId(course);
          const ratingText = buildRatingText(
            course.ratingAvg,
            course.ratingCount
          );
          const progress = progressMap.get(courseId);
          const percent = typeof progress?.progressPercent === "number"
            ? progress.progressPercent
            : 0;

          return {
            courseId,
            title: course.title || "Khóa học",
            shortDescription:
              course.shortDescription || course.subtitle || course.summary || "",
            instructorNames: resolveInstructorNames(course),
            ratingAvg: course.ratingAvg,
            ratingCount: course.ratingCount,
            ratingText,
            meta: buildMetaLine(course),
            priceLabel: formatPrice(
              course.priceCents,
              course.currency,
              course.isFree
            ),
            thumbnailUrl,
            continueLessonId,
            progressPercent: Math.max(0, Math.min(100, percent)),
          };
        })
      );

      setCards(nextCards);
    },
    [fetchCourseDetails, fetchProgress, resolveThumbnailUrl]
  );

  const fetchEnrollments = useCallback(
    async (pageNumber) => {
      setLoading(true);
      setError("");
      try {
        const data = await listMyEnrollments({
          page: pageNumber,
          size: PAGE_SIZE,
        });
        setPageInfo({
          pageNumber: data.pageNumber ?? pageNumber,
          pageSize: data.pageSize ?? PAGE_SIZE,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
        });
        await buildCards(data.items || []);
      } catch (err) {
        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    [buildCards, navigate]
  );

  useEffect(() => {
    fetchEnrollments(0);
  }, [fetchEnrollments]);

  const hasNextPage =
    (pageInfo.pageNumber ?? 0) + 1 < (pageInfo.totalPages ?? 1);
  const hasPrevPage = (pageInfo.pageNumber ?? 0) > 0;

  const handleNext = () => {
    if (!hasNextPage) return;
    fetchEnrollments((pageInfo.pageNumber ?? 0) + 1);
  };

  const handlePrev = () => {
    if (!hasPrevPage) return;
    fetchEnrollments((pageInfo.pageNumber ?? 0) - 1);
  };

  const skeletons = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Khóa học của tôi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tiếp tục học từ nơi bạn dừng lại.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-semibold">Có lỗi xảy ra</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletons.map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : cards.length ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const lessonQuery = card.continueLessonId
              ? `?lessonId=${card.continueLessonId}`
              : "";

            if (card.error) {
              return (
                <div
                  key={card.courseId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700"
                >
                  <p className="text-sm font-semibold">Không tải được khóa học</p>
                  <p className="mt-2 text-sm text-slate-600">{card.error}</p>
                </div>
              );
            }

            return (
              <div
                key={card.courseId}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="relative aspect-video bg-slate-100">
                  {card.thumbnailUrl ? (
                    <img
                      src={card.thumbnailUrl}
                      alt={card.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-slate-100">
                      <span className="text-sm font-semibold">
                        <span className="text-[#E11D48]">HUST</span>
                        <span className="text-slate-900">emy</span>
                      </span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-xs text-slate-700 border">
                    Đã đăng ký
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-1">
                    {card.instructorNames}
                  </p>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
                    {card.meta ? <span>{card.meta}</span> : null}
                    {card.ratingCount ? (
                      <span>
                        {card.ratingText} ★ ({card.ratingCount} đánh giá)
                      </span>
                    ) : (
                      <span>Chưa có đánh giá</span>
                    )}
                  </div>
                  {card.priceLabel ? (
                    <p
                      className={`mt-2 font-semibold ${
                        card.priceLabel === "Miễn phí"
                          ? "text-[#BE123C]"
                          : "text-slate-900"
                      }`}
                    >
                      {card.priceLabel}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#E11D48]"
                        style={{ width: `${card.progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {card.progressPercent}% hoàn thành
                    </div>
                  </div>
                  <Link
                    to={`/learn/${card.courseId}${lessonQuery}`}
                    className="mt-4 w-full h-10 inline-flex items-center justify-center rounded-md bg-red-600 text-white font-medium hover:bg-red-700 active:bg-red-800 transition"
                  >
                    Tiếp tục học
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            Bạn chưa đăng ký khóa học nào.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Chưa có khóa học. Hãy khám phá và đăng ký khóa học phù hợp.
          </p>
          <Link
            to="/search"
            className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition"
          >
            Tìm khóa học
          </Link>
        </div>
      )}

      {cards.length ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrevPage || loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <span className="text-sm text-slate-500">
            Trang {(pageInfo.pageNumber ?? 0) + 1} / {pageInfo.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNextPage || loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang sau
          </button>
        </div>
      ) : null}
    </div>
  );
}
