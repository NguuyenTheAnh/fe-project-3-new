import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import PaginationBar from "@/components/catalog/PaginationBar";
import CourseCard from "@/components/catalog/CourseCard";
import { fetchCategories, fetchTags, searchCourses } from "@/api/catalog.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "relevance", label: "Phù hợp nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
];

const LEVEL_LABELS = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_LABELS = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
};

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

const resolveNameById = (items, id) => {
  if (!id) return "";
  const match = items.find(
    (item) => String(item.id || item.code) === String(id)
  );
  return match?.name || match?.title || "";
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
      sort: searchParams.get("sort") || "relevance",
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
        const [cats, tagsResponse] = await Promise.all([
          fetchCategories(),
          fetchTags(),
        ]);
        setCategories(cats || []);
        setTags(tagsResponse || []);
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
        const sortParam =
          queryState.sort && queryState.sort !== "relevance"
            ? queryState.sort
            : undefined;
        const data = await searchCourses({
          q: queryState.q || undefined,
          page: queryState.page,
          size: PAGE_SIZE,
          categoryId: queryState.categoryId || undefined,
          tagId: queryState.tagId || undefined,
          level: queryState.level || undefined,
          language: queryState.language || undefined,
          sort: sortParam,
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

  const handleSortChange = (value) => {
    updateParams({
      sort: value === "relevance" ? null : value,
      page: 0,
    });
  };

  const totalElements = courses.totalElements || 0;
  const selectedCategory = resolveNameById(categories, queryState.categoryId);
  const selectedTag = resolveNameById(tags, queryState.tagId);
  const selectedLevel = queryState.level
    ? LEVEL_LABELS[queryState.level] || queryState.level
    : "";
  const selectedLanguage = queryState.language
    ? LANGUAGE_LABELS[queryState.language] || queryState.language
    : "";

  const chips = [
    { label: "Danh mục", value: selectedCategory },
    { label: "Thẻ", value: selectedTag },
    { label: "Ngôn ngữ", value: selectedLanguage },
    { label: "Trình độ", value: selectedLevel },
  ];

  const skeletons = Array.from({ length: 8 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kết quả tìm kiếm
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {queryState.q
            ? `Từ khóa: "${queryState.q}"`
            : "Tất cả khóa học"}
          {totalElements ? ` · ${totalElements} kết quả` : ""}
        </p>

        <div className="mt-4 mb-6 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="h-9 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Tất cả bộ lọc
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-auto px-4 pb-4">
                  <FilterSidebar
                    categories={categories}
                    tags={tags}
                    values={queryState}
                    onChange={handleFilterChange}
                  />
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline" onClick={handleClear}>
                      Xóa bộ lọc
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button>Áp dụng</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {chips.map((chip) => {
              const isActive = Boolean(chip.value);
              return (
                <span
                  key={chip.label}
                  className={`inline-flex h-9 items-center rounded-full border px-3 text-sm transition ${
                    isActive
                      ? "border-[#F43F5E]/30 bg-[#FFF1F2] text-[#BE123C]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {chip.label}
                  {chip.value ? `: ${chip.value}` : ""}
                </span>
              );
            })}
            <button
              type="button"
              onClick={handleClear}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Xóa bộ lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sắp xếp</span>
            <Select
              value={queryState.sort || "relevance"}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phù hợp nhất" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-slate-600">
            Tất cả khóa học
            {totalElements ? ` · ${totalElements} kết quả` : ""}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skeletons.map((_, idx) => (
              <Card
                key={idx}
                className="h-64 animate-pulse bg-slate-100 border border-slate-200"
              />
            ))}
          </div>
        ) : !courses.items.length ? (
          <Card className="p-4">
            <p className="font-medium">Không tìm thấy khóa học phù hợp</p>
            <p className="text-sm text-slate-500">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
