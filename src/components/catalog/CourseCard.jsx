import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const formatPrice = (price) => {
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

export default function CourseCard({ course }) {
  const id = course?.id ?? course?.courseId ?? course?.slug;
  const href = id ? `/courses/${id}` : "#";
  const thumbnail = course?.thumbnail || course?.imageUrl;
  const instructors = course?.instructors || course?.teachers || [];
  const rating = course?.rating;
  const reviewCount = course?.reviewCount ?? course?.numReviews;

  return (
    <Link to={href}>
      <Card className="h-full overflow-hidden transition hover:shadow-md">
        {thumbnail ? (
          <div className="aspect-video w-full bg-muted/60">
            <img
              src={thumbnail}
              alt={course?.title || "Khóa học"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-r from-muted to-muted-foreground/20" />
        )}
        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold">
            {course?.title || "Khóa học"}
          </h3>
          {instructors?.length ? (
            <p className="text-xs text-muted-foreground">
              {instructors.map((t) => t?.name || t).join(", ")}
            </p>
          ) : null}
          {rating ? (
            <p className="text-sm text-foreground">
              {rating}{" "}
              {reviewCount ? (
                <span className="text-muted-foreground">
                  ({reviewCount} đánh giá)
                </span>
              ) : null}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(course?.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
