import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourseDetail } from "@/api/catalog.api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import useFileUrl from "@/hooks/useFileUrl";
import useEnrollmentStatus from "@/hooks/useEnrollmentStatus";
import { enrollCourse } from "@/services/enrollment.service";
import { checkoutCart, payOrderVnpay } from "@/services/order.service";

const LEVEL_MAP = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_MAP = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
};

const formatPrice = (priceCents, price) => {
  if (priceCents === 0) return "Miễn phí";
  if (typeof priceCents === "number") {
    return (priceCents / 100).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }
  if (price === null || price === undefined) return "Miễn phí";
  if (typeof price === "number") {
    return price.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }
  return price || "Miễn phí";
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  const { addToCart } = useCart();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(null);

  const { url: thumbnailUrl } = useFileUrl(
    course?.thumbnail || course?.thumbnailFileId || course?.thumbnailId
  );
  const {
    enrolled: enrolledStatus,
    loading: statusLoading,
    error: statusError,
  } = useEnrollmentStatus(courseId);
  const isStudent = isAuthenticated && hasRole("ROLE_STUDENT");
  const priceValue = useMemo(() => {
    if (!course) return 0;
    if (typeof course.priceCents === "number") return course.priceCents;
    const raw = Number(course.price ?? 0);
    return Number.isFinite(raw) ? raw : 0;
  }, [course]);
  const isPaidCourse = priceValue > 0;

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError("");
      setRequiresAuth(false);
      try {
        const data = await fetchCourseDetail(courseId);
        setCourse(data);
      } catch (err) {
        if (err?.status === 401 && !isAuthenticated) {
          setRequiresAuth(true);
          setError("");
        } else {
          setError(err?.message || "Không tải được thông tin khóa học.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [courseId, isAuthenticated]);

  const sections = useMemo(() => {
    if (!course) return [];
    return course.sections || course.curriculum || course.chapters || [];
  }, [course]);

  useEffect(() => {
    setEnrolled(enrolledStatus);
  }, [enrolledStatus]);

  useEffect(() => {
    setActionMessage("");
    setActionError("");
    setEnrolled(null);
  }, [courseId]);

  const handleLoginRedirect = () => {
    navigate("/login", { state: { returnTo: `/courses/${courseId}` } });
  };

  const handleStartLearning = () => {
    navigate(`/learn/${courseId}`);
  };

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrollLoading(true);
    setActionMessage("");
    setActionError("");
    try {
      await enrollCourse(courseId);
      setEnrolled(true);
      setActionMessage("Đăng ký khóa học thành công.");
    } catch (err) {
      setActionError(
        err?.message || "Không thể đăng ký khóa học. Vui lòng thử lại."
      );
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!courseId) return;
    setCartLoading(true);
    setActionMessage("");
    setActionError("");
    try {
      await addToCart(Number(courseId));
      setActionMessage("Đã thêm khóa học vào giỏ hàng.");
    } catch (err) {
      setActionError(err?.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleCheckoutNow = async () => {
    if (!courseId) return;
    setCheckoutLoading(true);
    setActionMessage("");
    setActionError("");
    try {
      const cart = await addToCart(Number(courseId));
      if (!cart?.id) {
        throw new Error("Không tạo được giỏ hàng.");
      }
      const order = await checkoutCart(cart.id);
      if (!order?.id) {
        throw new Error("Không tạo được đơn hàng.");
      }
      if (order.status === "PAID" || order.totalAmountCents === 0) {
        setActionMessage("Thanh toán thành công. Đang cập nhật khóa học.");
        navigate("/me/learning");
        return;
      }
      const payment = await payOrderVnpay(order.id);
      const paymentUrl =
        payment?.paymentUrl || payment?.url || payment?.paymentURL;
      if (!paymentUrl) {
        throw new Error("Không lấy được đường dẫn thanh toán.");
      }
      window.location.href = paymentUrl;
    } catch (err) {
      setActionError(err?.message || "Không thể thanh toán ngay.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Đang tải...</div>;
  }

  if (requiresAuth) {
    return (
      <Card className="p-6">
        <p className="text-lg font-semibold">
          Vui lòng đăng nhập để xem chi tiết khóa học.
        </p>
        <Button
          className="mt-4"
          onClick={() =>
            navigate("/login", { state: { returnTo: `/courses/${courseId}` } })
          }
        >
          Đăng nhập
        </Button>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="font-semibold text-red-600">Có lỗi xảy ra</p>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card className="p-4">
        <p className="font-semibold">Không tìm thấy khóa học</p>
        <p className="text-sm text-slate-500">Vui lòng thử lại sau.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {thumbnailUrl ? (
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-6 aspect-video w-full rounded-lg bg-gradient-to-r from-slate-100 to-slate-200" />
        )}
        <p className="text-sm text-slate-500">
          {course.category?.name || course.categoryName || "Khóa học"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {course.shortDescription || course.subtitle || "Khóa học trực tuyến"}
        </p>

        {course.instructors?.length ? (
          <p className="mt-3 text-sm text-slate-600">
            Giảng viên:{" "}
            {course.instructors
              .map((ins) => ins.fullName || ins.name || ins)
              .join(", ")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {course.language ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {LANGUAGE_MAP[course.language] || course.language}
            </span>
          ) : null}
          {course.level ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {LEVEL_MAP[course.level] || course.level}
            </span>
          ) : null}
          {course.tags?.length
            ? course.tags.map((tag) => (
                <span
                  key={tag.id || tag.name}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600"
                >
                  {tag.name || tag.title}
                </span>
              ))
            : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-2xl font-semibold text-[#BE123C]">
            {formatPrice(course.priceCents, course.price)}
          </p>
          {course.ratingAvg ? (
            <p className="text-sm text-slate-900">
              {course.ratingAvg}{" "}
              {course.ratingCount ? (
                <span className="text-slate-500">
                  ({course.ratingCount} đánh giá)
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {!isAuthenticated ? (
            <Button size="lg" onClick={handleLoginRedirect}>
              {isPaidCourse ? "Đăng nhập để mua" : "Đăng nhập để học"}
            </Button>
          ) : !isStudent ? (
            <p className="text-sm text-slate-500">
              Tài khoản này không có quyền ghi danh.
            </p>
          ) : statusLoading || (enrolled === null && !statusError) ? (
            <Button size="lg" disabled>
              Đang kiểm tra...
            </Button>
          ) : enrolled ? (
            <Button size="lg" onClick={handleStartLearning}>
              Học ngay
            </Button>
          ) : isPaidCourse ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleAddToCart}
                disabled={cartLoading || checkoutLoading}
              >
                {cartLoading ? "Đang thêm..." : "Thêm vào giỏ"}
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleCheckoutNow}
                disabled={checkoutLoading || cartLoading}
              >
                {checkoutLoading ? "Đang thanh toán..." : "Thanh toán ngay"}
              </Button>
            </div>
          ) : (
            <Button size="lg" onClick={handleEnroll} disabled={enrollLoading}>
              {enrollLoading ? "Đang xử lý..." : "Đăng ký học"}
            </Button>
          )}
          {statusError && isStudent ? (
            <p className="text-sm text-slate-500">{statusError}</p>
          ) : null}
          {actionMessage ? (
            <p className="text-sm text-green-600">{actionMessage}</p>
          ) : null}
          {actionError ? (
            <p className="text-sm text-red-600">{actionError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Giới thiệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>{course.description || "Giới thiệu về khóa học."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Ngôn ngữ: </span>
              {LANGUAGE_MAP[course.language] || course.language || "Không rõ"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Trình độ: </span>
              {LEVEL_MAP[course.level] || course.level || "Không rõ"}
            </p>
            {course.category?.name || course.categoryName ? (
              <p>
                <span className="font-medium text-slate-900">Danh mục: </span>
                {course.category?.name || course.categoryName}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(course.requirements) && course.requirements.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {course.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Yêu cầu khóa học sẽ được cập nhật sau.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nội dung khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length ? (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div
                  key={section.id || idx}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <p className="font-medium text-slate-900">
                    {section.title || section.name || `Phần ${idx + 1}`}
                  </p>
                  {section.lessons?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {section.lessons.map((lesson, lIdx) => (
                        <li key={lesson.id || lIdx}>
                          {lesson.title || lesson.name || `Bài ${lIdx + 1}`}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Nội dung khóa học sẽ được hiển thị sau.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
