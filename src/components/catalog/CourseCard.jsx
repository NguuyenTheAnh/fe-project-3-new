import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import useFileUrl from "@/hooks/useFileUrl";

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

const resolveInstructorNames = (course) => {
  if (course?.instructorName) return course.instructorName;
  if (course?.instructor) return course.instructor;
  const list = course?.instructors || course?.teachers;
  if (!Array.isArray(list)) return "";
  return list.map((t) => t?.fullName || t?.name || t).filter(Boolean).join(", ");
};

export default function CourseCard({ course }) {
  const id = course?.id ?? course?.courseId ?? course?.slug;
  const href = id ? `/courses/${id}` : "#";
  const { url: thumbnailUrl } = useFileUrl(course?.thumbnail || course?.image);
  const instructors = resolveInstructorNames(course);
  const rating = course?.ratingAvg ?? course?.rating;
  const reviewCount = course?.ratingCount ?? course?.reviewCount;
  const totalStudents = course?.totalStudents ?? course?.studentCount;
  const level = course?.level ? LEVEL_LABELS[course.level] || course.level : "";
  const language = course?.language
    ? LANGUAGE_LABELS[course.language] || course.language
    : "";
  const meta = [level, language].filter(Boolean).join(" • ");

  return (
    <Link to={href}>
      <Card className="h-full overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition">
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
        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold">
            {course?.title || "Khóa học"}
          </h3>
          {instructors ? <p className="text-xs text-slate-500">{instructors}</p> : null}
          {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
          {rating ? (
            <p className="text-sm text-foreground">
              {rating} {reviewCount ? <span className="text-slate-500">({reviewCount} đánh giá)</span> : null}
            </p>
          ) : null}
          {totalStudents ? (
            <p className="text-xs text-slate-500">{totalStudents} học viên</p>
          ) : null}
          <p className="text-sm font-semibold text-[#BE123C]">
            {formatPrice(course?.priceCents, course?.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
