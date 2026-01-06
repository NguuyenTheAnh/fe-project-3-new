import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourseDetail } from "@/api/catalog.api";
import { useAuth } from "@/contexts/AuthContext";

const LEVEL_MAP = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_MAP = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
};

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

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCourseDetail(courseId);
        setCourse(data);
      } catch (err) {
        setError(err?.message || "Không tải được thông tin khóa học.");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [courseId]);

  const sections = useMemo(() => {
    if (!course) return [];
    return course.sections || course.curriculum || course.chapters || [];
  }, [course]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: `/courses/${courseId}` } });
      return;
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="font-semibold text-destructive">Có lỗi xảy ra</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card className="p-4">
        <p className="font-semibold">Không tìm thấy khóa học</p>
        <p className="text-sm text-muted-foreground">
          Vui lòng thử lại sau.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {course.category?.name || course.categoryName || "Khóa học"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {course.shortDescription || course.subtitle || "Khóa học trực tuyến"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {course.language ? (
            <span className="rounded-full bg-muted px-3 py-1">
              {LANGUAGE_MAP[course.language] || course.language}
            </span>
          ) : null}
          {course.level ? (
            <span className="rounded-full bg-muted px-3 py-1">
              {LEVEL_MAP[course.level] || course.level}
            </span>
          ) : null}
          {course.tags?.length
            ? course.tags.map((tag) => (
                <span
                  key={tag.id || tag.name}
                  className="rounded-full bg-muted px-3 py-1"
                >
                  {tag.name || tag.title}
                </span>
              ))
            : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-2xl font-semibold">{formatPrice(course.price)}</p>
          {course.rating ? (
            <p className="text-sm text-foreground">
              {course.rating}{" "}
              {course.reviewCount ? (
                <span className="text-muted-foreground">
                  ({course.reviewCount} đánh giá)
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" onClick={handleEnroll}>
            Đăng ký học
          </Button>
          <Button size="lg" variant="outline">
            Lưu vào danh sách
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Giới thiệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{course.description || "Giới thiệu về khóa học."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Ngôn ngữ: </span>
              {LANGUAGE_MAP[course.language] || course.language || "Không rõ"}
            </p>
            <p>
              <span className="font-medium text-foreground">Trình độ: </span>
              {LEVEL_MAP[course.level] || course.level || "Không rõ"}
            </p>
            {course.category?.name || course.categoryName ? (
              <p>
                <span className="font-medium text-foreground">Danh mục: </span>
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
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {course.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
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
                <div key={section.id || idx} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {section.title || section.name || `Phần ${idx + 1}`}
                  </p>
                  {section.lessons?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              Nội dung khóa học sẽ được hiển thị sau.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
