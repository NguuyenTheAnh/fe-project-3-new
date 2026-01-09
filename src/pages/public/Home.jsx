import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import { fetchCategories, searchCourses } from "@/api/catalog.api";
import { Card } from "@/components/ui/card";

const COURSE_LIMIT = 8;

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const catsPromise = fetchCategories();
        let latestCourses;
        try {
          latestCourses = await searchCourses({
            page: 0,
            size: COURSE_LIMIT,
            sort: "newest",
          });
        } catch (error) {
          latestCourses = await searchCourses({ page: 0, size: COURSE_LIMIT });
        }
        const cats = await catsPromise;
        setCategories((cats || []).slice(0, 8));
        const list = Array.isArray(latestCourses)
          ? latestCourses
          : latestCourses?.content ||
            latestCourses?.items ||
            latestCourses?.results ||
            [];
        setCourses(list.slice(0, COURSE_LIMIT));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Danh mục nổi bật
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Khám phá các chủ đề phổ biến.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id || cat.code}
              variant="secondary"
              size="sm"
              asChild
            >
              <Link to={`/search?categoryId=${cat.id || cat.code}&page=0`}>
                {cat.name || cat.title}
              </Link>
            </Button>
          ))}
          {!categories.length && !loading ? (
            <p className="text-sm text-slate-500">
              Chưa có danh mục để hiển thị.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Khóa học mới</h2>
            <p className="mt-1 text-sm text-slate-600">Gợi ý dành cho bạn.</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/search">Xem tất cả</Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: COURSE_LIMIT }).map((_, idx) => (
              <Card
                key={idx}
                className="h-64 animate-pulse bg-slate-100 border border-slate-200"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course, idx) => (
              <CourseCard
                key={
                  course.id ||
                  course.courseId ||
                  course.slug ||
                  course.title ||
                  idx
                }
                course={course}
              />
            ))}
            {!courses.length ? (
              <p className="text-sm text-slate-500">
                Chưa có khóa học để hiển thị.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
