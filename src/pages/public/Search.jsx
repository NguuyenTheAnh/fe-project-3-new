import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import PaginationBar from "@/components/catalog/PaginationBar";
import CourseCard from "@/components/catalog/CourseCard";
import { fetchCategories, fetchTags, searchCourses } from "@/api/catalog.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;

const normalizeCourses = (data) => {
  if (!data) {
    return { items: [], totalPages: 1, totalElements: 0, page: 0 };
  }
  const items = Array.isArray(data)
    ? data
    : data.content || data.items || data.results || data.data || [];
  const page =
    data.page?.number ??
    data.number ??
    data.pageNumber ??
    data.page ??
    0;
  const totalPages =
    data.page?.totalPages ?? data.totalPages ?? data.totalPage ?? 1;
  const totalElements =
    data.page?.totalElements ??
    data.totalElements ??
    data.total ??
    items.length;
  return { items, totalPages, totalElements, page };
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [courses, setCourses] = useState({
    items: [],
    totalPages: 1,
    totalElements: 0,
    page: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryState = useMemo(() => {
    const page = Number(searchParams.get("page")) || 0;
    return {
      q: searchParams.get("q") || "",
      page,
      categoryId: searchParams.get("categoryId") || "",
      tagId: searchParams.get("tagId") || "",
      level: searchParams.get("level") || "",
      language: searchParams.get("language") || "",
    };
  }, [searchParams]);

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cats, tags] = await Promise.all([
          fetchCategories(),
          fetchTags(),
        ]);
        setCategories(cats || []);
        setTags(tags || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchCourses({
          q: queryState.q || undefined,
          page: queryState.page,
          size: PAGE_SIZE,
          categoryId: queryState.categoryId || undefined,
          tagId: queryState.tagId || undefined,
          level: queryState.level || undefined,
          language: queryState.language || undefined,
        });
        setCourses(normalizeCourses(data));
      } catch (err) {
        setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [queryState]);

  const handleFilterChange = (key, value) => {
    updateParams({ [key]: value || "", page: 0 });
  };

  const handleClear = () => {
    const params = new URLSearchParams();
    if (queryState.q) params.set("q", queryState.q);
    params.set("page", "0");
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    updateParams({ page });
  };

  const handleRetry = () => {
    navigate(0);
  };

  const skeletons = Array.from({ length: 6 });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      <FilterSidebar
        categories={categories}
        tags={tags}
        values={queryState}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kết quả tìm kiếm
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {queryState.q ? `Từ khóa: "${queryState.q}"` : "Tất cả khóa học"}
            {courses.totalElements
              ? ` · ${courses.totalElements} kết quả`
              : ""}
          </p>
        </div>

        {error ? (
          <Card className="p-4">
            <p className="font-medium text-red-600">Có lỗi xảy ra</p>
            <p className="text-sm text-slate-500">
              {error || "Vui lòng thử lại."}
            </p>
            <Button variant="outline" className="mt-3" onClick={handleRetry}>
              Thử lại
            </Button>
          </Card>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skeletons.map((_, idx) => (
              <Card
                key={idx}
                className="h-64 animate-pulse bg-slate-100 border border-slate-200"
              />
            ))}
          </div>
        ) : !courses.items.length ? (
          <Card className="p-4">
            <p className="font-medium">Không tìm thấy khóa học nào</p>
            <p className="text-sm text-slate-500">
              Hãy thử đổi từ khóa hoặc bộ lọc khác.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.items.map((course, idx) => (
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
            </div>
            <PaginationBar
              page={courses.page}
              totalPages={courses.totalPages}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
