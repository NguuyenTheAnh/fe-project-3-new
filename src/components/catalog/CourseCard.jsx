import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import useFileUrl from "@/hooks/useFileUrl";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getEnrollmentStatus } from "@/services/enrollment.service";

const LEVEL_LABELS = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_LABELS = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
};

const formatPrice = (priceCents, price) => {
  if (priceCents === 0) return "Miễn phí";
  if (typeof priceCents === "number") {
    return priceCents.toLocaleString("vi-VN", {
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

const resolveInstructorNames = (course) => {
  if (course?.instructorName) return course.instructorName;
  if (course?.instructor) return course.instructor;
  const list = course?.instructors || course?.teachers;
  if (!Array.isArray(list)) return "";
  return list
    .map((t) => t?.fullName || t?.name || t)
    .filter(Boolean)
    .join(", ");
};

export default function CourseCard({ course }) {
  const id = course?.id ?? course?.courseId ?? course?.slug;
  const href = id ? `/courses/${id}` : "#";
  const { url: thumbnailUrl } = useFileUrl(
    course?.thumbnail ||
      course?.thumbnailFileId ||
      course?.thumbnailId ||
      course?.image
  );
  const instructors = resolveInstructorNames(course);
  const rating = course?.ratingAvg ?? course?.rating;
  const reviewCount = course?.ratingCount ?? course?.reviewCount;
  const totalStudents = course?.totalStudents ?? course?.studentCount;
  const level = course?.level ? LEVEL_LABELS[course.level] || course.level : "";
  const language = course?.language
    ? LANGUAGE_LABELS[course.language] || course.language
    : "";
  const meta = [level, language].filter(Boolean).join(" • ");

  const infoItems = useMemo(() => {
    const items = [];
    if (level) items.push(`Trình độ: ${level}`);
    if (language) items.push(`Ngôn ngữ: ${language}`);
    if (items.length === 0) items.push("Khóa học trực tuyến");
    return items.slice(0, 2);
  }, [level, language]);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  const { addToCart } = useCart();
  const [actionState, setActionState] = useState("idle");
  const [enrolled, setEnrolled] = useState(null);
  const [checkingEnroll, setCheckingEnroll] = useState(false);
  const timerRef = useRef(null);
  const checkedRef = useRef(false);

  const isStudent = isAuthenticated && hasRole("ROLE_STUDENT");
  const showCartButton = !isAuthenticated || isStudent;

  useEffect(() => {
    if (actionState === "added" || actionState === "error") {
      timerRef.current = setTimeout(() => {
        setActionState("idle");
      }, 1500);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [actionState]);

  const handleCheckEnrollment = async () => {
    if (!isStudent || !id || checkedRef.current) return;
    setCheckingEnroll(true);
    try {
      const status = await getEnrollmentStatus(id);
      setEnrolled(Boolean(status));
    } catch {
      setEnrolled(false);
    } finally {
      checkedRef.current = true;
      setCheckingEnroll(false);
    }
  };

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!id) return;
    if (!isAuthenticated) {
      navigate("/login", {
        state: { returnTo: location.pathname + location.search },
      });
      return;
    }
    if (!isStudent) return;
    try {
      setActionState("adding");
      await addToCart(Number(id));
      setActionState("added");
    } catch (err) {
      setActionState("error");
    }
  };

  const handleLearnNow = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!id) return;
    navigate(`/learn/${id}`);
  };

  const actionLabel = (() => {
    if (checkingEnroll) return "Đang kiểm tra...";
    if (enrolled) return "Học ngay";
    if (actionState === "adding") return "Đang thêm...";
    if (actionState === "added") return "Đã thêm";
    if (actionState === "error") return "Thử lại";
    return "Thêm vào giỏ hàng";
  })();

  return (
    <Link to={href}>
      <Card
        className="group relative h-full overflow-hidden transition hover:-translate-y-[1px] hover:shadow-md"
        onMouseEnter={handleCheckEnrollment}
        onFocus={handleCheckEnrollment}
      >
        <div className="relative">
          {thumbnailUrl ? (
            <div className="aspect-video w-full bg-slate-100">
              <img
                src={thumbnailUrl}
                alt={course?.title || "Khóa học"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gradient-to-r from-slate-100 to-slate-200" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <div className="space-y-1 text-xs text-white/90">
              {infoItems.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
            {showCartButton ? (
              <button
                type="button"
                onClick={enrolled ? handleLearnNow : handleAddToCart}
                className="pointer-events-auto mt-3 inline-flex w-full items-center justify-center rounded-md bg-[#E11D48] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#BE123C]"
                disabled={actionState === "adding" || checkingEnroll}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold">
            {course?.title || "Khóa học"}
          </h3>
          {instructors ? (
            <p className="text-xs text-slate-500">{instructors}</p>
          ) : null}
          {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
          {rating ? (
            <p className="text-sm text-foreground">
              {rating}{" "}
              {reviewCount ? (
                <span className="text-slate-500">
                  ({reviewCount} đánh giá)
                </span>
              ) : null}
            </p>
          ) : null}
          {totalStudents ? (
            <p className="text-xs text-slate-500">
              {totalStudents} học viên
            </p>
          ) : null}
          <p className="text-sm font-semibold text-[#BE123C]">
            {formatPrice(course?.priceCents, course?.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
