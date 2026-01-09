import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import { fetchCategories, searchCourses } from "@/api/catalog.api";
import { Card } from "@/components/ui/card";
import hero01 from "@/assets/carousel/hero-01-red-learning.jpg";
import hero02 from "@/assets/carousel/hero-02-red-hoodie.jpg";
import hero03 from "@/assets/carousel/hero-03-workspace.jpg";
import hero04 from "@/assets/carousel/hero-04-coffee-study.jpg";

const COURSE_LIMIT = 8;

const HERO_SLIDES = [
  {
    src: hero01,
    alt: "Học online tại nhà với tai nghe",
    title: "Học mọi lúc, mọi nơi",
    subtitle: "Khóa học chất lượng, lộ trình rõ ràng",
  },
  {
    src: hero02,
    alt: "Học tập tập trung với laptop",
    title: "Tập trung nâng cấp kỹ năng",
    subtitle: "Làm dự án thật, tiến bộ từng ngày",
  },
  {
    src: hero03,
    alt: "Góc học tập tối giản với laptop",
    title: "Dành cho cả Student / Instructor",
    subtitle: "Học và dạy trong cùng một nền tảng",
  },
  {
    src: hero04,
    alt: "Cà phê và laptop cho buổi học hiệu quả",
    title: "Bắt đầu ngay hôm nay",
    subtitle: "Chọn khóa học phù hợp với bạn",
  },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalSlides = HERO_SLIDES.length;

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

  useEffect(() => {
    if (totalSlides <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const slideStyle = useMemo(
    () => ({ transform: `translateX(-${activeIndex * 100}%)` }),
    [activeIndex]
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={slideStyle}
        >
          {HERO_SLIDES.map((slide, index) => (
            <div key={slide.alt} className="relative w-full shrink-0">
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-[360px] md:h-[420px] object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10 after:absolute after:inset-0 after:bg-red-600/10 after:content-['']" />
              <div className="absolute inset-0 flex items-end">
                <div className="p-6 md:p-10 text-white space-y-2 max-w-xl">
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/80">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.alt}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === activeIndex
                  ? "bg-[#E11D48]"
                  : "bg-white/60 hover:bg-white"
              }`}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section>
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
      </section>

      <section>
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
      </section>
    </div>
  );
}
